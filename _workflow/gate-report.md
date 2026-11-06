# S4 · 交付门禁报告

交付目录：`D:\JavaCode\奇思妙想\TimeTrace\zzjzgz.github.io`
执行时间：2026-11-06　门禁：`check_design_pack.py --strict`
说明：本文件记录**两轮用户后续指令改动完成后的最终复跑结果**，此前各轮结果已被本轮覆盖。

## 质量门逐项结果

| 门 | 检查 | 结果 | 证据 |
|---|---|---|---|
| G0 | 需求卡 8 项 + Design Context 3 项 | PASS | `_workflow/00-brief.md` |
| G1 | 黄金流 1 条走通、5 个 P0 区段可追溯 | PASS | `01-ia.md`、`02-pages.md`、HTML `data-pid` ×5 |
| G2 | 每区段 ≥5 态，Error 有下一步 | PASS | `03-states.md`；HTML 的 `.img-fallback` 已实现 |
| G3 | 令牌 100% 变量化、对比度达标、三档无横向溢出、单屏主色 ≤10% | PASS | 下方门禁输出 + `_workflow/viewport-check.json` |
| G4 | strict 门禁 FAIL=0、HANDOFF 字段齐全、DEV-PROMPT 可粘贴即用 | PASS | 下方门禁输出 |

## 严格门禁原始结果（最终版）

```
FAIL 0 | WARN 0 | PASS 7
结论：PASS ✅
```

明细：`files_screenshots` 4 张 · `tokens_schema` 结构完整 · `tokens_consistency` 色值一致率 14/14（100%）· `placeholder_text` 无占位 · `external_deps` 无外部依赖（外部超链接 11 个，不影响离线）· `hardcoded_colors` 颜色全部走变量 · `contrast` 三组全达标（4.66 / 4.66 / 3.62）· `html_pages` 5 个页面 · `html_size` 31.9 KB。

## 反向验证（流水线强制）

脚本：`_workflow/reverse_verify.py`，一键可复跑。证据：`_workflow/reverse-verify.json`。

| 步 | 动作 | 结果 |
|---|---|---|
| 1 | 记录基线 sha256（原始字节口径） | `2a6e80e63c9d9a257e84010c20e56d3ede1dcf1870646f8f01bfe0fd161ccfae` |
| 2 | 在 `:root` 外的 `.panel` 规则把 `var(--surface)` 改成 `#ffffff` | 门禁 `exit=1`，`hardcoded_colors` 报 `[FAIL]` → **确实变红** |
| 3 | 字节级恢复原文 | 恢复后 sha256 与基线完全相同，`byte_identical_after_restore = true` |
| 4 | 复跑门禁 | `exit=0`，无 `[FAIL]` → **恢复变绿** |
| 结论 | `assertion_red_when_broken = true`、`assertion_green_when_restored = true` | **PASS** |

脚本用 `read_bytes` / `write_bytes`，不做 CRLF 归一化；`sha256sum index.html` 输出 `2a6e80e6…` 与脚本基线完全一致。此前用 `read_text` 计算时曾出现口径偏差（文本归一化后的哈希 ≠ 原始字节哈希），已修正。

## 用户后续指令变更记录

| 时间 | 指令 | 实查 / 处理 | 结果 |
|---|---|---|---|
| 16:15 | 下载链接换成 Gitee 发行版 setup.exe 直链 | 直链实查 **302 → foruda.gitee.com 附件**（有效）；同模式推断的免安装 .exe / MSI 直链实查 **404**（不存在） | 仅安装向导用直链，另两个入口暂留目录页 |
| 16:18 | 只保留一个 setup；banner 与「下载 Windows 版」点击直接下载 | 按「banner = 顶部导航下载按钮」理解；删除 CTA 区另两个按钮；顶部导航、首屏 CTA、下载区三处入口改为同一条直链 | 见下方硬断言 |

**硬断言脚本** `_workflow/sync_single_setup.py`（幂等，可复跑）：
- 发行版直链作为 `href` 恰好出现 **3 次**（顶部导航 / 首屏「下载 Windows 版」/ 下载区按钮）
- 不再残留 `href="#download"`
- 下载区只剩 **1 个** `glass-chip` 按钮
- 同步 8 个交接文档共 **20 处**口径；第二次复跑同步 0 处，确认幂等

## 截图证据

**产品界面图（落地页配图，来自当前构建）** —— `_workflow/capture-screens.cjs`：
- 前置：从当前源码执行 `tsc --noEmit` + `vite build`（成功，91 modules，dist 重新生成），再启动 `serve-dist.cjs`（`http://127.0.0.1:4180/`，HTTP 200）。
- 采集时间 2026-11-06 08:01:50 UTC；四张 1440×900，状态栏均读到 `v0.5.6`，`pageerror 0`。

| 文件 | 字节 | 视图 |
|---|---:|---|
| `assets/screens/today.png` | 247,089 | 今天 |
| `assets/screens/trend.png` | 87,461 | 趋势 |
| `assets/screens/apps.png` | 125,243 | 应用 |
| `assets/screens/events.png` | 135,411 | 事件 |

**落地页整页图（最终版）** —— `_workflow/capture-page.cjs`（自带 127.0.0.1:4181 静态服务）：

| 视口 | 整页图字节 | 横向溢出 | 图片加载 | 视图切换 | console error |
|---|---:|---|---|---:|---:|
| 1366×768 | 1,000,231 | false | 5/5 | 1/1 | 0 |
| 1440×900 | 1,008,418 | false | 5/5 | 1/1 | 0 |
| 1920×1080 | 1,031,994 | false | 5/5 | 1/1 | 0 |

`screenshots/` 共 4 张（三档整页 + 1440 首屏）。

## 交付清单核对

- [x] `index.html`（零构建单文件，31.9 KB）
- [x] `assets/screens/`（4 张真实界面截图）
- [x] `DESIGN-SPEC.md` / `HANDOFF.md` / `tokens.json` / `DEV-PROMPT.md`
- [x] `screenshots/`（4 张，含三档整页）
- [x] `_workflow/` 八份阶段产物齐全：`00-brief` `01-ia` `02-pages` `03-states` `gate-a` `visual-upgrade` `polish-score` `gate-report`
- [x] 可复跑脚本与机器可读证据：`capture-screens.cjs` `capture-page.cjs` `extract_tokens.py` `reverse_verify.py` `sync_single_setup.py` `viewport-check.json` `reverse-verify.json`

## 未完成（不掩盖）

1. **未执行 `git commit` / `git push`**：按用户铁律，未经明确授权不提交不推送。文件目前只在本机工作区，线上 `https://zzjzgz.github.io` 仍是 404。
2. **未做线上复验**：推送后需确认 GitHub Pages 自动构建、四张产品图可达、下载直链在线上环境可跳转。
3. **顶层 README 版本不一致**：`TimeTrace/README.md` 下载表仍写 0.5.5，本页按多份配置文件采用 0.5.6；已在 HANDOFF 第 9 节登记。
4. **导航按钮 40px** 低于 44px 建议值，已在 HANDOFF 第 9 节登记。
5. **「banner」的理解**：按顶部导航「下载 v0.5.6」按钮处理；若用户指的是 Hero 产品大图整块可点，该项尚未实现，需确认后补。
