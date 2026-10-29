#!/usr/bin/env python3
"""Build a deployable copy of the app.

Copies only the files the browser needs into dist/ and packs them into
kwizlocal-site.zip, ready to drag onto Cloudflare Pages, Netlify or any
static host.

Usage: python tools/build_dist.py
"""

from __future__ import annotations

import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "app"
DST = ROOT / "dist"
ZIP = ROOT / "kwizlocal-site.zip"

FILES = [
    "index.html",
    "styles.css",
    "app.js",
    "engine.js",
    "data.js",
    "deep.js",
    "zh.js",
    "vocab.js",
    "gloss.js",
    "distract.js",
    "verbs.js",
    "sentences.js",
    "manifest.json",
    "sw.js",
]


def main() -> int:
    if not SRC.exists():
        print("app/ not found — run this from the project root")
        return 1

    if DST.exists():
        # Remove file by file: rmtree can trip over a file still held open by a
        # preview server, and we would rather overwrite than fail the build.
        for p in sorted(DST.rglob("*"), reverse=True):
            if p.is_file() or p.is_symlink():
                p.unlink()
            elif p.is_dir():
                p.rmdir()
        DST.rmdir()
    DST.mkdir()

    missing = []
    for name in FILES:
        src = SRC / name
        if not src.exists():
            missing.append(name)
            continue
        shutil.copy2(src, DST / name)

    icons = SRC / "icons"
    if icons.exists():
        shutil.copytree(icons, DST / "icons")
    else:
        missing.append("icons/")

    fonts = SRC / "fonts"
    if fonts.exists():
        shutil.copytree(fonts, DST / "fonts")
    else:
        missing.append("fonts/")

    # GitHub Pages ignores files beginning with an underscore without this.
    (DST / ".nojekyll").write_text("", encoding="utf-8")

    if ZIP.exists():
        ZIP.unlink()
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in sorted(DST.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(DST).as_posix())

    total = sum(p.stat().st_size for p in DST.rglob("*") if p.is_file())
    print(f"dist/   {len([p for p in DST.rglob('*') if p.is_file()])} files, {total / 1048576:.2f} MB")
    print(f"zip     {ZIP.name}, {ZIP.stat().st_size / 1048576:.2f} MB")

    if missing:
        print("WARNING missing:", ", ".join(missing))
        return 1

    print("\nUpload dist/ (or the zip) to your static host.")
    print("If you changed app code, bump CACHE in app/sw.js first.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
