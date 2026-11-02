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

## Anatomy of a tile

```
┌──────────────────────────┐
│ Verbs & tenses           │  title, up to the lines the height allows
│ 56%                      │  the figure, display size
│ ████████████░░░░░░░░░░░  │  the same number as a length
│ 7 pts · 1 weak           │  detail, only when there is room
└──────────────────────────┘
```

The figure is the point of the tile, so it is set as one: tight leading, tabular
digits, and the percent sign dropped to a caption so `56%` reads as one object.
The bar under it draws the same number as a length — without it the tile was a
title at the top, a number at the bottom and 120px of nothing in between.

Three sizes, decided by width *and* height:

| Size | When | Title | Figure |
|---|---|---|---|
| full | ≥132×148 | up to 2 lines, 17px | display (32px) |
| mid | ≥100×84 | up to 3 lines, 13px | 20px |
| small | smaller | up to 2 lines, 11px | 15px |

Height matters as much as width: a 150×125 cell took the display size on width
alone and had no room left for a second title line.

### What gets dropped, and in what order

Every tile has a fixed budget. When it runs out, the order is:

1. **detail line** (dropped below 126px tall)
2. **subtitle** (dropped below 180px — it repeats what the level code says)
3. **title lines** — last, and computed from the remaining height and the
   length of the title itself, not from a constant

That last point is the one that bit twice. A fixed three-line clamp in a 95px
row sliced titles in half; a fixed one-line clamp turned "Articles & nouns" into
"Articles &…" forever.

## Two floors, not one

The mosaic gives each row a height proportional to its material and each cell a
width proportional to its own. Both are floored, and for the same reason: a row
holding two of twelve points got 90px, which is less than a tile's own content,
so the title was cut. The floor is taken from the rows (or cells) that have
slack, so the proportions stay readable.

A row is never shorter than 128px, and the canvas grows with the cell count
(`128 × ceil(n/3)`) rather than dividing a fixed height into ever-shorter
strips.

## Labels

Below 104px a category switches to a short label (`Adj./adv.`), because a
clipped word reads as a bug and a shorter one reads as a decision.

Level tiles use the CEFR code as the name: `A0` fits in 74px, `A0 · Entry`
does not.

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
levels, the drawer opening from a point tile, colour following the score rather
than the level, the mastery percentage and its buckets, the summary band, the
dashboard cards opening the map — and, since the tiles started carrying a
figure and a bar, that no row is shorter than 128px and that titles are allowed
to wrap.

Overflow was checked at 360 / 390 / 768 / 1280: zero on every width.
