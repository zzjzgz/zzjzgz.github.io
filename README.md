# zzjzgz.github.io · TimeTrace 官网

> **TimeTrace · 一刻** 的落地页宣传官网，托管于 GitHub Pages：<https://zzjzgz.github.io>

TimeTrace 是一款**本地优先的 Windows 应用使用时长统计工具**：记录只写本机 SQLite，无账号、无遥测，默认不联网，完全免费。这个仓库只放官网静态文件，**不含应用源码**。

## 线上与相关地址

| 项 | 地址 |
|---|---|
| 官网 | <https://zzjzgz.github.io> |
| 应用源码 | <https://gitcode.com/weixin_51713937/TimeTrace> |
| 安装包 / 历史版本 / 更新清单 | <https://gitee.com/zzjzgz/time-trace-code> |
| v0.5.6 安装向导（直链） | <https://gitee.com/zzjzgz/time-trace-code/releases/download/TimeTrace_0.5.6/TimeTrace_0.5.6_x64-setup.exe> |
| 当前版本 | 0.5.6（2026-11-04） |
| 源码许可 | 木兰宽松许可证第 2 版 |

## 仓库结构

```
index.html                  零构建单文件官网，双击可开
assets/screens/             四张产品界面截图：今天 / 趋势 / 应用 / 事件
assets/friends/             友链 logo（本地化，保证零外链资源）
screenshots/                官网截图：1366 / 1440 / 1920 三档整页 + 首屏 + 友链特写
tokens.json                 设计令牌，由 index.html 的 :root 自动抽取
DESIGN-SPEC.md              面向评审：定位、信息架构、视觉取舍
HANDOFF.md                  面向研发：组件、状态矩阵、验收清单、已知限制
DEV-PROMPT.md               可直接交给开发 AI 的开工指令
_workflow/                   设计流水线过程产物与可复跑脚本
```

## 本地预览

零构建、零依赖、无外链资源（图片、字体、脚本全部本地），直接双击 `index.html` 即可。也可以起一个静态服务：

```bash
python -m http.server 8080
# 打开 http://127.0.0.1:8080/
```

## 视觉与交互

视觉系统为 Apple Craft，流程为 ui-design-pipeline 四阶段流水线：冷灰白地面、统一白面板 + 发丝分隔、单一强调蓝、四档动效时长；`prefers-reduced-motion` / `prefers-reduced-transparency` / `prefers-contrast` 三种偏好均已处理。

四个产品视图可用分段控件或左右方向键切换；顶部导航「友链」是页内锚点，指向页尾的友情链接区。

## 截图从哪来

`assets/screens/` 不是历史遗留素材，是从 TimeTrace **v0.5.6 当前源码重新构建后实际运行截取**的：

```bash
# 在 TimeTrace/app 目录下
node node_modules/typescript/lib/tsc.js --noEmit -p tsconfig.json
node node_modules/vite/bin/vite.js build
node scripts/serve-dist.cjs          # http://127.0.0.1:4180/

# 回到本仓库
node _workflow/capture-screens.cjs   # 截四张产品界面图
node _workflow/capture-page.cjs      # 截官网三档整页图
```

画面中的数据为内置演示快照，**不是任何真实用户的记录**。

## 验证

```bash
python _workflow/reverse_verify.py      # 反向验证：改坏变红 → 字节级恢复变绿
python _workflow/sync_single_setup.py   # 下载入口硬断言
python _workflow/sync_friends.py        # 友链位置、banner 入口、logo 本地化硬断言
python _workflow/extract_tokens.py      # 从 :root 重生成 tokens.json
```

设计包门禁（`ui-design-pipeline/scripts/check_design_pack.py --strict`）当前结果：**FAIL 0 / WARN 0 / PASS 7**。各阶段证据与门禁报告见 `_workflow/gate-report.md`。

## 友情链接

- 屿见官网 · <https://yujian.cystation.site> —— 以优越的技术为大家提供更优渥的平台

## 维护提示

**版本号、四张产品截图、下载直链是绑定的**：发布新版本时三处必须同步更新，否则页面会「说谎」。顶层 `TimeTrace/README.md` 的下载表目前仍写 0.5.5，本仓库按 0.5.6，建议一并同步。
