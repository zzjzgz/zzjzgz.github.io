#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""发版一致性硬断言（可复跑，幂等，只读）。

页面里的「版本号 / 三处下载直链 / 目录链接 / 截图来源 / README 地址表」是绑定的，
只改其中一处，页面就会说谎。本脚本把这些约束钉住。

版本唯一真源：相邻发布仓的 latest.json；不存在时退回 index.html 的 hero-meta。

用法：python _workflow/check_release.py
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML_PATH = ROOT / "index.html"
README_PATH = ROOT / "README.md"
RELEASE_REPO = ROOT.parent / "time-trace-code"
LATEST = RELEASE_REPO / "latest.json"

html = HTML_PATH.read_text(encoding="utf-8")
readme = README_PATH.read_text(encoding="utf-8")

meta = json.loads(LATEST.read_text(encoding="utf-8")) if LATEST.exists() else None
if meta:
    V = meta["version"]
    origin = str(LATEST)
else:
    m = re.search(r'class="hero-meta num">v(0\.\d+\.\d+)', html)
    if not m:
        sys.exit("断言失败：既无 latest.json，也读不到页面版本号")
    V = m.group(1)
    origin = "index.html hero-meta（latest.json 缺失）"

DL = f"https://gitee.com/zzjzgz/time-trace-code/raw/master/releases/v{V}/TimeTrace_{V}_x64-setup.exe"
DIR = f"https://gitee.com/zzjzgz/time-trace-code/tree/master/releases/v{V}"

checks = []


def check(name, ok, detail=""):
    checks.append((name, bool(ok), detail))


# 1. 页面正文里出现的版本号必须只有一个
versions = set(re.findall(r"0\.\d+\.\d+", html))
check("页面版本号唯一", versions == {V}, f"页面出现 {sorted(versions)}，期望 {{{V}}}")

# 2. 三处下载入口共用同一条已核实直链
hrefs = re.findall(r'href="([^"]+)"', html)
setup_hrefs = [h for h in hrefs if h.endswith("_x64-setup.exe")]
check("三处直链完全一致", len(setup_hrefs) == 3 and set(setup_hrefs) == {DL},
      f"命中 {len(setup_hrefs)} 处：{sorted(set(setup_hrefs))}")
check('无 href="#download" 残留', 'href="#download"' not in html)
check("下载区只有一个按钮", html.count('class="glass-chip"') == 1)

# 3. 所有发布仓目录链接都指向同一版本
dir_hrefs = [h for h in hrefs if "/tree/master/releases/v" in h]
check("目录链接版本一致", len(dir_hrefs) >= 2 and set(dir_hrefs) == {DIR},
      f"命中 {len(dir_hrefs)} 处：{sorted(set(dir_hrefs))}")

# 4. 带版本号的关键文案
check("导航按钮", f"下载 v{V}</a>" in html)
check("下载区 kicker", f"下载 · v{V}" in html)
check("规格表当前版本", f'<dd class="num">{V}<small>' in html)
check("Hero 事实行", f'class="hero-meta num">v{V}<span class="sep">' in html)
check("截图来源徽标", f"由当前构建 v{V} 实际运行截取" in html)
check("四视图图注", f"TimeTrace v{V} 当前源码构建后实际运行截取" in html)

# 5. README 地址表与页面同源
check("README 当前版本", f"| 当前版本 | {V}（" in readme)
check("README 直链", f"<{DL}>" in readme)
check("README 截图来源版本", f"**v{V} 当前源码重新构建后实际运行截取**" in readme)

# 6. 四张产品图必须是真实文件
for name in ("today", "trend", "apps", "events"):
    p = ROOT / "assets" / "screens" / f"{name}.png"
    check(f"截图 {name}.png", p.exists() and p.stat().st_size > 10000,
          f"{p.stat().st_size} bytes" if p.exists() else "缺失")

# 7. 与发布仓清单交叉核对（清单存在时才检查）
if meta:
    check("latest.json 直链与页面一致", meta.get("url") == DL, str(meta.get("url")))
    date = re.search(r'class="hero-meta num">v0\.\d+\.\d+<span class="sep">·</span>([\d-]+)', html)
    check("页面发布日期与清单一致", bool(date) and date.group(1) == meta.get("publishedAt"),
          f"页面 {date.group(1) if date else '未读到'} / 清单 {meta.get('publishedAt')}")
    setup = RELEASE_REPO / "releases" / f"v{V}" / f"TimeTrace_{V}_x64-setup.exe"
    if setup.exists():
        digest = hashlib.sha256(setup.read_bytes()).hexdigest()
        check("本地安装包 SHA256 与清单一致", digest == meta.get("sha256"), digest)
    else:
        check("本地安装包 SHA256 与清单一致", True, "本地产物不存在，跳过")

failed = [c for c in checks if not c[1]]
print(f"版本真源：{origin} → {V}")
for name, ok, detail in checks:
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f" · {detail}" if detail else ""))
print(f"合计 {len(checks)} 项，PASS {len(checks) - len(failed)} / FAIL {len(failed)}")
print("结论：" + ("PASS" if not failed else "FAIL"))
sys.exit(0 if not failed else 1)
