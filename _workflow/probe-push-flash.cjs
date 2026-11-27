#!/usr/bin/env node
/**
 * Push 瞬态探针：高频采样 current/next 的 src + transform，
 * 检测归位瞬间是否存在「旧图出现在可见区」的窗口（用户报告的闪图）。
 */
const fs = require("node:fs");
const path = require("node:path");
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

  // 暂停自动播放，回到确定的首张
  await page.locator("#themeFrame").hover();
  await page.evaluate(() => {
    // 通过点第一个 dot 回到首张，等待稳定
  });
  await page.locator("#themeDots .dot").first().click();
  await page.waitForTimeout(1400);

  // 在页面内安装采样器：rAF 每帧记录 current 的 src 尾名与 translateX
  await page.evaluate(() => {
    window.__samples = [];
    window.__sampling = true;
    const cur = document.getElementById("themeCurrent");
    const nxt = document.getElementById("themeNext");
    function tick() {
      if (!window.__sampling) return;
      const m = new DOMMatrixReadOnly(getComputedStyle(cur).transform);
      const mn = new DOMMatrixReadOnly(getComputedStyle(nxt).transform);
      window.__samples.push({
        t: Math.round(performance.now()),
        curSrc: cur.getAttribute("src").split("/").pop(),
        curX: Math.round(m.m41),
        nxtSrc: nxt.getAttribute("src").split("/").pop(),
        nxtX: Math.round(mn.m41),
        fw: document.getElementById("themeFrame").clientWidth,
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  // 触发一次正向切换（首张→第二张）
  await page.locator("#themeDots .dot").nth(1).click();
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__sampling = false; });

  const samples = await page.evaluate(() => window.__samples);
  const t0 = samples[0].t;
  // 真正的「闪」= 过渡已完成（存在 next 到达 0 的帧）之后，又出现旧图在可见区
  const settleIdx = samples.findIndex(s => s.t - t0 > 1100 && s.nxtX === 0);
  const afterSettle = settleIdx >= 0 ? samples.slice(settleIdx) : [];
  const flashes = afterSettle.filter(s => s.curSrc === "yike.jpg" && Math.abs(s.curX) < s.fw * 0.5);
  const windowSamples = samples.filter(s => s.t - t0 >= 1050 && s.t - t0 <= 1450);

  console.log("总采样帧:", samples.length, "归位帧索引:", settleIdx);
  console.log("归位后旧图出现在可见区的帧数:", flashes.length);
  if (flashes.length) console.log("  首帧:", JSON.stringify(flashes[0]), " 末帧:", JSON.stringify(flashes[flashes.length-1]));
  console.log("归位窗口(1.05~1.45s):");
  windowSamples.forEach(s => console.log(`  +${s.t-t0}ms cur=${s.curSrc}@${s.curX} next=${s.nxtSrc}@${s.nxtX}`));

  await browser.close();
  process.exit(flashes.length === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
