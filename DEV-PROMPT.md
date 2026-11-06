# DEV-PROMPT · TimeTrace · 一刻 落地页官网

> 用法：把本文件完整复制给开发 AI（连同 `HANDOFF.md`、`tokens.json`、`index.html`）。
> 若 AI 仍在反问框架、页面数量或视觉规范，说明本文件有缺口，回去补。

---

你是一名资深前端工程师。请按本目录的设计稿实现 / 维护 **TimeTrace · 一刻** 的产品宣传落地页官网。

## 一、必读文件（按顺序读，读完再动手）

1. `index.html` —— 视觉与交互基准，最终效果必须与它一致
2. `tokens.json` —— **视觉唯一真源**：颜色、字体、间距、圆角、阴影、动效全部取自这里（由 `:root` 自动抽取）
3. `HANDOFF.md` —— 区段清单、组件、状态矩阵、内容来源、已知限制、验收清单
4. `DESIGN-SPEC.md` —— 面向评审的定位、信息架构与视觉取舍

## 二、技术约束（已定，不要再自行选型）

- **框架：原生 HTML + CSS + 原生 JS，零构建、零依赖、零框架。** 不要引入 React / Vue / Tailwind / Vite / 打包器。
- **样式**：全部写在 `index.html` 的 `<style>` 内；所有值通过 `:root` 自定义属性引用，禁止在 `:root` 之外写十六进制色值（门禁会判 FAIL）。
- **字体**：只用 `--font` 系统字体栈；不加载外部字体 CDN，不引入本地 woff2。
- **图标**：内联 SVG，24 网格、1.6–1.8px 描边、`currentColor`；禁止 emoji 与字符图标。
- **图片**：`assets/screens/*.png` 本地相对路径，全部带 `alt`；禁止外链图片与占位图。
- **禁止**：`transition: all`、关键路径上的 `:has()`、内联 `style` 魔法数字、入场 opacity keyframes、任一 `:root` 外的硬编码色。
- **外链**：仅允许 `<a href="https://…">`，且必须带 `target="_blank" rel="noopener noreferrer"`；不得用外链 `src` / `href` 加载资源。

## 三、构建顺序（严格按序，每步可运行再下一步）

1. **令牌**：把 `tokens.json` 的值写进 `:root`，覆盖 color / typography / spacing / radius / shadow / motion 六类。
2. **布局壳**：粘性玻璃导航 + `.wrap` 1080 / `.narrow` 720 容器；先跑通 1366 / 1440 / 1920 三档。
3. **区段骨架**：按 HANDOFF 第 2 节搭 5 个 P0 区段（`#top` / `#why` / `#views` / `#privacy` / `#download`）与 3 个支撑区段（`#data` / `#spec` / `#faq`），先不接图片。
4. **组件**：统一白面板 + 发丝线、按钮、分段控件、截图舞台、彩色 CTA、来源徽标；每个可点元素都有 `:active` 反馈。
5. **状态**：图片 onerror 降级面板（必须带可点击的下一步）、分段控件点击与方向键、`aria-selected` / `aria-live`。
6. **内容**：所有事实按 HANDOFF 第 7 节的可核对来源填写；**不要编造版本号、体积、性能数字或下载直链**。
7. **动效**：只用 `tokens.json` 的四档时长与曲线族；press 120ms、hover 180ms、crossfade 280ms；hover 动效门控在精确指针；三个 `prefers-reduced-*` 查询同批交付。

## 四、逐页要点

### P1 首页（`#top`）
- H1 负字距、lede 一行主张、双 CTA；版本事实行写可核对的 v0.5.6 / 2026-11-04 / 约 6 MB / Windows 10·11 / 完全免费。
- Hero 图用 `today.png`，`source-badge` 必须注明「由当前构建 v0.5.6 实际运行截取」。

### P2 为什么（`#why`）
- 三个「不」必须放在**一块**白面板里，用 `.row + .row` 发丝线分隔，不要拆成三张带色卡片。

### P3 界面（`#views`）
- 四张截图叠放在同一容器，只有 `is-active` 的可见；滑块用 `transform` transition，保证中途可打断。
- 点击「趋势」后 `data-active`、active 图片下标、`aria-selected`、图注四者必须一致。
- 图下必须保留「演示数据，不是任何真实用户的记录」声明。

### P4 隐私（`#privacy`）
- 会记录 / 不记录两列对照在同一面板内；680px 以下折叠为单列。

### P5 下载（`#download`）
- **只保留一个 setup 按钮**，与顶部导航「下载 v0.5.6」、首屏「下载 Windows 版」三处入口全部指向同一个经 302 验证的发行版直链 `https://gitee.com/zzjzgz/time-trace-code/releases/download/TimeTrace_0.5.6/TimeTrace_0.5.6_x64-setup.exe`，点击即下载；免安装单文件 / MSI 只在提示文案里指向 `releases/v0.5.6` 目录（同模式直链实查 404，禁止写入 404 地址）。
- 保留未签名 / SmartScreen / WebView2 / 退出托盘再安装的诚实提示。

## 五、验收标准（做完逐条自检并报告）

- [ ] 5 个 P0 区段与 3 个支撑区段齐全，锚点与导航一致
- [ ] 所有颜色 / 字号 / 间距来自 token，`:root` 外搜不到十六进制色值
- [ ] 每个区段五态齐全，Error 有可执行下一步
- [ ] 1366 / 1440 / 1920 无横向滚动，关键操作可达
- [ ] 键盘 Tab 可走完主流程，焦点可见；分段控件支持左右方向键
- [ ] 断网可用（无外链资源）、控制台零错误
- [ ] `python <skill>/scripts/check_design_pack.py <目录> --strict` 输出 FAIL 0
- [ ] 三档整页截图与 `viewport-check.json` 已更新

## 六、禁止事项

- 不要重新设计：视觉、布局、间距、层级以 `index.html` 为准
- 友情链接 logo 必须落在 `assets/friends/` 并用相对路径引用；禁止外链图片（零外链交付包 + 门禁 external_deps FAIL）。友链位置固定在 FAQ 之后、页脚之前，不得上移到导航 / Hero / CTA。
- 不要删状态、不要合并区段、不要改信息架构
- 不要新增设计稿里没有的模块（如需，先提问并说明理由）
- 不要把「演示数据」写成真实用户数据，不要写无法核对的数字
- **不要自行 `git commit` / `git push`**，提交与推送需用户明确授权

## 七、完成后请报告

1. 实现的区段与锚点清单
2. 与设计稿的已知差异（逐条，附原因）
3. 未实现项与建议
4. 自检结果（对应第五节逐条打勾）
5. 门禁脚本原始输出（FAIL / WARN / PASS 计数）
