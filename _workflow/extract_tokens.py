#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 index.html 的 :root 自动抽取真实令牌值，生成 tokens.json。

流水线 S4 要求：值必须与 HTML 一致，禁止手写猜测值。
用法：python _workflow/extract_tokens.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
match = re.search(r":root\s*\{(.*?)\}", html, re.S)
if not match:
    sys.exit("index.html 中未找到 :root 块")

variables = {}
for name, value in re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", match.group(1)):
    variables.setdefault(name, value.strip())

GROUPS = {
    "color": [
        "--bg", "--surface", "--hover", "--text", "--text-body", "--text-2",
        "--text-3", "--text-4", "--faint", "--hairline", "--track",
        "--accent", "--accent-link", "--indigo", "--live", "--heat",
        "--heat-bg", "--on-accent", "--grad-cta",
    ],
    "typography": ["--font", "--mono"],
    "spacing": ["--max-read", "--max-grid", "--pad-x", "--gap-section"],
    "radius": ["--r-pill", "--r-chip", "--r-thumb", "--r-card", "--r-panel", "--r-hero", "--r-sheet"],
    "shadow": ["--sh-card", "--sh-panel", "--sh-lift", "--sh-cta", "--sh-overlay"],
    "motion": [
        "--dur-1", "--dur-2", "--dur-3", "--dur-4",
        "--ease-out", "--ease-in-out", "--ease-spring", "--ease-out-quart", "--ease-soft",
    ],
}

out = {"_source": "由 _workflow/extract_tokens.py 从 index.html 的 :root 自动抽取，请勿手工编辑"}
missing = []
for group, names in GROUPS.items():
    out[group] = {}
    for name in names:
        if name in variables:
            out[group][name] = variables[name]
        else:
            missing.append(name)

(ROOT / "tokens.json").write_text(
    json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
count = sum(len(v) for v in out.values() if isinstance(v, dict))
print(f"tokens.json 已生成：{count} 个令牌，来自 :root 实解析")
if missing:
    print("未在 :root 找到：", ", ".join(missing))
