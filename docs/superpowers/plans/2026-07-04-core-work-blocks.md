# Core Work Blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Schedulable core work blocks (AB Triad, AB Triad 2, Bird Dogs & Side Planks) assignable to any day of any template via cycle settings, rendered on the This Week view.

**Architecture:** Mirrors the existing conditioning-schedule pattern: block definitions live in a constants file, assignments are stored as a `coreWorkSchedule` array on the cycle object in Dexie (no schema change), `buildWeekPlan()` attaches the matching entry to each day, and the day card renders a new core work block. Spec: `docs/superpowers/specs/2026-07-04-core-work-design.md`.

**Tech Stack:** React 19, Dexie 4 (`dexie-react-hooks`), Tailwind CSS 4, Vitest (unit, node env — components are NOT unit tested in this repo), Playwright (e2e).

**Project conventions that matter here:**
- Unit tests only cover pure functions; React components are covered by Playwright e2e (`npm run test:e2e`).
- Vitest excludes `e2e/**` (see `vite.config.js`).
- Date-sensitive tests pin time with `vi.useFakeTimers()` + `vi.setSystemTime(new Date(2026, 3, 13))` (mid-April, clear of DST).
- Cycle `startDate` is a plain `YYYY-MM-DD` string.

---

### Task 1: Block definitions, defaults, and formatDuration

**Files:**
- Create: `src/data/coreWorkBlocks.js`
- Test: `src/data/coreWorkBlocks.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/data/coreWorkBlocks.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  CORE_WORK_BLOCKS,
  buildDefaultAssignment,
  formatDuration,
  TIMED_SECONDS_MIN,
  TIMED_SECONDS_MAX,
  REST_MINUTES_MIN,
  REST_MINUTES_MAX,
} from './coreWorkBlocks'

describe('CORE_WORK_BLOCKS', () => {
  it('defines the three blocks', () => {
    expect(CORE_WORK_BLOCKS.map((b) => b.id)).toEqual([
      'ab-triad',
      'ab-triad-2',
      'bird-dogs-side-planks',
    ])
  })

  it('AB Triad has two timed fixed movements and two rep-based choices', () => {
    const abTriad = CORE_WORK_BLOCKS.find((b) => b.id === 'ab-triad')
    expect(abTriad.fixedMovements).toEqual([
      { name: 'Plank', mode: 'timed' },
      { name: 'Shank', mode: 'timed' },
    ])
    expect(abTriad.choiceMovements).toEqual([
      { name: 'Wheel Rollout', mode: 'reps' },
      { name: 'Hanging Toe-to-Bar', mode: 'reps' },
    ])
    expect(abTriad.roundsRange).toEqual([1, 3])
    expect(abTriad.repsRange).toEqual([1, 10])
  })

  it('AB Triad 2 has three rep-based movements with 3-5 rounds and 5-10 reps', () => {
    const abTriad2 = CORE_WORK_BLOCKS.find((b) => b.id === 'ab-triad-2')
    expect(abTriad2.fixedMovements).toEqual([
      { name: 'Hanging Leg Raises', mode: 'reps' },
      { name: 'Hanging Knee Raises', mode: 'reps' },
      { name: 'Hanging Toe-to-Bar Raises', mode: 'reps' },
    ])
    expect(abTriad2.choiceMovements).toEqual([])
    expect(abTriad2.roundsRange).toEqual([3, 5])
    expect(abTriad2.repsRange).toEqual([5, 10])
  })

  it('exports shared limits', () => {
    expect(TIMED_SECONDS_MIN).toBe(10)
    expect(TIMED_SECONDS_MAX).toBe(300)
    expect(REST_MINUTES_MIN).toBe(1)
    expect(REST_MINUTES_MAX).toBe(5)
  })
})

describe('buildDefaultAssignment', () => {
  it('builds AB Triad defaults with first choice movement when none given', () => {
    expect(buildDefaultAssignment('ab-triad')).toEqual({
      blockId: 'ab-triad',
      rounds: 3,
      restMinutes: 2,
      movements: [
        { name: 'Plank', mode: 'timed', seconds: 60 },
        { name: 'Shank', mode: 'timed', seconds: 60 },
        { name: 'Wheel Rollout', mode: 'reps', reps: 5 },
      ],
    })
  })

  it('uses the requested choice movement', () => {
    const a = buildDefaultAssignment('ab-triad', 'Hanging Toe-to-Bar')
    expect(a.movements[2]).toEqual({ name: 'Hanging Toe-to-Bar', mode: 'reps', reps: 5 })
  })

  it('builds AB Triad 2 defaults: 3 rounds, 5 reps each', () => {
    expect(buildDefaultAssignment('ab-triad-2')).toEqual({
      blockId: 'ab-triad-2',
      rounds: 3,
      restMinutes: 2,
      movements: [
        { name: 'Hanging Leg Raises', mode: 'reps', reps: 5 },
        { name: 'Hanging Knee Raises', mode: 'reps', reps: 5 },
        { name: 'Hanging Toe-to-Bar Raises', mode: 'reps', reps: 5 },
      ],
    })
  })

  it('builds Bird Dogs & Side Planks defaults: 3 rounds, 60s each', () => {
    expect(buildDefaultAssignment('bird-dogs-side-planks')).toEqual({
      blockId: 'bird-dogs-side-planks',
      rounds: 3,
      restMinutes: 2,
      movements: [
        { name: 'Bird Dogs', mode: 'timed', seconds: 60 },
        { name: 'Side Planks', mode: 'timed', seconds: 60 },
      ],
    })
  })

  it('returns null for an unknown block id', () => {
    expect(buildDefaultAssignment('nope')).toBeNull()
  })
})

describe('formatDuration', () => {
  it('formats sub-minute durations', () => {
    expect(formatDuration(10)).toBe('0:10')
    expect(formatDuration(45)).toBe('0:45')
  })

  it('formats whole minutes', () => {
    expect(formatDuration(60)).toBe('1:00')
    expect(formatDuration(300)).toBe('5:00')
  })

  it('formats minutes with seconds', () => {
    expect(formatDuration(90)).toBe('1:30')
    expect(formatDuration(125)).toBe('2:05')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/coreWorkBlocks.test.js`
Expected: FAIL — "Failed to resolve import ./coreWorkBlocks"

- [ ] **Step 3: Write the implementation**

Create `src/data/coreWorkBlocks.js`:

```js
export const TIMED_SECONDS_MIN = 10
export const TIMED_SECONDS_MAX = 300
export const REST_MINUTES_MIN = 1
export const REST_MINUTES_MAX = 5

export const DEFAULT_TIMED_SECONDS = 60
export const DEFAULT_REST_MINUTES = 2
export const DEFAULT_ROUNDS = 3

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
    defaultReps: 5,
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
    defaultReps: 5,
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
    defaultReps: 5,
  },
]

/**
 * Build a fully-populated assignment (rounds/rest/movement prescriptions)
 * for a block, using its defaults. choiceName selects among choiceMovements;
 * falls back to the first choice when omitted.
 */
export function buildDefaultAssignment(blockId, choiceName = null) {
  const block = CORE_WORK_BLOCKS.find((b) => b.id === blockId)
  if (!block) return null

  const movements = [...block.fixedMovements]
  if (block.choiceMovements.length > 0) {
    const chosen =
      block.choiceMovements.find((m) => m.name === choiceName) || block.choiceMovements[0]
    movements.push(chosen)
  }

  const [minRounds, maxRounds] = block.roundsRange
  return {
    blockId: block.id,
    rounds: Math.min(Math.max(DEFAULT_ROUNDS, minRounds), maxRounds),
    restMinutes: DEFAULT_REST_MINUTES,
    movements: movements.map((m) =>
      m.mode === 'timed'
        ? { name: m.name, mode: 'timed', seconds: DEFAULT_TIMED_SECONDS }
        : { name: m.name, mode: 'reps', reps: block.defaultReps }
    ),
  }
}

/** 90 → "1:30" */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/coreWorkBlocks.test.js`
Expected: PASS (12 tests)

- [ ] **Step 5: Commit**

```bash
git add src/data/coreWorkBlocks.js src/data/coreWorkBlocks.test.js
git commit -m "feat: add core work block definitions and defaults"
```

---

### Task 2: Attach coreWork to days in buildWeekPlan

**Files:**
- Modify: `src/utils/weekPlanBuilder.js` (null-cycle branch ~line 33, day return ~line 120)
- Test: `src/utils/weekPlanBuilder.test.js` (append new describe block)

- [ ] **Step 1: Write the failing tests**

Append to `src/utils/weekPlanBuilder.test.js` (uses the existing `baseCycle`/`squat` fixtures and fake timers already in the file):

```js
// ─── core work ───────────────────────────────────────────────────────────────

describe('buildWeekPlan — core work', () => {
  const abTriadEntry = {
    weekNumber: 1,
    dayOfWeek: 2, // Tuesday
    blockId: 'ab-triad',
    rounds: 3,
    restMinutes: 2,
    movements: [
      { name: 'Plank', mode: 'timed', seconds: 60 },
      { name: 'Shank', mode: 'timed', seconds: 60 },
      { name: 'Wheel Rollout', mode: 'reps', reps: 5 },
    ],
  }

  it('attaches the matching entry to the right day', () => {
    const cycle = baseCycle({ coreWorkSchedule: [abTriadEntry] })
    const plan = buildWeekPlan(cycle, [squat], [], 0)
    const tuesday = plan.find((d) => d.dayOfWeek === 2)
    expect(tuesday.coreWork).toEqual(abTriadEntry)
  })

  it('leaves coreWork null on other days', () => {
    const cycle = baseCycle({ coreWorkSchedule: [abTriadEntry] })
    const plan = buildWeekPlan(cycle, [squat], [], 0)
    plan.filter((d) => d.dayOfWeek !== 2).forEach((d) => {
      expect(d.coreWork).toBeNull()
    })
  })

  it('does not match the same day in a different wave week', () => {
    const cycle = baseCycle({ coreWorkSchedule: [abTriadEntry] })
    // weekOffset 1 → wave week 2; entry is for week 1
    const plan = buildWeekPlan(cycle, [squat], [], 1)
    const tuesday = plan.find((d) => d.dayOfWeek === 2)
    expect(tuesday.coreWork).toBeNull()
  })

  it('is null on every day when the cycle has no coreWorkSchedule', () => {
    const plan = buildWeekPlan(baseCycle(), [squat], [], 0)
    plan.forEach((d) => expect(d.coreWork).toBeNull())
  })

  it('is null on every day for a null cycle (rest week)', () => {
    const plan = buildWeekPlan(null, [], [], 0)
    plan.forEach((d) => expect(d.coreWork).toBeNull())
  })

  it('appears during strengthOff weeks (Base Build)', () => {
    // bb-fighter-finish week 1 is strengthOff; core work is independent of strength
    const cycle = baseCycle({
      templateId: 'bb-fighter-finish',
      liftIds: [1],
      coreWorkSchedule: [abTriadEntry],
    })
    const plan = buildWeekPlan(cycle, [squat], [], 0)
    const tuesday = plan.find((d) => d.dayOfWeek === 2)
    expect(tuesday.coreWork).toEqual(abTriadEntry)
    expect(tuesday.exercises).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/weekPlanBuilder.test.js`
Expected: FAIL — the 6 new tests fail with `expected undefined to ... null` (coreWork is not yet set)

- [ ] **Step 3: Implement**

In `src/utils/weekPlanBuilder.js`, make two changes.

Change 1 — the null-cycle branch return object (currently ends with `conditioning: null`):

```js
      return {
        date,
        dayOfWeek: date.getDay(),
        dayLabel: DAY_NAMES[date.getDay()],
        sessionLabel: null,
        waveWeek: null,
        exercises: [],
        conditioning: null,
        coreWork: null,
      }
```

Change 2 — inside the `weekDays.map((day) => { ... })`, after the conditioning lookup and before the final `return`:

```js
    const coreWork =
      (cycle.coreWorkSchedule || []).find(
        (e) => e.weekNumber === waveWeek?.week && e.dayOfWeek === day.dayOfWeek
      ) || null
```

And add `coreWork` to the returned day object:

```js
    return {
      date: day.date,
      dayOfWeek: day.dayOfWeek,
      dayLabel: DAY_NAMES[day.dayOfWeek],
      sessionLabel: day.sessionLabel,
      waveWeek,
      exercises,
      conditioning,
      coreWork,
    }
```

- [ ] **Step 4: Run the full unit suite**

Run: `npm test`
Expected: PASS — all suites, including the 6 new tests (67 total)

- [ ] **Step 5: Commit**

```bash
git add src/utils/weekPlanBuilder.js src/utils/weekPlanBuilder.test.js
git commit -m "feat: attach scheduled core work to week plan days"
```

---

### Task 3: CoreWorkCard and DayCard integration

Components are not unit tested in this repo (Vitest runs in node env). This task is verified by lint/build here and by e2e in Task 6.

**Files:**
- Create: `src/components/CoreWorkCard.jsx`
- Modify: `src/components/DayCard.jsx`

- [ ] **Step 1: Create `src/components/CoreWorkCard.jsx`**

```jsx
import { CORE_WORK_BLOCKS, formatDuration } from '../data/coreWorkBlocks'

export default function CoreWorkCard({ coreWork }) {
  const blockName =
    CORE_WORK_BLOCKS.find((b) => b.id === coreWork.blockId)?.name || coreWork.blockId

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
          Core
        </span>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{blockName}</span>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        {coreWork.rounds} {coreWork.rounds === 1 ? 'round' : 'rounds'} · {coreWork.restMinutes} min rest
      </div>

      <div className="space-y-1">
        {coreWork.movements.map((m, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">{m.name}</span>
            <span className="text-gray-500 dark:text-gray-400">
              {m.mode === 'timed' ? formatDuration(m.seconds) : `${m.reps} reps`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into `src/components/DayCard.jsx`**

Replace the full file with:

```jsx
import StrengthSessionCard from './StrengthSessionCard'
import ConditioningCard from './ConditioningCard'
import CoreWorkCard from './CoreWorkCard'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function DayCard({ day }) {
  const { date, dayLabel, sessionLabel, exercises, conditioning, coreWork, waveWeek } = day

  const isToday = new Date().toDateString() === date.toDateString()
  const hasStrength = sessionLabel !== null && exercises.length > 0
  const hasConditioning = conditioning !== null
  const hasCoreWork = coreWork != null
  const isRest = !hasStrength && !hasConditioning && !hasCoreWork

  return (
    <div className={`rounded-xl border p-4 ${
      isToday
        ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-base ${
            isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'
          }`}>
            {dayLabel}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {MONTH_NAMES[date.getMonth()]} {date.getDate()}
          </span>
          {isToday && (
            <span className="text-xs font-medium bg-blue-500 text-white px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>
        {isRest && (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Rest Day</span>
        )}
      </div>

      {hasStrength && (
        <StrengthSessionCard
          sessionLabel={sessionLabel}
          exercises={exercises}
          waveWeek={waveWeek}
        />
      )}

      {hasConditioning && (
        <div className={hasStrength ? 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-700' : ''}>
          <ConditioningCard conditioning={conditioning} />
        </div>
      )}

      {hasCoreWork && (
        <div className={hasStrength || hasConditioning ? 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-700' : ''}>
          <CoreWorkCard coreWork={coreWork} />
        </div>
      )}
    </div>
  )
}
```

Note: `coreWork != null` (loose) also guards `undefined` from any pre-feature plan objects.

- [ ] **Step 3: Verify lint and unit tests**

Run: `npm run lint && npm test`
Expected: lint clean; all unit tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/CoreWorkCard.jsx src/components/DayCard.jsx
git commit -m "feat: render core work block on day cards"
```

---

### Task 4: CoreWorkScheduleEditor component

**Files:**
- Create: `src/components/CoreWorkScheduleEditor.jsx`

Modeled on `src/components/ConditioningScheduleEditor.jsx` (week chips → day rows → bottom-sheet modal). No unit tests (component); e2e covers it in Task 6.

- [ ] **Step 1: Create `src/components/CoreWorkScheduleEditor.jsx`**

```jsx
import { useState } from 'react'
import { DAY_NAMES } from '../utils/cycleUtils'
import {
  CORE_WORK_BLOCKS,
  buildDefaultAssignment,
  formatDuration,
  TIMED_SECONDS_MIN,
  TIMED_SECONDS_MAX,
  REST_MINUTES_MIN,
  REST_MINUTES_MAX,
} from '../data/coreWorkBlocks'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function CoreWorkScheduleEditor({ cycle, totalWaveWeeks, onChange }) {
  const schedule = cycle.coreWorkSchedule || []
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [assigningDay, setAssigningDay] = useState(null) // dayOfWeek or null
  const [draft, setDraft] = useState(null)

  const weekNums = Array.from({ length: totalWaveWeeks }, (_, i) => i + 1)
  const draftBlock = draft ? CORE_WORK_BLOCKS.find((b) => b.id === draft.blockId) : null

  function openEditor(dayOfWeek) {
    const existing = schedule.find(
      (e) => e.weekNumber === selectedWeek && e.dayOfWeek === dayOfWeek
    )
    setAssigningDay(dayOfWeek)
    setDraft(
      existing ? { ...existing, movements: existing.movements.map((m) => ({ ...m })) } : null
    )
  }

  function closeEditor() {
    setAssigningDay(null)
    setDraft(null)
  }

  function pickBlock(blockId) {
    setDraft({
      weekNumber: selectedWeek,
      dayOfWeek: assigningDay,
      ...buildDefaultAssignment(blockId),
    })
  }

  function pickChoice(choiceName) {
    const choiceNames = draftBlock.choiceMovements.map((m) => m.name)
    setDraft({
      ...draft,
      movements: draft.movements.map((m) =>
        choiceNames.includes(m.name) ? { ...m, name: choiceName } : m
      ),
    })
  }

  function updateMovement(index, rawValue) {
    setDraft({
      ...draft,
      movements: draft.movements.map((m, i) => {
        if (i !== index) return m
        return m.mode === 'timed' ? { ...m, seconds: rawValue } : { ...m, reps: rawValue }
      }),
    })
  }

  function save() {
    const [minRounds, maxRounds] = draftBlock.roundsRange
    const [minReps, maxReps] = draftBlock.repsRange
    const clean = {
      ...draft,
      rounds: clamp(draft.rounds, minRounds, maxRounds),
      restMinutes: clamp(draft.restMinutes, REST_MINUTES_MIN, REST_MINUTES_MAX),
      movements: draft.movements.map((m) =>
        m.mode === 'timed'
          ? {
              ...m,
              seconds: clamp(Number(m.seconds) || TIMED_SECONDS_MIN, TIMED_SECONDS_MIN, TIMED_SECONDS_MAX),
            }
          : { ...m, reps: clamp(Number(m.reps) || minReps, minReps, maxReps) }
      ),
    }
    const updated = schedule.filter(
      (e) => !(e.weekNumber === selectedWeek && e.dayOfWeek === assigningDay)
    )
    onChange([...updated, clean])
    closeEditor()
  }

  function removeAssignment(dayOfWeek) {
    onChange(
      schedule.filter((e) => !(e.weekNumber === selectedWeek && e.dayOfWeek === dayOfWeek))
    )
  }

  return (
    <div>
      {/* Week picker */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {weekNums.map((w) => (
          <button
            key={w}
            onClick={() => setSelectedWeek(w)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedWeek === w
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Wk {w}
          </button>
        ))}
      </div>

      {/* Day rows */}
      <div className="space-y-0">
        {DAY_NAMES.map((name, dow) => {
          const entry = schedule.find(
            (e) => e.weekNumber === selectedWeek && e.dayOfWeek === dow
          )
          const block = entry ? CORE_WORK_BLOCKS.find((b) => b.id === entry.blockId) : null

          return (
            <div
              key={dow}
              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-10 flex-shrink-0">
                {name}
              </span>

              {entry ? (
                <div className="flex-1 mx-3 min-w-0">
                  <span className="text-xs text-gray-600 dark:text-gray-300 truncate block">
                    {block?.name || entry.blockId} · {entry.rounds}×
                  </span>
                </div>
              ) : (
                <div className="flex-1 mx-3 text-xs text-gray-300 dark:text-gray-600">—</div>
              )}

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEditor(dow)}
                  className="text-xs text-blue-500 dark:text-blue-400 font-medium"
                >
                  {entry ? 'Change' : '+ Assign'}
                </button>
                {entry && (
                  <button
                    onClick={() => removeAssignment(dow)}
                    className="text-xs text-red-400 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Assignment modal */}
      {assigningDay !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {DAY_NAMES[assigningDay]}, Week {selectedWeek}
              </h3>
              <button onClick={closeEditor} className="text-gray-400 text-lg">✕</button>
            </div>

            {!draft ? (
              /* Step 1: pick a block */
              <div className="space-y-1">
                {CORE_WORK_BLOCKS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => pickBlock(b.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="text-sm text-gray-800 dark:text-white">{b.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {b.fixedMovements.map((m) => m.name).join(', ')}
                      {b.choiceMovements.length > 0 &&
                        ` + ${b.choiceMovements.map((m) => m.name).join(' or ')}`}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Step 2: configure the assignment */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {draftBlock.name}
                  </span>
                  <button
                    onClick={() => setDraft(null)}
                    className="text-xs text-blue-500 dark:text-blue-400 font-medium"
                  >
                    Change block
                  </button>
                </div>

                {/* Choice movement toggle (AB Triad) */}
                {draftBlock.choiceMovements.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Third movement
                    </label>
                    <div className="flex gap-1.5">
                      {draftBlock.choiceMovements.map((c) => {
                        const active = draft.movements.some((m) => m.name === c.name)
                        return (
                          <button
                            key={c.name}
                            onClick={() => pickChoice(c.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              active
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {c.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Rounds stepper */}
                <Stepper
                  label={`Rounds (${draftBlock.roundsRange[0]}-${draftBlock.roundsRange[1]})`}
                  value={draft.rounds}
                  min={draftBlock.roundsRange[0]}
                  max={draftBlock.roundsRange[1]}
                  onChange={(rounds) => setDraft({ ...draft, rounds })}
                />

                {/* Rest stepper */}
                <Stepper
                  label={`Rest between rounds (${REST_MINUTES_MIN}-${REST_MINUTES_MAX} min)`}
                  value={draft.restMinutes}
                  min={REST_MINUTES_MIN}
                  max={REST_MINUTES_MAX}
                  onChange={(restMinutes) => setDraft({ ...draft, restMinutes })}
                />

                {/* Per-movement prescriptions */}
                <div className="space-y-2">
                  {draft.movements.map((m, i) => (
                    <div key={m.name} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {m.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={m.mode === 'timed' ? m.seconds : m.reps}
                          min={m.mode === 'timed' ? TIMED_SECONDS_MIN : draftBlock.repsRange[0]}
                          max={m.mode === 'timed' ? TIMED_SECONDS_MAX : draftBlock.repsRange[1]}
                          onChange={(e) => updateMovement(i, e.target.value)}
                          className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-right"
                        />
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-10">
                          {m.mode === 'timed' ? 'sec' : 'reps'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {draft.movements.some((m) => m.mode === 'timed') && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Timed holds: {TIMED_SECONDS_MIN}s–{formatDuration(TIMED_SECONDS_MAX)}. Values outside the range are clamped on save.
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={save}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={closeEditor}
                    className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(value - 1, min))}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold"
        >
          −
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-white w-6 text-center">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(value + 1, max))}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold"
        >
          +
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint and unit tests**

Run: `npm run lint && npm test`
Expected: lint clean; all unit tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/CoreWorkScheduleEditor.jsx
git commit -m "feat: add core work schedule editor"
```

---

### Task 5: Wire editor into SettingsView

**Files:**
- Modify: `src/views/SettingsView.jsx` (import block ~line 10, sub-sections ~line 228-235)

- [ ] **Step 1: Add the import**

In `src/views/SettingsView.jsx`, after the `ConditioningScheduleEditor` import (line 10):

```jsx
import CoreWorkScheduleEditor from '../components/CoreWorkScheduleEditor'
```

- [ ] **Step 2: Add the sub-section**

Directly after the `{/* Conditioning Schedule */}` `SubSection` (which closes at line 235), add:

```jsx
                  {/* Core Work Schedule */}
                  <SubSection title="Core Work Schedule" expanded={expandedSubSection === 'coreWork'} onToggle={() => toggleSub('coreWork')}>
                    <CoreWorkScheduleEditor
                      cycle={cycle}
                      totalWaveWeeks={totalWaveWeeks}
                      onChange={(coreWorkSchedule) => updateCycle(cycle.id, { coreWorkSchedule })}
                    />
                  </SubSection>
```

- [ ] **Step 3: Verify lint and unit tests**

Run: `npm run lint && npm test`
Expected: lint clean; all unit tests PASS

- [ ] **Step 4: Manual smoke check (dev server)**

Run: `npm run dev` — open the app, Settings → expand a cycle → "Core Work Schedule" → assign AB Triad to a day, save, confirm the row shows "AB Triad · 3×". Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/views/SettingsView.jsx
git commit -m "feat: add core work schedule section to cycle settings"
```

---

### Task 6: e2e coverage

**Files:**
- Create: `e2e/core-work.spec.js`

Follows the pattern of `e2e/cycles.spec.js`, using helpers from `e2e/helpers.js`. Vitest ignores this file (`e2e/**` is excluded in `vite.config.js`).

- [ ] **Step 1: Write the e2e test**

Create `e2e/core-work.spec.js`:

```js
import { test, expect } from '@playwright/test'
import { resetAppState, createCycle, goToTab } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await resetAppState(page)
})

test('assigns AB Triad in Settings and shows it on This Week', async ({ page }) => {
  const today = new Date().toISOString().split('T')[0]
  await createCycle(page, { name: 'Core Cycle', startDate: today })

  // Expand the cycle and open Core Work Schedule
  await page.getByText('Core Cycle').click()
  await page.getByRole('button', { name: 'Core Work Schedule' }).click()

  // Assign to the first day row (Sun) on week 1
  await page.getByRole('button', { name: '+ Assign' }).first().click()
  await page.getByRole('button', { name: /AB Triad Plank, Shank/ }).click()
  await page.getByRole('button', { name: 'Save' }).click()

  // Row now shows the assignment
  await expect(page.getByText('AB Triad · 3×')).toBeVisible()

  // Shows up on This Week
  await goToTab(page, 'This Week')
  await expect(page.getByText('AB Triad')).toBeVisible()
  await expect(page.getByText('Plank')).toBeVisible()
  await expect(page.getByText('Wheel Rollout')).toBeVisible()
  await expect(page.getByText('3 rounds · 2 min rest')).toBeVisible()
})

test('assigns AB Triad 2 with toe-to-bar movements', async ({ page }) => {
  const today = new Date().toISOString().split('T')[0]
  await createCycle(page, { name: 'Core Cycle 2', startDate: today })

  await page.getByText('Core Cycle 2').click()
  await page.getByRole('button', { name: 'Core Work Schedule' }).click()
  await page.getByRole('button', { name: '+ Assign' }).first().click()
  await page.getByRole('button', { name: /AB Triad 2/ }).click()
  await page.getByRole('button', { name: 'Save' }).click()

  await goToTab(page, 'This Week')
  await expect(page.getByText('AB Triad 2')).toBeVisible()
  await expect(page.getByText('Hanging Leg Raises')).toBeVisible()
})

test('removes an assignment', async ({ page }) => {
  const today = new Date().toISOString().split('T')[0]
  await createCycle(page, { name: 'Core Cycle 3', startDate: today })

  await page.getByText('Core Cycle 3').click()
  await page.getByRole('button', { name: 'Core Work Schedule' }).click()
  await page.getByRole('button', { name: '+ Assign' }).first().click()
  await page.getByRole('button', { name: /Bird Dogs & Side Planks/ }).click()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Bird Dogs & Side Planks · 3×')).toBeVisible()

  await page.getByRole('button', { name: 'Remove' }).click()
  await expect(page.getByText('Bird Dogs & Side Planks · 3×')).not.toBeVisible()
})
```

Locator notes for the implementer:
- The block-picker buttons contain the block name plus the movement list, so `{ name: /AB Triad Plank, Shank/ }` disambiguates "AB Triad" from "AB Triad 2". Adjust regexes if strict-mode violations occur — verify against the rendered DOM with `npx playwright test --debug` rather than weakening assertions.
- The day assigned is the first row (Sunday). The cycle starts today, so week 1 is the current wave week and the entry renders on This Week regardless of which day of the week the test runs.

- [ ] **Step 2: Run the e2e suite**

Run: `npm run test:e2e`
Expected: all tests PASS (14 existing + 3 new)

- [ ] **Step 3: Commit**

```bash
git add e2e/core-work.spec.js
git commit -m "test: e2e coverage for core work scheduling"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full check**

Run: `npm run lint && npm test && npm run build && npm run test:e2e`
Expected: all clean/green.

- [ ] **Step 2: Spec conformance skim**

Re-read `docs/superpowers/specs/2026-07-04-core-work-design.md` and confirm:
- Three blocks with exact movement names and modes
- AB Triad choice at assignment time; AB Triad 2 ranges 3-5 rounds / 5-10 reps; others 1-3 / 1-10
- Timed 10-300s, rest 1-5 min, defaults (3 rounds / 60s / 5 reps / 2 min)
- Works on any template incl. strengthOff weeks; old cycles unaffected

- [ ] **Step 3: Report**

No commit here unless fixes were needed. Report results to the user.
