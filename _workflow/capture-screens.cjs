#!/usr/bin/env node
/**
 * TimeTrace 落地页配图采集脚本（可复跑）。
 *
 * 前置：在 TimeTrace/app 下从当前源码构建 dist，并启动静态服务：
 *   node node_modules/typescript/lib/tsc.js --noEmit -p tsconfig.json
 *   node node_modules/vite/bin/vite.js build
 *   node scripts/serve-dist.cjs            # http://127.0.0.1:4180/
 *
 * 用法：node _workflow/capture-screens.cjs
 * 产出：assets/screens/{today,trend,apps,events}.png
 *
 * 说明：截图对象是从当前源码构建出的 dist，不是仓库里遗留的历史截图。
 * 浏览器用本机已装的 Edge / Chrome（playwright-core 不下载浏览器）。
 */
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const APP_DIR = "D:/JavaCode/奇思妙想/TimeTrace/TimeTrace/app";
const SITE_DIR = path.resolve(__dirname, "..");
const OUT_DIR = path.join(SITE_DIR, "assets", "screens");
const BASE = process.env.SHOT_BASE || "http://127.0.0.1:4180/";
const appRequire = createRequire(path.join(APP_DIR, "package.json"));
const { chromium } = appRequire("playwright-core");

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
  console.log(`页面源：${BASE}（由当前源码构建的 dist）`);
  console.log(`采集时间：${new Date().toISOString()}`);

  for (const [id, label] of VIEWS) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${BASE}#${id}`, { waitUntil: "domcontentloaded" });
    await page.locator(".page").first().waitFor({ state: "visible", timeout: 20000 });
    await page.waitForTimeout(900);

    // 趋势配图展示 0.6.0 的年度热力图页，而不是默认的「日」分时
    if (id === "trend") {
      const yearBtn = page.locator('#view-trend .seg button', { hasText: "年" });
      if ((await yearBtn.count()) === 1) {
        await yearBtn.click();
        await page.waitForTimeout(900);
      }
    }

    // 采集版本证据：状态栏会渲染 v{version}
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
