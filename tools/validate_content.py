#!/usr/bin/env python3
"""校验 content/kp/*.json：结构、枚举、题目完整性、先修引用、来源许可。

不依赖第三方库；若安装了 jsonschema，会额外跑一遍正式 schema 校验。

用法：
    python tools/validate_content.py
    python tools/validate_content.py --strict   # 警告也视为失败
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KP_DIR = ROOT / "content" / "kp"
SOURCES = ROOT / "content" / "sources.json"
SCHEMA = ROOT / "content" / "schema" / "kp.schema.json"

LEVELS = {"A0", "A1", "A2L", "A2U", "B1", "B2", "C1"}
CATEGORIES = {
    "articles", "nouns", "adjectives", "adverbs", "pronouns",
    "verbs_tense", "verbs_mood", "prepositions", "negation",
    "questions", "comparison", "sentence_structure", "expressions", "vocabulary",
}
ITEM_TYPES = {"choice", "fill", "multi_fill", "correct", "order", "dictation", "translate"}
STAGES = {"guided", "check", "kwiz"}

errors: list[str] = []
warnings: list[str] = []


def err(kp: str, msg: str) -> None:
    errors.append(f"{kp}: {msg}")


def warn(kp: str, msg: str) -> None:
    warnings.append(f"{kp}: {msg}")


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def check_kp(kp: dict, path: Path, registry: dict, all_ids: set[str]) -> None:
    name = path.name

    for field in ("id", "level", "category", "title_zh", "primer", "items", "sources", "meta"):
        if field not in kp:
            err(name, f"缺少字段 {field}")
    if errors and any(e.startswith(name) for e in errors):
        return

    if kp["level"] not in LEVELS:
        err(name, f"level 非法：{kp['level']}")
    if kp["category"] not in CATEGORIES:
        err(name, f"category 非法：{kp['category']}")
    if not re.match(r"^fr\.[a0-2][a-z0-9]*\.[a-z0-9_]+\.[a-z0-9_]+$", kp["id"]):
        err(name, f"id 不符合命名规范：{kp['id']}")
    if path.stem != kp["id"]:
        warn(name, f"文件名与 id 不一致（文件名 {path.stem}，id {kp['id']}）")

    primer = kp["primer"]
    rule = primer.get("rule_zh", "")
    if not (5 <= len(rule) <= 120):
        err(name, f"primer.rule_zh 长度 {len(rule)}，应在 5–120 字")
    examples = primer.get("examples", [])
    if not (2 <= len(examples) <= 4):
        err(name, f"primer.examples 数量 {len(examples)}，应为 2–4")
    for i, ex in enumerate(examples, 1):
        if not ex.get("fr") or not ex.get("zh"):
            err(name, f"primer.examples[{i}] 缺少 fr 或 zh")
        audio = ex.get("audio")
        if audio and not (ROOT / audio).exists():
            warn(name, f"音频尚未生成：{audio}")
    pitfall = primer.get("pitfall_zh", "")
    if not (5 <= len(pitfall) <= 120):
        err(name, f"primer.pitfall_zh 长度 {len(pitfall)}，应在 5–120 字")

    items = kp["items"]
    if not (6 <= len(items) <= 12):
        err(name, f"items 数量 {len(items)}，应为 6–12")
    seen_ids: set[str] = set()
    stage_count = {s: 0 for s in STAGES}
    for i, it in enumerate(items, 1):
        iid = it.get("id", f"#{i}")
        if iid in seen_ids:
            err(name, f"item id 重复：{iid}")
        seen_ids.add(iid)
        if not re.match(r"^itm\.[a-z0-9_.]+$", iid):
            err(name, f"item id 不合规：{iid}")
        if it.get("type") not in ITEM_TYPES:
            err(name, f"{iid}: type 非法 {it.get('type')}")
        stage = it.get("stage")
        if stage not in STAGES:
            err(name, f"{iid}: stage 非法 {stage}")
        else:
            stage_count[stage] += 1
        if not it.get("prompt") or not it.get("answer"):
            err(name, f"{iid}: prompt/answer 不能为空")
        if len(it.get("explain_zh", "")) < 5:
            err(name, f"{iid}: explain_zh 过短")
        d = it.get("difficulty")
        if not isinstance(d, (int, float)) or not (1 <= d <= 5):
            err(name, f"{iid}: difficulty 应在 1–5")
        if it.get("type") == "choice":
            opts = it.get("options") or []
            if len(opts) < 2:
                err(name, f"{iid}: choice 至少 2 个选项")
            if it.get("answer") not in opts:
                err(name, f"{iid}: choice 的 answer 不在 options 中")
        if it.get("stage") == "guided" and not it.get("hint_zh"):
            warn(name, f"{iid}: guided 题建议提供 hint_zh")

    for s in STAGES:
        if stage_count[s] == 0:
            err(name, f"缺少 {s} 阶段的题目")

    for src in kp["sources"]:
        sid = src.get("source_id")
        entry = registry.get(sid)
        if not entry:
            err(name, f"未知来源 {sid}（未在 sources.json 注册）")
        elif entry.get("policy") == "forbidden":
            err(name, f"使用了禁止来源 {sid}")
        elif entry.get("policy") == "verify_only" and src.get("usage") not in ("verification", "grammar_taxonomy", "conjugation_generation"):
            warn(name, f"来源 {sid} 为 verify_only，usage={src.get('usage')} 需确认不构成改编")

    for pid in kp.get("prereqs", []):
        if pid == kp["id"]:
            err(name, "prereqs 不能指向自身")
        elif pid not in all_ids:
            warn(name, f"先修 {pid} 不在当前内容库中（M0 阶段可接受，上线前需补齐）")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true", help="警告也视为失败")
    args = ap.parse_args()

    if not KP_DIR.exists():
        print(f"[error] 找不到 {KP_DIR}", file=sys.stderr)
        return 2

    registry = {s["id"]: s for s in load_json(SOURCES)["sources"]}
    files = sorted(KP_DIR.glob("*.json"))
    if not files:
        print("[error] content/kp 下没有知识点文件", file=sys.stderr)
        return 2

    kps = []
    for f in files:
        try:
            kps.append((load_json(f), f))
        except json.JSONDecodeError as exc:
            err(f.name, f"JSON 解析失败：{exc}")

    all_ids = {kp.get("id") for kp, _ in kps if kp.get("id")}

    # 可选：正式 JSON Schema 校验
    try:
        import jsonschema  # type: ignore

        schema = load_json(SCHEMA)
        for kp, f in kps:
            try:
                jsonschema.validate(kp, schema)
            except jsonschema.ValidationError as exc:  # type: ignore
                err(f.name, f"schema: {exc.message} @ {list(exc.absolute_path)}")
    except ImportError:
        warn("global", "未安装 jsonschema，跳过正式 schema 校验（pip install jsonschema）")

    for kp, f in kps:
        check_kp(kp, f, registry, all_ids)

    print(f"检查 {len(kps)} 个知识点，{sum(len(k['items']) for k, _ in kps)} 道题\n")
    for w in warnings:
        print(f"[warn]  {w}")
    for e in errors:
        print(f"[error] {e}")

    if errors or (args.strict and warnings):
        print(f"\n失败：{len(errors)} 个错误，{len(warnings)} 个警告")
        return 1
    print(f"\n通过：{len(warnings)} 个警告")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
