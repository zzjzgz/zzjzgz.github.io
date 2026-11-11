# HANDOFF · TimeTrace · 一刻 落地页官网

> 本文件面向研发与人机协作。视觉唯一真源是同目录的 `tokens.json`，本文件不重复定义色值。
> 版本：1.0.0　交付日期：2026-11-06　设计稿：`index.html`

---

## 1. 项目概览

- **一句话定位**：本地优先的 Windows 应用使用时长统计工具 TimeTrace 的对外宣传落地页，托管于 `https://zzjzgz.github.io`。
- **目标用户**：关心「电脑时间花在哪里」、拒绝账号与云同步的 Windows 用户；以及会核对技术栈的开发者。
- **交付范围**：P0 区段 5 个（首页 / 为什么 / 界面 / 隐私 / 下载），单页长滚动；P1 未做：博客、文档站、更新日志页、多语言、后台、埋点。
- **技术建议**：原生 HTML + CSS + 少量原生 JS，零构建、零依赖。样式必须由 `tokens.json` 生成 `:root`，禁止另立一套色值；不要引入 Tailwind / React / 构建链——这是可直接双击打开的静态页面，也是 GitHub Pages 的源。
- **运行方式**：`index.html` 可直接双击打开；本地服务可用 `python -m http.server` 或 `_workflow/capture-page.cjs` 自带的零依赖静态服务。

## 2. 页面清单与路由

单页，路由即锚点，无前端路由库。

| Page ID | 名称 | 路由 | 主任务 | 优先级 | 入口 |
|---|---|---|---|---|---|
| P1 | 首页 | `#top` / `/` | 理解主张 + 看到真实界面 | P0 | 域名根 / 外链 |
| P2 | 为什么 | `#why` | 判断可信度 | P0 | P1 / 导航 |
| P3 | 界面 | `#views` | 切换四视图确认功能 | P0 | P2 / 导航 |
| P4 | 隐私 | `#privacy` | 核对记录边界 | P0 | P3 / 导航 |
| P5 | 下载 | `#download` | 到达发布仓 | P0 | 导航 CTA / P4 / FAQ |
| — | 数据属于你 | `#data` | 支撑信任链 | P1 支撑 | P3 之后 |
| — | 规格 | `#spec` | 技术核对 | P1 支撑 | P4 之前 |
| — | FAQ | `#faq` | 扫除剩余疑问 | P1 支撑 | P5 之后 |
| — | 友情链接 | `#friends` | 单条互推（屿见官网） | P1 支撑 | 顶部导航「友链」/ FAQ 之后 |

## 3. 设计令牌

**完整值见 `tokens.json`（由 `_workflow/extract_tokens.py` 从 `:root` 实解析，46 个令牌）。** 关键项速览：

| 类别 | 令牌 | 值 | 用途 |
|---|---|---|---|
| 页面底 | `--bg` | `#f5f5f7` | 冷灰白地面 |
| 表面 | `--surface` | `#ffffff` | 统一白面板 |
| 正文 | `--text` / `--text-body` | `#1d1d1f` / `#424245` | 标题 / 长文 |
| 辅助 | `--text-2` / `--text-3` | `#6e6e73` | 说明、图注（4.66:1） |
| 强调 | `--accent` | `#0071e3` | 主按钮、链接、焦点环 |
| 发丝线 | `--hairline` | `rgba(0,0,0,0.07)` | 面板内行分隔 |
| 圆角 | `--r-card` / `--r-panel` / `--r-hero` | `18px` / `22px` / `26px` | 截图 / 面板 / CTA |
| 阴影 | `--sh-panel` / `--sh-lift` | 双层值 | 静态 / hover 抬升 |
| 动效 | `--dur-1..4` | `120/180/280/420ms` | 四档时长 |

**硬约束**：`:root` 之外出现任何十六进制色值都会被 `check_design_pack.py --strict` 判 FAIL。组件内一律 `var(--…)`；半透明可用 `rgba()`。

## 4. 组件清单与状态

| 组件 | 选择器 | 变体 | 状态 | 备注 |
|---|---|---|---|---|
| 粘性玻璃导航 | `.nav` / `.nav.scrolled` | 顶部 / 已滚动 | 滚动 > 8px 时 hairline 渐入 | 唯一带 backdrop-filter 的常驻层 |
| 主按钮 | `.btn-primary` | 主 / 次 | default · hover · active · focus-visible | `:active` 120ms scale(0.97) |
| 统一白面板 | `.panel` + `.row + .row` | 单列 / 两列 | 静态 | 同类条目不得拆成独立带色卡片 |
| 分段控件 | `.seg` / `.seg-thumb` | 4 档 | 点击 / 方向键 / 过渡中 | 滑块用 `transform` + transition，可中断 |
| 截图舞台 | `.screen-stage img.is-active` | 4 张 | crossfade / 图片 Error | 280ms，`opacity` + `translateY` |
| 图片降级 | `.img-fallback` | Hero / 舞台 | onerror 显示 | 必须带可点击的下一步 |
| 彩色 CTA | `.cta` / `.glass-chip` / `.orb` | — | press / hover | 玻璃按钮只在彩色底上出现 |
| 来源徽标 | `.source-badge` | — | 静态 | 声明截图版本与来源 |

## 5. 交互与状态矩阵

| 区段 | Initial | Loading | Empty | Error | Success | 其他 |
|---|---|---|---|---|---|---|
| P1 | 首屏渲染 | 图片解码 | 不适用 | 降级面板 + 发布仓链接 | 5/5 图加载、0 error | hover lift（仅精确指针） |
| P3 | 默认「今天」 | 280ms crossfade | 不适用 | 降级面板 + 链接 | 下标 / aria / 图注一致 | 左右方向键可切换 |
| P5 | 一个玻璃按钮（顶部导航 / 首屏两处入口同链） | 外链由浏览器负责 | 不适用 | 离线不可达，见第 9 节 | 触发 setup.exe 下载 | 外链均 `noopener noreferrer` |

触发方式：点击 `#viewSeg` 的四个按钮，或聚焦后按左右方向键；`#viewStage` 的 `aria-live="polite"` 会播报图注变化。完整矩阵见 `_workflow/03-states.md`。

## 6. 响应式规则

- 单一设计 + `clamp()`，断点 `680px`：两列隐私对照与规格表折叠为单列；导航中间链接隐藏（保留品牌与下载 CTA）。
- Hero 图宽度 `calc(100% - 2 * var(--pad-x))`，最大 1080px，窄屏不贴边。
- 三档实测：1366×768 / 1440×900 / 1920×1080 均无横向溢出（证据 `_workflow/viewport-check.json`）。
- 触摸目标：主按钮与分段控件 ≥ 44px；导航按钮 40px（已知限制，见第 9 节）。
- 无障碍动效：`prefers-reduced-motion` / `prefers-reduced-transparency` / `prefers-contrast` 三段同批交付；hover 动效门控在精确指针。

## 7. 数据与接口需求

**无接口、无表单、无埋点。** 本页是静态内容，所有「数据」是构建期写入的可核对事实：

| 字段 | 值 | 来源 |
|---|---|---|
| 版本 | 0.6.1 | `app/package.json`、`src-tauri/Cargo.toml`、`tauri.conf.json`、`latest.json`、CHANGELOG |
| 发布日期 | 2026-11-10 | CHANGELOG / 发布仓 `latest.json` |
| 技术栈 | Tauri 2 · Rust · React 19 · TypeScript · SQLite | `TimeTrace/README.md` |
| 四视图 | 今天 / 趋势 / 应用 / 事件 | `app/src/components/ChapterNav.tsx` |
| 记录边界 | README「它记录什么」表 | `TimeTrace/README.md` |
| 安装包直链 | Gitee `releases/v0.6.1/TimeTrace_0.6.1_x64-setup.exe`（raw） | 实查 200、3,131,304 字节；SHA256 与 `latest.json` 一致 |
| 其他产物 | Gitee `releases/v0.6.1` 目录 | 仅在 CTA 提示文案中给出目录页；不设按钮 |
| 许可 | 木兰宽松许可证 v2 | `LICENSE` |
| 友链 | 屿见官网 · `https://yujian.cystation.site` · 以优越的技术为大家提供更优渥的平台 | 用户提供，地址实查 200 |

## 8. 资源与图标

- 图标：内联 SVG，24 网格、1.6–1.8px 描边、`currentColor`；全站 4 处（品牌时钟、下载箭头、外链箭头）。禁止 emoji 与字符图标。
- 图片：`assets/screens/{today,trend,apps,events}.png`，1440×900，由 `_workflow/capture-screens.cjs` 从当前源码构建的 dist 实际运行截取；**不是仓库遗留的历史截图**。全部填了 `alt`。
- 字体：系统字体栈（`--font`），无外链字体、无本地 woff2。
- 友链 logo：`assets/friends/yujian-logo.svg`（从 `https://home.cystation.site/images/logo.svg` 下载到本地，422 字节，SVG 内仅 xmlns 与品牌图形）。**禁止改成外链 `<img src="https://…">`**，门禁 `external_deps` 会判 FAIL。
- 截图证据：`screenshots/` 四张（三档整页 + 1440 首屏）。

## 9. 已知限制

1. **脚本 WARN 项**：`check_design_pack.py --strict` 复跑结果 WARN 0（无原文可抄）；FAIL 0，PASS 见 `_workflow/gate-report.md`。
2. 顶层 `TimeTrace/README.md` 的下载表已于 2026-11-11 同步到 **0.6.1**（此前仍写 0.5.5）；本页按 `latest.json` / `package.json` / `Cargo.toml` 口径，两者已一致，此限制解除。
3. 导航按钮视觉高度 40px，低于 44px 建议值；放大到 64px 导航高度即可消除。
4. 外链（Gitee / GitCode / 更新清单）不可达时页面不做运行时探测与提示，交给浏览器处理。
5. 界面截图使用内置演示快照，页面已明确标注「不是任何真实用户的记录」；若日后换成真实数据截图，需同步改图注。
6. `_workflow/` 以下划线开头，GitHub Pages 默认 Jekyll 会跳过该目录，过程文档与采集脚本不会出现在公网站点（这是有意为之）；若添加 `.nojekyll` 则会一并公开。
7. 未添加 `.nojekyll`：站点依赖 Jekyll 对 `assets/`、`screenshots/` 的正常复制行为；若日后引入下划线命名的资源目录，需补 `.nojekyll`。
8. 首次交付于 2026-11-06 16:27 提交 `7af70e7` 并推送；16:58 追加的友情链接区段、banner「友链」导航与 README 已随本次提交一并推送。线上 `https://zzjzgz.github.io` 已验证 200，四张产品图、友链 logo 与下载直链均可达。后续改动仍需用户明确授权。
9. 未验证浏览器：旧版 Safari / IE；目标为 Chromium 与 WebKit 现代版本。
10. 仅安装向导有发行版直链（302 已核实）；免安装单文件与 MSI 的同模式直链实查 404，故这两个按钮指向 `releases/v0.5.6` 目录页。
10. 下载区只保留一个 setup 按钮；免安装单文件与 MSI 的同模式直链实查 404，故不设按钮，仅在提示文案中给出 `releases/v0.5.6` 目录。顶部导航与首屏两处入口与 CTA 同链，点击即下载，不再经过页内锚点。

## 10. 验收清单

- [x] 所有颜色、字号、间距取自 `tokens.json`，`:root` 外无新增色值
- [x] 每个 P0 区段五态已定义，Error 有可执行下一步
- [x] 1366 / 1440 / 1920 三档无横向滚动
- [x] 键盘 Tab 可走完主流程，焦点可见；分段控件支持方向键
- [x] 断网打开功能正常（无外链资源，仅外链跳转不可用）
- [x] 四张产品截图来自当前构建 v0.5.6，状态栏版本可见、pageerror 0
- [x] `check_design_pack.py --strict` FAIL = 0
- [ ] 提交并推送到 GitHub 后线上复验（待用户授权）
