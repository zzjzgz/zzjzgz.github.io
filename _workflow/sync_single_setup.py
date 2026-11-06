#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""用户后续指令（2026-11-06 16:18）落地：只保留一个 setup，三处入口同链直达下载。

硬断言（每次运行都校验 index.html）：
  - 发行版直链作为 href 恰好出现 3 次（顶部导航 / 首屏 CTA / 下载区按钮）
  - 不再残留 href="#download"（三处都改成了直接下载）
  - 下载区只剩 1 个 glass-chip 按钮

并把全部交接文档的「三种产物 / 三个按钮 / 目录页」口径同步为单 setup 口径。
用法：python _workflow/sync_single_setup.py（幂等，可复跑）
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = "https://gitee.com/zzjzgz/time-trace-code/releases/download/TimeTrace_0.5.6/TimeTrace_0.5.6_x64-setup.exe"


def verify_index():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    n = html.count(f'href="{URL}"')
    assert n == 3, f"直链入口数量应为 3，实际 {n}"
    assert 'href="#download"' not in html, "仍有入口指向页内锚点而非直接下载"
    assert html.count('class="glass-chip"') == 1, "下载区应只剩 1 个玻璃按钮"
    return n


REPLACEMENTS = {
    "DESIGN-SPEC.md": [
        ("并到达 v0.5.6 下载目录。", "并可直接下载 v0.5.6 安装包。"),
        ("→ 下载 CTA → 安装包直链 / Gitee v0.5.6 目录", "→ 下载 CTA → setup.exe 直链（顶部导航与首屏可直达）"),
        ("├── P5 下载：彩色 CTA + 三种产物 + 诚实提示", "├── P5 下载：彩色 CTA + 单个 setup 按钮 + 诚实提示"),
        (
            "| P5 | 彩色 CTA + 三个玻璃按钮 | 外链由浏览器负责 | 不适用 | 离线时外链不可达，见 HANDOFF 已知限制 | 下载 setup.exe 或到达 v0.5.6 目录 |",
            "| P5 | 彩色 CTA + 一个玻璃按钮 | 外链由浏览器负责 | 不适用 | 离线时外链不可达，见 HANDOFF 已知限制 | 直接下载 setup.exe |",
        ),
        (
            "3. 另两种产物的发行版直链（实查 404）：不把 404 地址写进页面；仅安装向导使用用户指定并经 302 验证的直链。",
            "3. 另两种产物的发行版直链（实查 404）：不设按钮、不写 404 地址；按用户后续指令，下载区只保留一个 setup 入口，顶部导航与首屏 CTA 同链直达下载。",
        ),
    ],
    "HANDOFF.md": [
        (
            "| P5 | 三个玻璃按钮 | 外链由浏览器负责 | 不适用 | 离线不可达，见第 9 节 | 触发 setup.exe 下载或到达 Gitee 目录 | 外链均 `noopener noreferrer` |",
            "| P5 | 一个玻璃按钮（顶部导航 / 首屏两处入口同链） | 外链由浏览器负责 | 不适用 | 离线不可达，见第 9 节 | 触发 setup.exe 下载 | 外链均 `noopener noreferrer` |",
        ),
        (
            "| 其他产物 | Gitee `releases/v0.5.6` 目录 | 页面存在、三个文件齐全；同模式直链实查 404，故保留目录页 |",
            "| 其他产物 | Gitee `releases/v0.5.6` 目录 | 仅在 CTA 提示文案中提及；同模式直链实查 404，不设按钮 |",
        ),
        (
            "10. 仅安装向导有发行版直链（302 已核实）；免安装单文件与 MSI 的同模式直链实查 404，故这两个按钮指向 `releases/v0.5.6` 目录页。",
            "10. 下载区只保留一个 setup 按钮；免安装单文件与 MSI 的同模式直链实查 404，故不设按钮，仅在提示文案中给出 `releases/v0.5.6` 目录。顶部导航与首屏两处入口与 CTA 同链，点击即下载，不再经过页内锚点。",
        ),
    ],
    "DEV-PROMPT.md": [
        (
            f"- 安装向导按钮指向用户指定、经 302 验证的发行版直链 `{URL}`；另两个按钮指向 `releases/v0.5.6` 目录页（同模式直链实查 404，禁止写入 404 地址）。",
            f"- **只保留一个 setup 按钮**，与顶部导航「下载 v0.5.6」、首屏「下载 Windows 版」三处入口全部指向同一个经 302 验证的发行版直链 `{URL}`，点击即下载；免安装单文件 / MSI 只在提示文案里指向 `releases/v0.5.6` 目录（同模式直链实查 404，禁止写入 404 地址）。",
        ),
    ],
    "_workflow/00-brief.md": [
        ("点击安装向导直接下载 setup.exe（其余产物到 Gitee v0.5.6 目录）。", "顶部导航 / 首屏 CTA / 下载区任一入口点击即下载 setup.exe。"),
        (
            "3. 安装向导使用用户指定的发行版直链（实查 302 有效）；免安装单文件与 MSI 的同模式直链实查 404，继续指向已核实的 `releases/v0.5.6` 目录页。",
            "3. 按用户后续指令，下载区只保留一个 setup 按钮；顶部导航、首屏「下载 Windows 版」、CTA 三处入口共用用户指定的发行版直链（实查 302 有效）。免安装单文件与 MSI 的同模式直链实查 404，不设按钮，仅在提示文案中给出 `releases/v0.5.6` 目录。",
        ),
    ],
    "_workflow/01-ia.md": [
        ("→ P5 下载：安装包直链 + 另两种产物到 Gitee v0.5.6 目录页", "→ P5 下载：单个 setup 按钮（顶部导航 / 首屏可同链直达）"),
        ("├── P5 下载 ── 彩色 CTA（玻璃按钮 + 光晕）+ 三个产物 + 诚实提示", "├── P5 下载 ── 彩色 CTA（玻璃按钮 + 光晕）+ 单个 setup + 诚实提示"),
        (
            "- **下载 CTA 放在疑虑清空之后**：只在 P5 放主转化点，导航按钮是同一目标的快捷入口，不制造第二个转化路径。",
            "- **下载 CTA 放在疑虑清空之后**：P5 是完整说明区；按用户后续指令，顶部导航与首屏 CTA 改为同链直达下载，作为「不想读、直接下」的快捷路径，三处入口共用同一条已验证直链，不制造第二个转化目标。",
        ),
    ],
    "_workflow/02-pages.md": [
        ("5. CTA：安装向导走发行版直链（302 已核实）；免安装 / MSI 走已核实的 v0.5.6 目录页", "5. CTA：仅一个 setup 按钮，走发行版直链（302 已核实）；顶部导航与首屏两处入口同链"),
        ("10. 验收：直链 302 有效、两个目录页链接可达", "10. 验收：三处下载入口 href 完全一致且直链 302 有效"),
        (
            "12. 取舍：只写验证过的直链；实查 404 的两种产物宁可让访客在目录里点一次",
            "12. 取舍：只保留一个 setup 入口，减少选择成本；实查 404 的两种产物只在提示文案里给目录",
        ),
    ],
    "_workflow/03-states.md": [
        (
            "| P5 下载 | 彩色 CTA + 三个玻璃按钮 | 外部页面由浏览器负责（不在本页 Loading 范围） | 不适用 | 离线时链接无法打开：本页不拦截，属已知限制，见 HANDOFF 第 9 节 | 安装向导触发 setup.exe 下载（302 已核实）；另两种产物到达 v0.5.6 目录 |",
            "| P5 下载 | 彩色 CTA + 一个玻璃按钮（另两处入口同链） | 外部下载由浏览器负责（不在本页 Loading 范围） | 不适用 | 离线时链接无法打开：本页不拦截，属已知限制，见 HANDOFF 第 9 节 | 三处入口均触发 setup.exe 下载（302 已核实） |",
        ),
    ],
    "_workflow/polish-score.md": [
        ("「安装包走直链、其余产物走目录页」", "「三处入口同链直达下载、只保留一个 setup」"),
        (
            "6. 按用户指定把安装向导换成发行版直链；实查另两种产物直链 404 后保留目录页，并同步全部交接文档口径（第一轮同步，最终口径由 `_workflow/sync_single_setup.py` 统一并带硬断言）。",
            "6. 按用户指定把安装向导换成发行版直链；实查另两种产物直链 404 后保留目录页，并同步全部交接文档口径（第一轮同步，最终口径由 `_workflow/sync_single_setup.py` 统一并带硬断言）。\n"
            "7. 按用户后续指令把下载区收敛为单个 setup 按钮，顶部导航与首屏「下载 Windows 版」改为同链直达下载；口径同步与硬断言脚本 `_workflow/sync_single_setup.py`。",
        ),
    ],
}

n_links = verify_index()
print(f"index.html 硬断言 PASS：直链入口 {n_links} 处、无 #download 残留、下载区 1 个按钮")

total = 0
for rel, pairs in REPLACEMENTS.items():
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    applied = 0
    for old, new in pairs:
        if new in text:
            continue
        count = text.count(old)
        if count != 1:
            raise SystemExit(f"断言失败：{rel} 中该片段命中 {count} 次（应为 1）：{old[:60]}")
        text = text.replace(old, new, 1)
        applied += 1
        total += 1
    path.write_text(text, encoding="utf-8")
    print(f"  {rel}: 本次同步 {applied}/{len(pairs)} 处")
print(f"共同步 {total} 处，覆盖 {len(REPLACEMENTS)} 个文档")
