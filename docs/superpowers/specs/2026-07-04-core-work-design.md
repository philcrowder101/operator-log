# Core Work Blocks (AB Triad, AB Triad 2, Bird Dogs & Side Planks) — Design

**Date:** 2026-07-04
**Status:** Approved

## Purpose

Add schedulable core/accessory work blocks that can be assigned to any day of any
template, alongside strength and conditioning. Three predefined blocks:

1. **AB Triad** — Plank (timed), Shank (timed), plus *one of* Wheel Rollout (reps)
   or Hanging Toe-to-Bar (reps), chosen at assignment time.
2. **AB Triad 2** — Hanging Leg Raises, Hanging Knee Raises, Hanging Toe-to-Bar
   Raises (all reps).
3. **Bird Dogs & Side Planks** — Bird Dogs (timed), Side Planks (timed).

Blocks are performed circuit-style: N rounds through all movements, with rest
between rounds.

## Decisions made during brainstorming

- Core work is scheduled per week/day in **cycle settings**, mirroring the
  existing conditioning schedule. No ad-hoc "add to today" flow.
- The AB Triad third movement (Wheel Rollout vs Hanging Toe-to-Bar) is chosen
  **at assignment time**, per day.
- Sets/reps/durations/rest are configured **per assignment**; different days may
  differ.
- Sets are **block-level rounds** (circuit-style), not per-movement.

## Data model

### Block definitions — `src/data/coreWorkBlocks.js` (new)

```js
export const CORE_WORK_BLOCKS = [
  {
    id: 'ab-triad',
    name: 'AB Triad',
    fixedMovements: [
      { name: 'Plank', mode: 'timed' },
      { name: 'Shank', mode: 'timed' },
    ],
    choiceMovements: [
      { name: 'Wheel Rollout', mode: 'reps' },
      { name: 'Hanging Toe-to-Bar', mode: 'reps' },
    ],
    roundsRange: [1, 3],
    repsRange: [1, 10],
  },
  {
    id: 'ab-triad-2',
    name: 'AB Triad 2',
    fixedMovements: [
      { name: 'Hanging Leg Raises', mode: 'reps' },
      { name: 'Hanging Knee Raises', mode: 'reps' },
      { name: 'Hanging Toe-to-Bar Raises', mode: 'reps' },
    ],
    choiceMovements: [],
    roundsRange: [3, 5],
    repsRange: [5, 10],
  },
  {
    id: 'bird-dogs-side-planks',
    name: 'Bird Dogs & Side Planks',
    fixedMovements: [
      { name: 'Bird Dogs', mode: 'timed' },
      { name: 'Side Planks', mode: 'timed' },
    ],
    choiceMovements: [],
    roundsRange: [1, 3],
    repsRange: [1, 10],
  },
]
```

Shared limits (exported constants from the same file):

- Timed movements: **10–300 seconds**
- Rest between rounds: **1–5 minutes** (`restMinutes`), all blocks

Defaults at assignment time:

- Rounds: 3 for all blocks (top of range for AB Triad and Bird Dogs & Side
  Planks; bottom of range for AB Triad 2)
- Timed movements: 60 seconds
- Reps: AB Triad rep movements default to 5; AB Triad 2 defaults to **5**
- Rest: 2 minutes

### Cycle field — `coreWorkSchedule` (new array on cycle objects)

Same lookup philosophy as `conditioningSchedule`:

```js
coreWorkSchedule: [
  {
    weekNumber: 1,        // wave week (1-based)
    dayOfWeek: 1,         // 0=Sun ... 6=Sat
    blockId: 'ab-triad',
    rounds: 3,            // clamped to block roundsRange
    restMinutes: 2,       // 1-5
    movements: [          // fixed + chosen movement, each with its prescription
      { name: 'Plank', mode: 'timed', seconds: 60 },
      { name: 'Shank', mode: 'timed', seconds: 60 },
      { name: 'Wheel Rollout', mode: 'reps', reps: 5 },
    ],
  },
]
```

Movements are resolved (fixed + chosen) and snapshotted onto the entry at
assignment time, so the day card renders without re-deriving choice state.

**No Dexie schema change** — cycles store arbitrary fields; only indexed keys
are declared in `db.js`.

## Components & data flow

### `CoreWorkScheduleEditor` — `src/components/CoreWorkScheduleEditor.jsx` (new)

Modeled on `ConditioningScheduleEditor`:

- Week picker chips (Wk 1..N from `totalWaveWeeks`)
- Seven day rows showing assigned block name or "—", with "+ Assign" / "Change"
  / "Remove"
- Bottom-sheet modal to assign:
  1. Pick one of the three blocks
  2. AB Triad only: toggle Wheel Rollout vs Hanging Toe-to-Bar
  3. Rounds stepper (clamped to block `roundsRange`)
  4. Rest minutes stepper (1–5)
  5. Per-movement inputs: seconds (10–300) for timed, reps (block `repsRange`)
     for rep-based
- Receives `cycle`, `totalWaveWeeks`, `onChange(updatedSchedule)`; parent
  persists to the cycle in Dexie (same pattern as conditioning)

Placed in `SettingsView` directly below the conditioning schedule section.

### `buildWeekPlan()` — `src/utils/weekPlanBuilder.js` (modified)

After the conditioning lookup, match `cycle.coreWorkSchedule` entries by
`weekNumber === waveWeek.week && dayOfWeek === day.dayOfWeek` and attach the
entry as `day.coreWork` (or `null`). Rest weeks / no-cycle weeks get
`coreWork: null`. Because matching keys off day-of-week, this works on every
template, including strengthOff weeks of Base Build templates (core work still
appears — it is independent of strength).

### `CoreWorkCard` — `src/components/CoreWorkCard.jsx` (new)

Rendered by `DayCard` below the conditioning block, with the same divider
treatment. Shows:

- Block name header
- Summary line: "3 rounds · 2 min rest"
- One line per movement: reps ("Wheel Rollout — 5 reps") or formatted duration
  ("Plank — 1:00")

`DayCard`'s rest-day logic updates: a day with core work is not a "Rest Day".

### `formatDuration(seconds)` — small helper (new, in `coreWorkBlocks.js` or a
utils file)

Formats seconds as `m:ss` (e.g., 90 → "1:30", 60 → "1:00", 45 → "0:45").

## Error handling

- Editor inputs are clamped to block ranges on change; no free-form invalid
  state can be persisted.
- `buildWeekPlan` treats a `coreWorkSchedule` entry with an unknown `blockId`
  defensively: the snapshotted `movements`/`rounds`/`restMinutes` on the entry
  are sufficient to render, so no lookup failure is possible at display time.
- Cycles created before this feature simply lack `coreWorkSchedule`; all reads
  use `cycle.coreWorkSchedule || []`.

## Testing

Vitest (unit, existing config):

- `buildWeekPlan` attaches `coreWork` on the right week/day; `null` elsewhere
- `coreWork` is `null` for rest weeks / no active cycle
- Core work appears during `strengthOff` weeks (Base Build)
- `formatDuration` edge cases (10s, 60s, 90s, 300s)

Playwright (e2e): existing suite must stay green. New e2e coverage optional:
assign a block in Settings and verify it renders on This Week.

## Out of scope

- Logging/completion tracking for core work
- Custom user-defined core blocks
- Ad-hoc per-day additions from the This Week view
