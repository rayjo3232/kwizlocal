# The Brainmap

## What it was

Three screens of lists. Five full-width cards for the levels, then a column of
category cards, then rows of points. Every one of them was readable and none of
them was a map: there was no area, no position, and nothing to read at a glance
except the numbers themselves.

## What it is

One canvas per zoom level, the same mosaic at every depth.

```
Level        5 regions, area = how many points the level holds
  └ Area     6–10 regions, area = how many points the area holds
     └ Point 2–8 cells, area = the point's weight
```

Tapping zooms in. A point tile opens the drawer, which is where Practise lives.

Three variables carry the whole picture:

- **area** — how much material is in a region
- **the percentage** — how much of that material you have mastered
- **colour** — the same percentage, as a band

That is the point of a map: you should be able to answer "where am I weak"
without reading a single number.

## What the number means

`regionStat()` in `app.js`. Every point contributes its display score clamped to
0–100, a point you have never opened contributes 0, and the average is weighted
by the point's teaching weight.

That last part is the whole design: **an untouched point counts as zero**. A
level you answered twelve questions in is not two-thirds known, and a
percentage that ignores the material you have not met yet is not a percentage of
anything. So `A0 62%` means "you have mastered 62% of A0", not "your average
confidence in the parts of A0 you happened to touch".

The first version of this screen showed a confidence score next to a count of
points at 75+, and the two contradicted each other: `54%` above `0 of 38
mastered`. Both numbers were right and the sentence they made was nonsense. The
tiles now carry one number and the amount of material; the breakdown lives in
the band you get after tapping in.

### The band

Opening a level or an area puts a summary above the canvas:

```
A0 · Entry                                          67%
22 points                                          MASTERY
[###############################··········]
22 of 22 started · 2 needs work · 8 due
[ Practise this level ]
```

The bar splits the points into mastered / getting there / needs work / not
started, in that order, so the shape answers "what is left" before the numbers
do. `Practise this level` drills exactly the region you are looking at.

### Colour bands

| Band | Meaning |
|---|---|
| grey | not started |
| red | needs review — a quarter of what you attempted here is going wrong |
| yellow | under 40% mastered |
| light green | 40–69% |
| green | 70–89% |
| dark green | 90%+ |

Red is deliberately hard to reach: one shaky point out of thirty-eight painted
the whole level red in the first pass, which is a warning nobody can act on.

## The layout

A mosaic, not a grid: rows whose heights are proportional to their contents,
and cells whose widths are proportional inside their row.

Two simpler options were tried and rejected:

**Greedy squarified treemap** (the standard algorithm). It packs cells as
square as it can, row by row, and it does not look ahead. Five levels came out
as 2 + 2 + one full-width strip 40px tall — the entry level, the one a beginner
looks at most, rendered as a sliver that held nothing but its name.

**Fixed grid with spans** (bento). No slivers, but the areas stop meaning
anything, and a grid of equal cells is what the old card list already was.

The current version lays out every possible row count and scores it by its worst
aspect ratio, then keeps the best. Five items land on 2 + 3; six on 2 + 4 or
3 + 3; ten on 3 + 3 + 4. It is deterministic — the same data always produces the
same map, which matters because a map that rearranges itself is a chart.

Two corrections keep small cells usable:

- **a width floor** (74px) lifts a one-point category that would otherwise get
  39px, taking the difference from the wider cells in the same row;
- **content is decided per line**, not per size class — a narrow cell keeps its
  score and drops its meta, rather than dropping both.

## Labels

Tiles say as much as they can hold, and no more:

| Room | Shows |
|---|---|
| ≥132×78 | name, score, subtitle, meta |
| ≥100×56 | name (2 lines), score below, meta |
| smaller | name (1 line), score below |

Below 104px a category switches to a short label (`Adj./adv.`), because a
clipped word reads as a bug and a shorter one reads as a decision.

Level tiles use the CEFR code as the name and the descriptor as the subtitle:
`A0` fits in 74px, `A0 · Entry` does not.

## Why pixels and not CSS

The layout depends on the measured width of the canvas, so `paintMap()` runs
after the markup is in place, reads `clientWidth`, and writes absolute
positions. On resize only the canvas is repainted — the page around it does not
move.

jsdom reports `clientWidth` as 0, so there is a 340px fallback; the smoke tests
assert the geometry (inside the canvas, no overlaps, area follows the data)
against that fallback.

## The dashboard preview is different on purpose

The dashboard's Brainmap card still renders the compact level cards. It is a
summary strip inside a dense page, not the map: at that height the mosaic would
have no room for a label, and a map with no labels is decoration.

## Verification

`smoke21` covers the geometry (nothing spills out, no two cells overlap, a level
with more points gets more area, no cell under the floor), the three zoom
levels, the drawer opening from a point tile, and colour following the score
rather than the level.

Overflow was checked at 360 / 390 / 768 / 1280: zero on every width.
