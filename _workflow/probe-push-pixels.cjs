#!/usr/bin/env node
/**
 * Push 像素级探针：归位后逐帧截取轮播区域，比较像素签名，
 * 检测「实际渲染」是否闪回前一张（DOM 属性探针抓不到解码延迟）。
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { createRequire } = require("node:module");
const SITE = path.resolve(__dirname, "..");
const APP = "D:/JavaCode/奇思妙想/TimeTrace/TimeTrace/app";
const BASE = "http://probe.local/";
const appRequire = createRequire(path.join(APP, "package.json"));
const { chromium } = appRequire("playwright-core");
const MIME = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".png":"image/png", ".jpg":"image/jpeg", ".woff2":"font/woff2", ".svg":"image/svg+xml" };
const BROWSERS = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe","C:/Program Files/Microsoft/Edge/Application/msedge.exe","C:/Program Files/Google/Chrome/Application/chrome.exe"].filter(p=>fs.existsSync(p));

(async () => {
  const browser = await chromium.launch({ headless:true, executablePath:BROWSERS[0], args:["--no-proxy-server","--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport:{width:1440,height:900} });
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/,"");
    let file = path.join(SITE, rel);
    if (!rel || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(SITE,"index.html");
    if (!file.startsWith(SITE)) return route.abort();
    await route.fulfill({ status:200, contentType:MIME[path.extname(file)]||"application/octet-stream", body:fs.readFileSync(file) });
  });
  await page.goto(BASE, { waitUntil:"domcontentloaded" });
  await page.locator("#themeFrame").scrollIntoViewIfNeeded();
  await page.locator("#themeFrame").hover();
  await page.locator("#themeDots .dot").first().click();
  await page.waitForTimeout(1400);

  const el = page.locator("#themeFrame");
  // 基准：首张稳定态像素
  const baseline = await el.screenshot();
  const baseHash = crypto.createHash("sha256").update(baseline).digest("hex").slice(0,16);

  // 切到第二张
  await page.locator("#themeDots .dot").nth(1).click();
  // 过渡 1.15s，从 1.2s 开始逐帧截 8 帧（每 60ms）
  const frames = [];
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(60);
    const buf = await el.screenshot();
    const h = crypto.createHash("sha256").update(buf).digest("hex").slice(0,16);
    frames.push({ at: 1200 + i*60, hash: h, sameAsBase: h === baseHash });
  }
  // 稳定态：第二张
  await page.waitForTimeout(500);
  const finalBuf = await el.screenshot();
  const finalHash = crypto.createHash("sha256").update(finalBuf).digest("hex").slice(0,16);

  console.log("首张基准 hash:", baseHash);
  console.log("最终第二张 hash:", finalHash);
  console.log("归位后逐帧:");
  frames.forEach(f => console.log(`  +${f.at}ms ${f.hash} ${f.sameAsBase ? "<== 与首张相同(闪旧图!)" : ""}`));

  // 闪 = 归位后(>=1200ms)有帧与首张基准像素相同
  const flashFrames = frames.filter(f => f.sameAsBase);
  console.log("归位后闪回首张的帧数:", flashFrames.length);
  await browser.close();
  process.exit(flashFrames.length === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
