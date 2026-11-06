#!/usr/bin/env node
/**
 * 落地页整页截图 + 三档视口冒烟（可复跑）。
 *
 * 自带一个零依赖静态服务（127.0.0.1:4181），用本机 Edge / Chrome 渲染：
 *   - screenshots/1366x768.png、1440x900.png、1920x1080.png
 *   - _workflow/viewport-check.json（横向溢出、图片加载、交互、console 错误）
 *
 * 用法：node _workflow/capture-page.cjs
 */
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { createRequire } = require("node:module");

const APP_DIR = "D:/JavaCode/奇思妙想/TimeTrace/TimeTrace/app";
const SITE_DIR = path.resolve(__dirname, "..");
const SHOT_DIR = path.join(SITE_DIR, "screenshots");
const PORT = Number(process.env.PAGE_PORT || 4181);
const BASE = `http://127.0.0.1:${PORT}/`;
const appRequire = createRequire(path.join(APP_DIR, "package.json"));
const { chromium } = appRequire("playwright-core");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

const BROWSERS = [
  process.env.SHOT_BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].filter(Boolean);

const SIZES = [
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];

fs.mkdirSync(SHOT_DIR, { recursive: true });

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
  const file = path.join(SITE_DIR, rel);
  if (!file.startsWith(SITE_DIR)) {
    res.writeHead(403);
    return res.end("403");
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("404");
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
});

(async () => {
  const exe = BROWSERS.find((p) => fs.existsSync(p));
  if (!exe) throw new Error("找不到本机 Edge / Chrome，请设置 SHOT_BROWSER");

  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  const browser = await chromium.launch({
    headless: true,
    executablePath: exe,
    args: ["--no-proxy-server", "--disable-dev-shm-usage"],
  });

  const report = [];
  for (const [w, h] of SIZES) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });

    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.locator(".hero-art img").waitFor({ state: "visible", timeout: 15000 });
    await page.waitForTimeout(700);

    const images = await page.evaluate(() =>
      Array.from(document.images).map((i) => ({
        src: i.getAttribute("src"),
        loaded: i.complete && i.naturalWidth > 0,
      }))
    );
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));

    // 交互冒烟：点「趋势」后，第 2 张图应成为 active
    await page.locator('#viewSeg button[data-view="1"]').click();
    await page.waitForTimeout(320);
    const switchOk = await page.evaluate(() => {
      const imgs = document.querySelectorAll("#viewStage img");
      return {
        activeIndex: Array.from(imgs).findIndex((i) => i.classList.contains("is-active")),
        segIndex: Number(document.getElementById("viewSeg").getAttribute("data-active")),
        caption: document.getElementById("viewCap").textContent.slice(0, 12),
      };
    });
    await page.locator('#viewSeg button[data-view="0"]').click();
    await page.waitForTimeout(320);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(220);
    const file = path.join(SHOT_DIR, `${w}x${h}.png`);
    await page.screenshot({ path: file, fullPage: true });
    if (w === 1440) {
      await page.screenshot({ path: path.join(SHOT_DIR, "hero-1440x900.png"), fullPage: false });
      await page.locator("#friends").screenshot({ path: path.join(SHOT_DIR, "friends-1440x900.png") });
    }
    const bytes = fs.statSync(file).size;

    const entry = {
      viewport: `${w}x${h}`,
      file: path.basename(file),
      bytes,
      overflow,
      imagesLoaded: images.filter((i) => i.loaded).length,
      imagesTotal: images.length,
      switch: switchOk,
      pageErrors: errors,
    };
    report.push(entry);
    console.log(`${w}x${h}: ${bytes} bytes · 横向溢出 ${overflow.overflow} · 图片 ${entry.imagesLoaded}/${entry.imagesTotal} · 切换 ${switchOk.segIndex}/${switchOk.activeIndex} · error ${errors.length}`);
    await page.close();
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  fs.writeFileSync(
    path.join(SITE_DIR, "_workflow", "viewport-check.json"),
    JSON.stringify({ capturedAt: new Date().toISOString(), browser: exe, report }, null, 2) + "\n",
    "utf-8"
  );
  console.log("完成，证据写入 _workflow/viewport-check.json");
})().catch(async (err) => {
  console.error(err);
  server.close();
  process.exit(1);
});
