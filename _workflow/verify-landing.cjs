#!/usr/bin/env node
/**
 * 落地页真实渲染验收：无端口（route 拦截本地文件），四档视口。
 * 检查：横向溢出、stagger、两个轮播（#137 Push / #045 Wipe）、
 * 自动播放、箭头在图片外侧、零外链、pageerror。
 * 产出截图到 screenshots/redesign-{viewport}.png
 */
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const SITE = path.resolve(__dirname, "..");
const APP = "D:/JavaCode/奇思妙想/TimeTrace/TimeTrace/app";
const BASE = "http://landing.local/";
const appRequire = createRequire(path.join(APP, "package.json"));
const { chromium } = appRequire("playwright-core");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};

const VIEWPORTS = [
  ["1366x768", 1366, 768],
  ["1440x900", 1440, 900],
  ["1920x1080", 1920, 1080],
  ["390x844", 390, 844],
];

const BROWSERS = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].filter((p) => fs.existsSync(p));

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: BROWSERS[0],
    args: ["--no-proxy-server", "--disable-dev-shm-usage"],
  });
  let failed = 0;

  for (const [name, width, height] of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    const external = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("request", (r) => {
      const u = r.url();
      if (!u.startsWith(BASE) && !u.startsWith("data:")) external.push(u);
    });

    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      let file = path.join(SITE, rel);
      if (!rel || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(SITE, "index.html");
      }
      if (!file.startsWith(SITE)) return route.abort();
      await route.fulfill({
        status: 200,
        contentType: MIME[path.extname(file)] || "application/octet-stream",
        body: fs.readFileSync(file),
      });
    });

    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.locator("h1").waitFor({ state: "visible" });
    await page.evaluate(() => document.fonts.ready);

    // stagger 三栏
    await page.locator(".standfirst").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const inCount = await page.locator(".stagger-item.in").count();

    // 自动播放：加载后不交互，4.6s 后两个轮播名称都应变化
    const autoBefore = await page.evaluate(() => ({
      view: document.getElementById("viewName").textContent,
      theme: document.getElementById("themeName").textContent,
    }));
    await page.waitForTimeout(4600);
    const autoAfter = await page.evaluate(() => ({
      view: document.getElementById("viewName").textContent,
      theme: document.getElementById("themeName").textContent,
    }));

    // 两个轮播结构
    const structure = await page.evaluate(() => {
      function probe(frameId, dotsId, nameId) {
        var f = document.getElementById(frameId);
        var d = document.getElementById(dotsId);
        var n = document.getElementById(nameId);
        var imgs = Array.prototype.slice.call(f.querySelectorAll("img"));
        return {
          dots: d.querySelectorAll(".dot").length,
          name: n.textContent,
          imgsLoaded: imgs[0].complete && imgs[0].naturalWidth > 0,
          activeDots: d.querySelectorAll('.dot[aria-current="true"]').length,
          arrows: f.closest(".carousel-stage").querySelectorAll(".carousel-arrow").length,
        };
      }
      return {
        view: probe("viewFrame", "viewDots", "viewName"),
        theme: probe("themeFrame", "themeDots", "themeName"),
      };
    });

    // 箭头在图片外侧（不遮挡）：箭头右边缘 < 图片左边缘 或 箭头左边缘 > 图片右边缘
    const arrowOutside = await page.evaluate(() => {
      var stage = document.getElementById("viewFrame").closest(".carousel-stage");
      var img = document.getElementById("viewFrame").querySelector("img").getBoundingClientRect();
      var as = Array.prototype.slice.call(stage.querySelectorAll(".carousel-arrow"));
      return as.map(function (a) {
        var b = a.getBoundingClientRect();
        return b.right <= img.left + 1 || b.left >= img.right - 1;
      });
    });

    // 名称在图片上方居中、18px/600
    const nameLayout = await page.evaluate(() => {
      var el = document.getElementById("viewName");
      var im = document.getElementById("viewFrame").querySelector("img");
      var cs = getComputedStyle(el);
      var nb = el.getBoundingClientRect(), ib = im.getBoundingClientRect();
      return {
        above: nb.bottom <= ib.top,
        centerDelta: Math.round((nb.left + nb.width / 2) - (ib.left + ib.width / 2)),
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      };
    });

    // 动效机制检测：先暂停自动播放并选一个与当前不同的目标
    await page.locator("#themeFrame").scrollIntoViewIfNeeded();
    await page.locator("#themeFrame").hover();
    await page.waitForTimeout(200);
    const themeTarget = await page.evaluate(function () {
      var ds = document.querySelectorAll("#themeDots .dot");
      var act = -1;
      ds.forEach(function (d, i) { if (d.getAttribute("aria-current") === "true") act = i; });
      return (act + 1) % ds.length;
    });
    await page.locator("#themeDots .dot").nth(themeTarget).click();
    await page.waitForTimeout(300);
    const pushMid = await page.evaluate(() => {
      var f = document.getElementById("themeFrame");
      var nxt = document.getElementById("themeNext");
      return {
        moving: f.classList.contains("moving"),
        transform: getComputedStyle(nxt).transform,
        seamOpacity: getComputedStyle(f.querySelector(".push-seam")).opacity,
      };
    });
    await page.waitForTimeout(1000);
    const pushEnd = await page.evaluate(() => ({
      name: document.getElementById("themeName").textContent,
      moving: document.getElementById("themeFrame").classList.contains("moving"),
    }));
    // 硬断言：过渡结束后 current 的 transform 必须静止（不再反向滑回 = 不播放两次）
    await page.waitForTimeout(120);
    const settleA = await page.evaluate(() =>
      getComputedStyle(document.getElementById("themeCurrent")).transform);
    await page.waitForTimeout(260);
    const settleB = await page.evaluate(() =>
      getComputedStyle(document.getElementById("themeCurrent")).transform);
    const noReverse = settleA === settleB;

    // Wipe：点视图 dot，过渡中 clip-path 应在变化
    await page.locator("#viewFrame").scrollIntoViewIfNeeded();
    await page.locator("#viewFrame").hover();
    await page.waitForTimeout(200);
    const viewNameBefore = await page.locator("#viewName").textContent();
    const viewTarget = await page.evaluate(function () {
      var ds = document.querySelectorAll("#viewDots .dot");
      var act = -1;
      ds.forEach(function (d, i) { if (d.getAttribute("aria-current") === "true") act = i; });
      return (act + 1) % ds.length;
    });
    await page.locator("#viewDots .dot").nth(viewTarget).click();
    await page.waitForTimeout(300);
    const wipeMid = await page.evaluate(() => {
      var top = document.getElementById("viewTop");
      return {
        clip: getComputedStyle(top).clipPath,
        edgeOpacity: getComputedStyle(document.querySelector(".wipe-edge")).opacity,
      };
    });
    await page.waitForTimeout(1000);
    const wipeEnd = await page.evaluate(() => ({
      name: document.getElementById("viewName").textContent,
    }));

    const geometry = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    const overflow = geometry.scrollWidth > geometry.clientWidth;

    const viewOk = structure.view.dots === 4 && structure.view.imgsLoaded &&
      structure.view.activeDots === 1 && structure.view.arrows === 2;
    const themeOk = structure.theme.dots === 5 && structure.theme.imgsLoaded &&
      structure.theme.activeDots === 1 && structure.theme.arrows === 2;
    const autoOk = autoAfter.view !== autoBefore.view && autoAfter.theme !== autoBefore.theme;
    const nameOk = nameLayout.above && Math.abs(nameLayout.centerDelta) <= 2 &&
      nameLayout.fontSize === "18px" && Number(nameLayout.fontWeight) >= 600;
    const arrowsOk = width >= 1240 ? arrowOutside.every(Boolean) : true;
    const pushOk = pushMid.moving && pushMid.transform !== "none" &&
      Number(pushMid.seamOpacity) > 0 && pushEnd.name !== autoAfter.theme && !pushEnd.moving && noReverse;
    const wipeOk = wipeMid.clip !== "none" && Number(wipeMid.edgeOpacity) > 0 &&
      wipeEnd.name !== viewNameBefore;
    const pass = !overflow && errors.length === 0 && external.length === 0 &&
      inCount === 3 && viewOk && themeOk && autoOk && nameOk && arrowsOk && pushOk && wipeOk;
    if (!pass) failed++;

    await page.screenshot({
      path: path.join(SITE, "screenshots", `redesign-${name}.png`),
      fullPage: true,
    });

    console.log(`[${name}] ${pass ? "PASS" : "FAIL"}`);
    console.log(`  overflow=${overflow} stagger=${inCount}/3 pageerror=${errors.length} external=${external.length}`);
    console.log(`  view=${JSON.stringify(structure.view)} theme=${JSON.stringify(structure.theme)}`);
    console.log(`  auto ${JSON.stringify(autoBefore)}->${JSON.stringify(autoAfter)} name=${JSON.stringify(nameLayout)} arrowsOutside=${JSON.stringify(arrowOutside)}`);
    console.log(`  pushMid=${JSON.stringify(pushMid)} pushEnd=${JSON.stringify(pushEnd)} noReverse=${noReverse} settle=${settleA}|${settleB}`);
    console.log(`  wipeMid=${JSON.stringify(wipeMid)} wipeEnd=${JSON.stringify(wipeEnd)}`);
    if (errors.length) console.log(`  errors: ${errors.slice(0, 2).join(" | ")}`);
    if (external.length) console.log(`  external: ${external.slice(0, 3).join(" | ")}`);
    await page.close();
  }

  await browser.close();
  console.log(failed === 0 ? "ALL VIEWPORTS PASS" : `FAILED VIEWPORTS: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
