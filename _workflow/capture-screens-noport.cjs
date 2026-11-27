#!/usr/bin/env node
/**
 * 无端口截图采集：playwright route 拦截把虚拟域名映射到 dist 文件。
 * 绕开沙箱对 127.0.0.1 监听的限制（EACCES / WinError 10013）。
 * 前置：在 TimeTrace/app 下重新 tsc + vite build。
 * 产出：assets/screens/{today,trend,apps,events}.png
 */
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const APP_DIR = "D:/JavaCode/奇思妙想/TimeTrace/TimeTrace/app";
const SITE_DIR = path.resolve(__dirname, "..");
const DIST = path.join(APP_DIR, "dist");
const OUT_DIR = path.join(SITE_DIR, "assets", "screens");
const BASE = "http://tt-local.test/";

const appRequire = createRequire(path.join(APP_DIR, "package.json"));
const { chromium } = appRequire("playwright-core");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

const BROWSERS = [
  process.env.SHOT_BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
].filter(Boolean);

const VIEWS = [
  ["today", "今天"],
  ["trend", "趋势"],
  ["apps", "应用"],
  ["events", "事件"],
];

fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const exe = BROWSERS.find((p) => fs.existsSync(p));
  if (!exe) throw new Error("找不到本机 Edge / Chrome，请设置 SHOT_BROWSER");
  const browser = await chromium.launch({
    headless: true,
    executablePath: exe,
    args: ["--no-proxy-server", "--disable-dev-shm-usage"],
  });

  console.log(`浏览器：${exe}`);
  console.log(`页面源：${DIST}（当前源码重新构建）`);
  console.log(`采集时间：${new Date().toISOString()}`);

  for (const [id, label] of VIEWS) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      let file = path.join(DIST, rel);
      if (!rel || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(DIST, "index.html");
      }
      if (!file.startsWith(DIST)) return route.abort();
      const body = fs.readFileSync(file);
      await route.fulfill({
        status: 200,
        contentType: MIME[path.extname(file)] || "application/octet-stream",
        body,
      });
    });

    await page.goto(`${BASE}#${id}`, { waitUntil: "domcontentloaded" });
    await page.locator(".page").first().waitFor({ state: "visible", timeout: 20000 });
    await page.waitForTimeout(900);

    if (id === "trend") {
      const yearBtn = page.locator('#view-trend .seg button', { hasText: "年" });
      if ((await yearBtn.count()) === 1) {
        await yearBtn.click();
        await page.waitForTimeout(900);
      }
    }

    const version = await page
      .locator("body")
      .innerText()
      .then((t) => (t.match(/v0\.\d+\.\d+/) || ["未读到"])[0])
      .catch(() => "未读到");

    const file = path.join(OUT_DIR, `${id}.png`);
    await page.screenshot({ path: file, fullPage: false });
    const bytes = fs.statSync(file).size;
    console.log(`  ${label} #${id} → ${path.basename(file)} · ${bytes} bytes · 状态栏 ${version} · pageerror ${pageErrors.length}`);
    if (pageErrors.length) console.log(`    ${pageErrors.slice(0, 2).join(" | ")}`);
    await page.close();
  }

  await browser.close();
  console.log("完成。");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
