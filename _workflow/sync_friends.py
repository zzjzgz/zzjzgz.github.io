#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""友链「屿见官网」落地后的硬断言 + 交接文档口径同步（幂等，可复跑）。

关键设计决策（用硬断言钉住）：友链放在 FAQ 之后、footer 之前；logo 必须本地化，
因为零外链交付包禁止 <img src="https://…">（门禁 external_deps 会判 FAIL）。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://yujian.cystation.site"
LOGO_REL = "assets/friends/yujian-logo.svg"
LOGO = ROOT / LOGO_REL


def verify_index():
    html = (ROOT / "index.html").read_bytes().decode("utf-8")
    assert 'id="friends"' in html, "缺少友情链接区段"
    assert html.count(f'href="{SITE}"') == 1, "友链链接应恰好出现 1 次"
    assert "屿见官网" in html and "以优越的技术为大家提供更优渥的平台" in html, "友链名称或简介缺失"
    assert f'src="{LOGO_REL}"' in html, "logo 未使用本地相对路径"
    assert LOGO.is_file(), f"本地 logo 不存在：{LOGO}"
    assert not re.search(r'<img[^>]+src\s*=\s*["\']https?://', html), "存在外链图片，会触发门禁 FAIL"
    pos_friend, pos_faq, pos_footer = html.index('id="friends"'), html.index('id="faq"'), html.index("<footer>")
    assert pos_faq < pos_friend < pos_footer, "友链位置不在 FAQ 之后、页脚之前"
    nav_start = html.index('<nav class="nav-links"')
    nav_block = html[nav_start:html.index("</nav>", nav_start)]
    assert 'href="#friends"' in nav_block, "顶部导航（banner）缺少友链入口"
    svg = LOGO.read_text(encoding="utf-8")
    assert "<script" not in svg.lower() and "<image" not in svg.lower(), "logo SVG 含可疑内容"
    print(f"硬断言 PASS：友链位于 FAQ 与页脚之间 · 链接 1 处 · logo 本地化 {LOGO.stat().st_size} 字节 · 无外链图片")


REPLACEMENTS = {
    "DESIGN-SPEC.md": [
        (
            "├── FAQ：五问五答\n└── 页脚：版权 · 源码 / 发布仓 / 更新清单",
            "├── FAQ：五问五答\n├── 友情链接：屿见官网（单条，页脚前，低权重）\n└── 页脚：版权 · 源码 / 发布仓 / 更新清单",
        ),
        (
            "- **一期范围**：单页长滚动，5 个 P0 区段（首页 / 为什么 / 界面 / 隐私 / 下载）。明确不含博客、文档站、更新日志页、多语言、后台、埋点、下载统计。",
            "- **一期范围**：单页长滚动，5 个 P0 区段（首页 / 为什么 / 界面 / 隐私 / 下载）。明确不含博客、文档站、更新日志页、多语言、后台、埋点、下载统计。\n"
            "用户后续追加 1 个友情链接支撑 section（屿见官网），不计入 P0 区段。",
        ),
    ],
    "HANDOFF.md": [
        (
            "| — | 友情链接 | `#friends` | 单条互推（屿见官网） | P1 支撑 | FAQ 之后 / 页脚之前 |",
            "| — | 友情链接 | `#friends` | 单条互推（屿见官网） | P1 支撑 | 顶部导航「友链」/ FAQ 之后 |",
        ),
        (
            "| 许可 | 木兰宽松许可证 v2 | `LICENSE` |",
            "| 许可 | 木兰宽松许可证 v2 | `LICENSE` |\n"
            "| 友链 | 屿见官网 · `https://yujian.cystation.site` · 以优越的技术为大家提供更优渥的平台 | 用户提供，地址实查 200 |",
        ),
        (
            "- 字体：系统字体栈（`--font`），无外链字体、无本地 woff2。",
            "- 字体：系统字体栈（`--font`），无外链字体、无本地 woff2。\n"
            "- 友链 logo：`assets/friends/yujian-logo.svg`（从 `https://home.cystation.site/images/logo.svg` 下载到本地，422 字节，SVG 内仅 xmlns 与品牌图形）。"
            "**禁止改成外链 `<img src=\"https://…\">`**，门禁 `external_deps` 会判 FAIL。",
        ),
    ],
    "DEV-PROMPT.md": [
        (
            "- 不要重新设计：视觉、布局、间距、层级以 `index.html` 为准",
            "- 不要重新设计：视觉、布局、间距、层级以 `index.html` 为准\n"
            "- 友情链接 logo 必须落在 `assets/friends/` 并用相对路径引用；禁止外链图片（零外链交付包 + 门禁 external_deps FAIL）。"
            "友链位置固定在 FAQ 之后、页脚之前，不得上移到导航 / Hero / CTA。",
        ),
    ],
    "_workflow/00-brief.md": [
        (
            "明确不做：博客、文档站、更新日志页、多语言、后台、埋点统计、下载计数、评论区。",
            "明确不做：博客、文档站、更新日志页、多语言、后台、埋点统计、下载计数、评论区。\n"
            "用户后续追加 1 个友情链接支撑 section（屿见官网），位置在 FAQ 之后、页脚之前，不计入 P0。",
        ),
    ],
    "_workflow/01-ia.md": [
        (
            "├── FAQ ── 五问五答\n└── 页脚 ── 版权 · 源码 / 发布仓 / 更新清单 / 回到顶部",
            "├── FAQ ── 五问五答\n├── 友情链接 ── 屿见官网（单条，低权重）\n└── 页脚 ── 版权 · 源码 / 发布仓 / 更新清单 / 回到顶部",
        ),
        (
            "- **统一面板而非卡片墙**：三个「不」、数据能力、FAQ 都是同类条目，按 Apple Craft 的反碎片化规则放进一块白面板，用发丝线分隔。",
            "- **统一面板而非卡片墙**：三个「不」、数据能力、FAQ 都是同类条目，按 Apple Craft 的反碎片化规则放进一块白面板，用发丝线分隔。\n"
            "- **友链放在尾声**：它是互推信息而非任务节点，放在 FAQ 之后、页脚之前；放导航会稀释任务路径，放 Hero / CTA 会导走转化流量，插在正文中间会打断信任链。只给 12px 小标签 + 一块白面板一行，不做独立彩色卡片。",
        ),
    ],
    "_workflow/02-pages.md": [
        (
            "另有 3 个支撑性 section（数据属于你 / 规格 / FAQ），不单独计页。",
            "另有 4 个支撑性 section（数据属于你 / 规格 / FAQ / 友情链接），不单独计页。",
        ),
    ],
    "_workflow/polish-score.md": [
        (
            "7. 按用户后续指令把下载区收敛为单个 setup 按钮，顶部导航与首屏「下载 Windows 版」改为同链直达下载；口径同步与硬断言脚本 `_workflow/sync_single_setup.py`。",
            "7. 按用户后续指令把下载区收敛为单个 setup 按钮，顶部导航与首屏「下载 Windows 版」改为同链直达下载；口径同步与硬断言脚本 `_workflow/sync_single_setup.py`。\n"
            "8. 新增友情链接区段（屿见官网）：放在 FAQ 之后、页脚之前，logo 下载到本地保持零外链；位置与外链约束由 `_workflow/sync_friends.py` 硬断言钉住。",
        ),
        (
            "8. 新增友情链接区段（屿见官网）：放在 FAQ 之后、页脚之前，logo 下载到本地保持零外链；位置与外链约束由 `_workflow/sync_friends.py` 硬断言钉住。",
            "8. 新增友情链接区段（屿见官网）：放在 FAQ 之后、页脚之前，logo 下载到本地保持零外链；位置与外链约束由 `_workflow/sync_friends.py` 硬断言钉住。\n"
            "9. 按用户指令在顶部导航（banner）补「友链」锚点指向 `#friends`；收紧 900px 以下导航间距以容纳 6 个链接。",
        ),
    ],
    "_workflow/gate-report.md": [
        (
            "- [x] `assets/screens/`（4 张真实界面截图）",
            "- [x] `assets/screens/`（4 张真实界面截图）\n"
            "- [x] `assets/friends/yujian-logo.svg`（友链 logo，本地化，422 字节）",
        ),
    ],
}

verify_index()
total = 0
skipped = 0
for rel, pairs in REPLACEMENTS.items():
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    applied = 0
    for old, new in pairs:
        if new in text:
            continue
        if text.count(old) != 1:
            print(f"    SKIP {rel}: 锚点未唯一命中 {old[:48]}")
            skipped += 1
            continue
        text = text.replace(old, new, 1)
        applied += 1
        total += 1
    path.write_text(text, encoding="utf-8")
    print(f"  {rel}: 本次同步 {applied}/{len(pairs)} 处")
print(f"共同步 {total} 处；锚点跳过 {skipped} 处（需人工确认）")
