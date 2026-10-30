#!/usr/bin/env python3
"""校验课程内容。

以前这个脚本校验 `content/kp/*.json` 里手写的中文草案。那份草案用的是另一套
schema（`title_zh` / `rule_zh` / `fr.` 前缀 / A2L、A2U、C1 等级），和 app 实际加载
的 `app/data.js` 完全不兼容——改了 JSON 页面不会变，这正是要消除的问题。草案已
移到 `content/legacy/`，仅作历史留存，不参与构建。

现在内容只有一个来源：`app/data.js`。这个脚本保留原来的命令名，实际做两件事：

  1. 结构校验：`node tools/check_data.js`（题目、选项、先修引用、深度）
  2. 导出同步：`node tools/export_content.js --check`
     确认 `content/curriculum.json` 和 data.js 一致；没有这个文件就先导出一次

用法：
    python tools/validate_content.py
    python tools/validate_content.py --strict   # 目前与默认行为相同，保留兼容
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPORT = ROOT / "content" / "curriculum.json"


def run(args: list[str]) -> int:
    print(f"$ {' '.join(args)}")
    try:
        return subprocess.call(args, cwd=str(ROOT))
    except FileNotFoundError:
        print(f"找不到命令：{args[0]}（需要 Node.js）", file=sys.stderr)
        return 127


def main() -> int:
    parser = argparse.ArgumentParser(add_help=True)
    parser.add_argument("--strict", action="store_true", help="保留兼容；目前无额外效果")
    parser.parse_args()

    if shutil.which("node") is None:
        print("需要 Node.js 才能校验内容。", file=sys.stderr)
        return 127

    print("内容来源：app/data.js（唯一来源）")
    print()

    status = run(["node", "tools/check_data.js"])

    print()
    if not EXPORT.exists():
        print("content/curriculum.json 还不存在，先生成一次：")
        status = run(["node", "tools/export_content.js"]) or status
    else:
        status = run(["node", "tools/export_content.js", "--check"]) or status

    print()
    if status:
        print("校验未通过。", file=sys.stderr)
    else:
        print("内容校验通过：app/data.js 结构合法，content/curriculum.json 与之同步。")
    return status


if __name__ == "__main__":
    sys.exit(main())
