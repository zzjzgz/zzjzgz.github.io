# S3 · 审美打磨评分（先打分 → 改 → 再打分）

Design Context 原样取自 `00-brief.md`：受众为隐私敏感的 Windows 用户（部分会读源码）；用例是首次了解 → 判断可信 → 下载；品牌气质克制、诚实、安静、较真。

评分为设计自评（10 分制），依据 `impeccable` 的六维框架；**不是可测量的客观指标**，仅用于驱动改动与留档。

| 维度 | 初稿 | 终稿 | 依据 |
|---|---:|---:|---|
| 视觉层级 | 8.5 | 9.0 | H1/H2 负字距与灰度层级清晰；去掉内联 kicker 后 CTA 内部层级统一 |
| 排版 | 8.0 | 8.8 | lede 1.75、长段落 1.85、数字 tabular-nums；版本事实行改为可断行的分隔结构 |
| 色彩 | 8.5 | 9.0 | 单一强调蓝；辅助灰收敛到 4.66:1；CTA 渐变与光晕仅在转化区出现 |
| 间距节奏 | 7.5 | 9.0 | 修掉移动端 Hero 图贴边（补 `width:calc(100% - 2*pad-x)`）；区段间距统一走 `--gap-section` |
| 动效 | 8.5 | 8.8 | 四档时长与曲线族一致；press / hover / segmented / crossfade 均可中断；reduced-motion 三信号齐 |
| 文案 | 8.5 | 9.0 | 全部事实可核对；主动写明「演示数据」「未签名 / SmartScreen」「三处入口同链直达下载、只保留一个 setup」，无夸张数字 |
| **均分** | **8.25** | **8.93** | |

## 本轮实际改动（对应上表提分）
1. 删除 `<figure class="hero-art">` 上的内联 `max-width` 魔法数字，回归 CSS 令牌。
2. 删除 CTA kicker 的内联样式，新增 `.cta .kicker` 规则，全站零内联样式声明。
3. 新增 `<link rel="icon" href="data:,">`：消除浏览器自动请求 favicon 造成的 404，**1366 档 console error 1 → 0**。
4. Hero 图补 `width:calc(100% - 2 * var(--pad-x))`，窄屏不再贴边。
5. `_workflow/capture-page.cjs` 增加「截前滚回顶部」与首屏视口图，截图证据更可核对。
6. 按用户指定把安装向导换成发行版直链；实查另两种产物直链 404 后保留目录页，并同步全部交接文档口径（第一轮同步，最终口径由 `_workflow/sync_single_setup.py` 统一并带硬断言）。
7. 按用户后续指令把下载区收敛为单个 setup 按钮，顶部导航与首屏「下载 Windows 版」改为同链直达下载；口径同步与硬断言脚本 `_workflow/sync_single_setup.py`。

## 复跑证据
`node _workflow/capture-page.cjs` 复跑后：1366 / 1440 / 1920 三档横向溢出均为 `false`，图片 5/5 加载，视图切换 `1/1`，console error 均为 0。明细见 `_workflow/viewport-check.json`。

## 未采纳（按流水线默认禁用）
`bolder.md` / `overdrive.md` / `delight.md` 类强效果未启用：产品气质是克制诚实，且这是官网而非活动营销页；启用会与 Design Context 冲突。
