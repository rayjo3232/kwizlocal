# 内容库工作说明

> **这份说明描述的是 M0 阶段的旧内容管线，应用不再使用它。**
>
> 应用实际加载的内容只有一处：**`app/data.js`**（题目扩展在 `app/extra.js`，
> 教学顺序在 `app/curriculum.js`）。课程的中文标题在 `app/zh.js`，中文母语提示
> 在 `app/contrast.js`。
>
> 想看结构化视图就跑 `node tools/export_content.js`，它会生成
> `content/curriculum.json`（162 个点 / 1,274 道题），那是 data.js 的投影，
> **不要手改**；`node tools/export_content.js --check` 会告诉你有没有过期。
>
> 旧的 `kp/*.json` 草案已移到 `content/legacy/`，只作历史留存。它用的是另一套
> schema（`title_zh` / `rule_zh` / `fr.` 前缀），改了它页面不会有任何变化——
> 这正是当初要消除的问题。
>
> 校验入口不变：`python tools/validate_content.py` 现在跑的是
> `check_data.js` + 导出同步检查。

---

一个知识点 = 一个 JSON 文件 = 一段 3 分钟微课 + 8 道题 + 音频 + 来源标注。
所有内容必须能在没有网络的情况下被应用读取。

## 目录

```
content/
├─ sources.json          来源注册表（许可、用途、署名文本）
├─ schema/kp.schema.json 知识点 JSON Schema
├─ kp/*.json             已入库的知识点
└─ candidates/*.json     从 Tatoeba 抓来的候选例句（未审，不入库）
tts/fr/<kp_id>/*.wav     合成音频（按 kp 分目录）
```

## 一个知识点的字段

| 字段 | 说明 |
|---|---|
| `id` | `fr.<级别>.<范畴>.<规则>`，如 `fr.a1.negation.ne_pas`。文件名必须与 id 一致 |
| `level` | `A0 / A1 / A2L / A2U / B1 / B2 / C1` |
| `weight` | 0.5–2.0，该点对级别能力的代表性；级别分聚合时使用 |
| `difficulty` | 1–5 先验难度，后续由作答数据校准 |
| `prereqs` | 先修 id 列表，决定「能不能学」 |
| `contrasts` | 易混 id 列表，用于生成辨析题 |
| `primer.rule_zh` | 一句话规则，≤ 120 字。超过说明拆得不够细 |
| `primer.examples` | 2–4 组「法语 + 中文 + 一句说明」，必须有音频 |
| `primer.pitfall_zh` | 中文母语者最常犯的错，≤ 120 字 |
| `items` | 6–12 题，建议 8 题：guided 3 + check 3 + kwiz 2 |
| `sources` | 每个来源必须在 `sources.json` 注册，并写清用途 |

## 三条硬规则

1. **讲解必须中文重写。** 可以读 Français interactif / Wikibooks 的语法页，但不能整段翻译或改写；用自己的话讲「中国学习者需要知道的那一句」。
2. **例句可以来自 Tatoeba，但要改写。** 保留句型，调整长度与语域；`sources` 里记 `sentence:<id>`。
3. **音频统一用 TTS 生成。** 不用 Tatoeba 音频（许可逐条不同），不用版权站点的音频。

## 命令

```bash
# 1. 找候选例句（输出到 content/candidates/）
python tools/fetch_tatoeba.py --query "n'ai pas de" --limit 20 --slug negation_ne_pas

# 2. 校验全部知识点
python tools/validate_content.py

# 3. 检查 TTS 环境
python tools/tts_piper.py --check

# 4. 合成某个知识点的音频
python tools/tts_piper.py --kp content/kp/fr.a1.negation.ne_pas.json

# 5. 全量合成（已存在的跳过）
python tools/tts_piper.py --all --model models/fr_FR-siwis-medium.onnx
```

### TTS 准备

```bash
pip install piper-tts
mkdir -p models && cd models
# 下载 fr_FR-siwis-medium.onnx 与 fr_FR-siwis-medium.onnx.json
# https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium
```

声音选择：`fr_FR-siwis-medium`（CC BY 4.0，默认）、`fr_FR-mls-medium`（CC BY 4.0，多说话人）。
**不要用** `fr_FR-tom-medium`（AGPLv3）。

## 上线前检查

- [ ] `validate_content.py` 零错误
- [ ] 4 条例句音频都存在且能播放
- [ ] 换一个人盲做 3 题能全对（题干无歧义）
- [ ] `sources.json` 里对应来源的 `attribution` 已出现在应用的「内容来源」页
- [ ] `status` 从 `draft` 改为 `reviewed`，并在 `meta.reviewed_at` 记录日期

## 署名页模板

应用「关于 → 内容来源」页至少包含：

> 例句参考自 Tatoeba（https://tatoeba.org），文本采用 CC BY 2.0 FR 许可。
> 语音由 Piper 合成，fr_FR-siwis 声音基于 SIWIS 数据（CC BY 4.0）。
> 语法结构参考 Français interactif（COERLL, UT Austin, CC BY 4.0）。
> 所有中文讲解与题目为本项目原创。
