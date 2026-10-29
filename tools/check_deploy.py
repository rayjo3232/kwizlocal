#!/usr/bin/env python3
"""Pre-flight check before deploying.

Catches the class of bug that only shows up on a phone with no network:
a file referenced by index.html but missing from the service worker's
precache list. That is exactly how deep.js went missing the first time.

Usage: python tools/check_deploy.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"


def read(name: str) -> str:
    return (APP / name).read_text(encoding="utf-8")


def main() -> int:
    problems = []

    html = read("index.html")
    refs = set()
    for m in re.finditer(r'(?:src|href)="([^"#]+)"', html):
        ref = m.group(1)
        if ref.startswith(("http://", "https://", "data:", "mailto:")):
            continue
        refs.add(ref)

    sw = read("sw.js")
    cached = set()
    for m in re.finditer(r'"\./([^"]+)"', sw):
        cached.add(m.group(1))

    # "./" precaches the directory itself, which covers index.html
    for ref in sorted(refs):
        if ref in ("", "./"):
            continue
        if ref not in cached:
            problems.append(f"index.html references {ref} but sw.js does not precache it")

    # every precached file must exist on disk
    for name in sorted(cached):
        if name and not (APP / name).exists():
            problems.append(f"sw.js precaches {name} but the file is missing")

    # manifest icons must exist and be listed
    manifest = json.loads(read("manifest.json"))
    for icon in manifest.get("icons", []):
        src = icon["src"]
        if not (APP / src).exists():
            problems.append(f"manifest references missing icon {src}")
        if src not in cached:
            problems.append(f"manifest icon {src} is not precached")

    # files the app loads must be in the deploy set
    sys.path.insert(0, str(ROOT / "tools"))
    from build_dist import FILES  # noqa: E402

    for name in FILES:
        if not (APP / name).exists():
            problems.append(f"build_dist lists {name} but it does not exist")

    dist = ROOT / "dist"
    if dist.exists():
        for name in FILES:
            if not (dist / name).exists():
                problems.append(f"dist/ is stale: missing {name}")
        if (dist / "sw.js").exists():
            dist_sw = (dist / "sw.js").read_text(encoding="utf-8")
            if "deep.js" not in dist_sw:
                problems.append("dist/sw.js is stale")

    if problems:
        print("DEPLOY CHECK FAILED")
        for p in problems:
            print("  -", p)
        return 1

    print("DEPLOY CHECK OK")
    print(f"  {len(refs)} local refs, {len(cached)} precached files, all present")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
