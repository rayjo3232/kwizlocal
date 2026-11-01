# Answering a choice question

## The rule

**Tap once to select, tap again on the same option to confirm.** The second tap
submits — there is no Check button.

```
┌───────────────────────────────┐
│ 1  le                          │
├───────────────────────────────┤
│ 2  la                 tap again│  ← selected, waiting for confirmation
├───────────────────────────────┤
│ 3  les                         │
└───────────────────────────────┘
```

Why two taps rather than one:

- **A stray tap costs nothing.** On a phone, one tap is easy to land by
  accident, and an accidental answer is a wrong answer that counts.
- **There is no second control to find.** The old flow was tap, then hunt for
  Check — two different gestures in two different places.
- **A double-click is the same two taps**, so the impatient path already works.

Tapping a *different* option moves the selection instead of confirming; only a
second tap on the already-selected option submits.

## Keyboard

| Key | Effect |
|---|---|
| `1`–`4` | select that option |
| the same number again | confirm and submit |
| `Enter` | submit the current selection |
| `Esc` | skip |

## Where it applies

| Screen | Behaviour |
|---|---|
| Kwiz (main practice) | two taps, no Check button |
| Pre-learn guided and check | two taps |
| Placement | two taps, then it advances |
| **Exam** | one tap selects, **Next** advances |

The exam is the one exception, on purpose. It is timed, it gives no feedback,
and there is no going back to a previous question — an accidental advance is
unrecoverable. The Next button is visible there, so the different rule is
discoverable from the screen rather than from memory.

## Typed answers are unchanged

A typed answer still has a Check button, because there is nothing to confirm:
the text is either in the box or it is not, and Enter submits from anywhere in
the field.

## State

`session.selected` holds the pending choice and is written on the first tap, so
a reload mid-question keeps the selection. `prelearn.selected` does the same for
the pre-learn steps and is cleared whenever the step advances or a retry starts.
