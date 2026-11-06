#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""反向验证（流水线强制项）：故意改坏一处 → 门禁必须变红 → 字节级恢复 → 必须变绿。

破坏方式：在 :root 之外的 .panel 规则里把 var(--surface) 换成硬编码 #ffffff，
这会触发 check_design_pack.py 的 hardcoded_colors 检查（strict 模式判 FAIL）。

用法：python _workflow/reverse_verify.py
产出：_workflow/reverse-verify.json（含前后 sha256、两次门禁输出与退出码）
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
GATE = Path("C:/Users/zzj/.workbuddy/skills/ui-design-pipeline/scripts/check_design_pack.py")
BROKEN_FROM = ".panel{background:var(--surface);border-radius:var(--r-panel);"
BROKEN_TO = ".panel{background:#ffffff;border-radius:var(--r-panel);"

original_bytes = HTML.read_bytes()          # 原始字节，与 sha256sum 同口径
original = original_bytes.decode("utf-8")   # 不做 CRLF 归一化
sha_before = hashlib.sha256(original_bytes).hexdigest()

if original.count(BROKEN_FROM) != 1:
    sys.exit(f"断言失败：破坏锚点出现 {original.count(BROKEN_FROM)} 次，应为 1 次")


def run_gate():
    proc = subprocess.run(
        [sys.executable, str(GATE), str(ROOT), "--strict"],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    return proc.returncode, (proc.stdout or "") + (proc.stderr or "")


code_broken, out_broken = None, None
code_restored, out_restored = None, None
restored_ok = False
try:
    HTML.write_bytes(original.replace(BROKEN_FROM, BROKEN_TO, 1).encode("utf-8"))
    code_broken, out_broken = run_gate()
finally:
    HTML.write_bytes(original_bytes)
    restored_bytes = HTML.read_bytes()
    sha_after = hashlib.sha256(restored_bytes).hexdigest()
    restored_ok = (sha_after == sha_before) and (restored_bytes == original_bytes)
    code_restored, out_restored = run_gate()

red = code_broken != 0 and "[FAIL]" in out_broken and "hardcoded_colors" in out_broken
green = code_restored == 0 and "[FAIL]" not in out_restored

result = {
    "gate": str(GATE),
    "sha256_before": sha_before,
    "sha256_after_restore": sha_after,
    "byte_identical_after_restore": restored_ok,
    "mutation": "在 .panel 规则中把 var(--surface) 替换为 #ffffff（:root 外硬编码色）",
    "broken": {"exit_code": code_broken, "output": out_broken.strip()},
    "restored": {"exit_code": code_restored, "output": out_restored.strip()},
    "assertion_red_when_broken": red,
    "assertion_green_when_restored": green,
    "verdict": "PASS" if (red and green and restored_ok) else "FAIL",
}
(ROOT / "_workflow" / "reverse-verify.json").write_text(
    json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)

print(f"基线 sha256      : {sha_before}")
print(f"恢复后 sha256    : {sha_after}（字节一致 {restored_ok}）")
print(f"改坏后门禁       : exit={code_broken}，含 hardcoded_colors FAIL = {red}")
print(f"恢复后门禁       : exit={code_restored}，无 FAIL = {green}")
print(f"结论             : {result['verdict']}")
sys.exit(0 if result["verdict"] == "PASS" else 1)
