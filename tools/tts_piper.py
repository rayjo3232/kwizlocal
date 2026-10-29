#!/usr/bin/env python3
"""用 Piper 批量合成知识点例句音频。

前置：
    1. 安装 piper（任一方式）
       - pip install piper-tts
       - 或下载 piper 二进制
    2. 下载声音模型（推荐 fr_FR-siwis-medium，CC BY 4.0）
       https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium
       需要两个文件：fr_FR-siwis-medium.onnx 与 .onnx.json

用法：
    python tools/tts_piper.py --check
    python tools/tts_piper.py --kp content/kp/fr.a1.negation.ne_pas.json
    python tools/tts_piper.py --all --model models/fr_FR-siwis-medium.onnx

说明：
    - 只合成 primer.examples 与 dictation 类题目，不合成题干。
    - 已存在的文件默认跳过；--force 覆盖。
    - 输出格式为 wav（Piper 原生），与 kp JSON 中的 audio 字段一致。
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MODEL = "models/fr_FR-siwis-medium.onnx"


def find_piper(explicit: str | None) -> str | None:
    if explicit:
        return explicit if Path(explicit).exists() or shutil.which(explicit) else None
    return shutil.which("piper") or shutil.which("piper.exe")


def synth(piper: str, model: str, text: str, out: Path, length_scale: float = 1.1) -> tuple[bool, str]:
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [piper, "-m", model, "-f", str(out), "--length-scale", str(length_scale)]
    try:
        proc = subprocess.run(cmd, input=text.encode("utf-8"), capture_output=True, timeout=60)
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)
    if proc.returncode != 0:
        return False, (proc.stderr or b"").decode("utf-8", "ignore").strip()[:300]
    return out.exists(), ""


def collect_jobs(kp: dict) -> list[tuple[str, Path]]:
    jobs: list[tuple[str, Path]] = []
    for ex in kp.get("primer", {}).get("examples", []):
        rel = ex.get("audio")
        if rel and ex.get("fr"):
            jobs.append((ex["fr"], ROOT / rel))
    for it in kp.get("items", []):
        if it.get("type") == "dictation" and it.get("audio") and it.get("answer"):
            jobs.append((it["answer"], ROOT / it["audio"]))
    return jobs


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kp", help="单个知识点 JSON 路径")
    ap.add_argument("--all", action="store_true", help="处理 content/kp 下全部知识点")
    ap.add_argument("--model", default=DEFAULT_MODEL, help="Piper 声音模型 .onnx 路径")
    ap.add_argument("--piper", help="piper 可执行文件路径（默认从 PATH 查找）")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--length-scale", type=float, default=1.1, help="语速：1.0 正常，1.1 稍慢（教学默认）")
    ap.add_argument("--check", action="store_true", help="只检查环境，不合成")
    args = ap.parse_args()

    piper = find_piper(args.piper)
    model_ok = Path(args.model).exists()

    if args.check or not piper or not model_ok:
        print("环境检查")
        print(f"  piper : {piper or '未找到'}")
        print(f"  model : {args.model} {'✓' if model_ok else '✗ 不存在'}")
        if not piper or not model_ok:
            print("\n安装提示：")
            print("  pip install piper-tts")
            print("  mkdir -p models && cd models")
            print("  # 从 HuggingFace 下载 fr_FR-siwis-medium.onnx 与 .onnx.json")
            print("  # https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium")
            return 0 if (piper and model_ok) else 1
        return 0

    if args.kp:
        files = [Path(args.kp)]
    elif args.all:
        files = sorted((ROOT / "content" / "kp").glob("*.json"))
    else:
        ap.error("需要 --kp 或 --all")

    total = ok = skipped = failed = 0
    for f in files:
        kp = json.loads(f.read_text(encoding="utf-8"))
        jobs = collect_jobs(kp)
        print(f"\n{kp['id']}  ({len(jobs)} 条)")
        for text, out in jobs:
            total += 1
            if out.exists() and not args.force:
                skipped += 1
                print(f"  skip  {out.relative_to(ROOT)}")
                continue
            success, msg = synth(piper, args.model, text, out, args.length_scale)
            if success:
                ok += 1
                print(f"  ok    {out.relative_to(ROOT)}  «{text}»")
            else:
                failed += 1
                print(f"  fail  {out.relative_to(ROOT)}  {msg}")

    print(f"\n合计 {total}：成功 {ok}，跳过 {skipped}，失败 {failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
