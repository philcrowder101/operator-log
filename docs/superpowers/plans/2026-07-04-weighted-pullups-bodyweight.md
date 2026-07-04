# Weighted Pull-ups: Bodyweight-Aware Prescriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** For bodyweight lifts (weighted pull-ups), show added belt weight when the target exceeds body weight, and switch to a percentage-of-max-reps prescription when it doesn't.

**Architecture:** Body weight lives in `appState` (key `bodyWeightLbs`). Lifts gain optional `isBodyweight` + `maxReps` fields. All mode logic is pure: `loadCalculator.js` gets two new functions, `weekPlanBuilder.js` gains a `bodyWeight` param and a shared exercise-builder that tags each exercise with a `mode` (`weighted-bw`, `reps`, or absent = normal). UI components only render what they receive.

**Tech Stack:** React 19, Dexie 4 (`useLiveQuery`), Vitest, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-07-04-weighted-pullups-bodyweight-design.md`

> **⚠️ Commit policy for this repo:** Do NOT run `git commit` during execution. The user tests locally first, then commits are batched after his approval. Run tests freely; skip every commit step you'd normally add.

---

### Task 1: Pure calculators — `calcBodyweightReps` and `calcAddedWeight`

**Files:**
- Modify: `src/utils/loadCalculator.js`
- Test: `src/utils/loadCalculator.test.js`

- [ ] **Step 1: Write the failing tests**

Append to `src/utils/loadCalculator.test.js` (update the import line at the top):

```js
import { calcTrainingMax, calcWeight, calcBodyweightReps, calcAddedWeight } from './loadCalculator'
```

```js
describe('calcBodyweightReps', () => {
  it('returns loadPercent of 90% of maxReps, rounded', () => {
    expect(calcBodyweightReps(15, 70)).toBe(9)   // 15*0.9*0.70 = 9.45 → 9
    expect(calcBodyweightReps(15, 75)).toBe(10)  // 10.125 → 10
    expect(calcBodyweightReps(20, 80)).toBe(14)  // 14.4 → 14
  })

  it('rounds half up', () => {
    expect(calcBodyweightReps(15, 100)).toBe(14) // 13.5 → 14
  })

  it('clamps to a minimum of 1 rep', () => {
    expect(calcBodyweightReps(1, 50)).toBe(1)    // 0.45 → 0 → clamped to 1
  })
})

describe('calcAddedWeight', () => {
  it('returns plate-friendly added weight above bodyweight', () => {
    // TM 216 @ 95% = 205.2 → 205.2-180 = 25.2 → round(5.04)*5 = 25
    expect(calcAddedWeight(216, 95, 180)).toBe(25)
    // TM 216 @ 85% = 183.6 → 3.6 → round(0.72)*5 = 5
    expect(calcAddedWeight(216, 85, 180)).toBe(5)
  })

  it('returns negative values when target is below bodyweight', () => {
    // TM 216 @ 70% = 151.2 → -28.8 → round(-5.76)*5 = -30
    expect(calcAddedWeight(216, 70, 180)).toBe(-30)
  })

  it('returns 0 when target equals bodyweight', () => {
    expect(calcAddedWeight(200, 90, 180)).toBe(0) // 180 - 180 = 0
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/loadCalculator.test.js`
Expected: FAIL — `calcBodyweightReps is not a function` (or not exported)

- [ ] **Step 3: Implement the functions**

Append to `src/utils/loadCalculator.js`:

```js
/** Bodyweight fallback reps: loadPercent of 90% of max unweighted reps, min 1 */
export function calcBodyweightReps(maxReps, loadPercent) {
  return Math.max(1, Math.round(maxReps * 0.9 * (loadPercent / 100)))
}

/** Plate-friendly weight to add over bodyweight; <= 0 means target is at/below bodyweight */
export function calcAddedWeight(trainingMax, loadPercent, bodyWeight) {
  const raw = trainingMax * (loadPercent / 100) - bodyWeight
  return Math.round(raw / 5) * 5
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/loadCalculator.test.js`
Expected: PASS (all describes, including the pre-existing ones)

---

### Task 2: `buildWeekPlan` mode logic

**Files:**
- Modify: `src/utils/weekPlanBuilder.js`
- Test: `src/utils/weekPlanBuilder.test.js`

Context: `buildWeekPlan(cycle, lifts, conditioningRoutines, weekOffset)` currently builds exercise objects inline in two places — the regular-lift `.map()` and the hinge `addHinge()` closure (lines ~77–101). Both must go through one shared builder so hinge lifts get the same bodyweight treatment. The Operator template's wave week 1 is `5×5 @ 75%`, which the tests below rely on.

- [ ] **Step 1: Write the failing tests**

Append to `src/utils/weekPlanBuilder.test.js`. The file already defines `baseCycle()`, fixtures (`squat`, `press`), and fake timers pinned to 2026-04-13; reuse them.

```js
// ─── bodyweight lifts ────────────────────────────────────────────────────────

describe('buildWeekPlan — bodyweight lifts', () => {
  // Operator wave week 1: 5 sets × 5 reps @ 75%
  const pullups = { id: 3, name: 'Weighted Pullups', trainingMax: 216, isBodyweight: true, maxReps: 15 }
  const BW = 180

  it('switches to reps mode when target is at or below bodyweight', () => {
    // 216 * 0.75 = 162 < 180 → reps mode; round(15 * 0.9 * 0.75) = 10
    const cycle = baseCycle({ liftIds: [3] })
    const plan = buildWeekPlan(cycle, [pullups], [], 0, BW)
    const ex = plan.find((d) => d.dayOfWeek === 1).exercises[0]
    expect(ex.mode).toBe('reps')
    expect(ex.reps).toBe(10)
    expect(ex.sets).toBe(5)
    expect(ex.weightLbs).toBeUndefined()
    expect(ex.addedLbs).toBeUndefined()
  })

  it('uses weighted-bw mode with added/total weight when target exceeds bodyweight', () => {
    // TM 300 @ 75% = 225 → added = round((225-180)/5)*5 = 45, total = 225
    const strongPullups = { ...pullups, trainingMax: 300 }
    const cycle = baseCycle({ liftIds: [3] })
    const plan = buildWeekPlan(cycle, [strongPullups], [], 0, BW)
    const ex = plan.find((d) => d.dayOfWeek === 1).exercises[0]
    expect(ex.mode).toBe('weighted-bw')
    expect(ex.addedLbs).toBe(45)
    expect(ex.totalLbs).toBe(225)
    expect(ex.weightLbs).toBeUndefined()
  })

  it('falls back to normal weighted display when bodyWeight is not set', () => {
    const cycle = baseCycle({ liftIds: [3] })
    const plan = buildWeekPlan(cycle, [pullups], [], 0) // no bodyWeight arg
    const ex = plan.find((d) => d.dayOfWeek === 1).exercises[0]
    expect(ex.mode).toBeUndefined()
    expect(ex.weightLbs).toBe(160) // calcWeight(216, 75)
  })

  it('falls back to normal weighted display when maxReps is missing', () => {
    const noReps = { id: 3, name: 'Weighted Pullups', trainingMax: 216, isBodyweight: true }
    const cycle = baseCycle({ liftIds: [3] })
    const plan = buildWeekPlan(cycle, [noReps], [], 0, BW)
    const ex = plan.find((d) => d.dayOfWeek === 1).exercises[0]
    expect(ex.mode).toBeUndefined()
    expect(ex.weightLbs).toBe(160)
  })

  it('leaves non-bodyweight lifts untouched when bodyWeight is provided', () => {
    const cycle = baseCycle() // liftIds [1, 2] → squat, press
    const plan = buildWeekPlan(cycle, [squat, press], [], 0, BW)
    const monday = plan.find((d) => d.dayOfWeek === 1)
    expect(monday.exercises[0].mode).toBeUndefined()
    expect(monday.exercises[0].weightLbs).toBe(135) // calcWeight(180, 75)
  })

  it('applies bodyweight logic to the hinge lift too', () => {
    // Hinge in each-day mode: 1 set, same wave percentages
    const cycle = baseCycle({
      liftIds: [1, 3],
      hingeConfig: { liftId: 3, mode: 'each-day', replacedLiftId: null },
    })
    const plan = buildWeekPlan(cycle, [squat, pullups], [], 0, BW)
    const monday = plan.find((d) => d.dayOfWeek === 1)
    const hinge = monday.exercises.find((e) => e.isHinge)
    expect(hinge.mode).toBe('reps')
    expect(hinge.reps).toBe(10)
    expect(hinge.sets).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/weekPlanBuilder.test.js`
Expected: FAIL — the new describe fails (`ex.mode` undefined where 'reps' expected, etc.). Pre-existing tests still pass.

- [ ] **Step 3: Implement**

In `src/utils/weekPlanBuilder.js`:

Update the import:

```js
import { calcWeight, calcAddedWeight, calcBodyweightReps } from './loadCalculator'
```

Add the shared builder above `buildWeekPlan`:

```js
function buildExercise(lift, waveWeek, bodyWeight) {
  const base = {
    id: lift.id,
    name: lift.name,
    sets: waveWeek.sets,
    reps: waveWeek.reps,
    loadPercent: waveWeek.loadPercent,
    restMinutes: waveWeek.restMinutes,
  }
  if (lift.isBodyweight && bodyWeight > 0) {
    const added = calcAddedWeight(lift.trainingMax, waveWeek.loadPercent, bodyWeight)
    if (added > 0) {
      return { ...base, mode: 'weighted-bw', addedLbs: added, totalLbs: bodyWeight + added }
    }
    if (lift.maxReps > 0) {
      return { ...base, mode: 'reps', reps: calcBodyweightReps(lift.maxReps, waveWeek.loadPercent) }
    }
  }
  return { ...base, weightLbs: calcWeight(lift.trainingMax, waveWeek.loadPercent) }
}
```

Change the signature:

```js
export function buildWeekPlan(cycle, lifts, conditioningRoutines, weekOffset = 0, bodyWeight = null) {
```

Replace the regular-lift mapping (currently the `.map()` producing `{ id, name, sets, reps, loadPercent, weightLbs, restMinutes }`):

```js
      exercises = sessionLifts
        .filter((lift) => lift.id !== excludeOnThisDay)
        .map((lift) => buildExercise(lift, waveWeek, bodyWeight))
```

Replace the `addHinge` closure body:

```js
        const addHinge = (sets) =>
          exercises.push({
            ...buildExercise(hingeLift, waveWeek, bodyWeight),
            sets,
            isHinge: true,
          })
```

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: PASS — all files, including pre-existing weekPlanBuilder tests (normal lifts keep the exact same object shape).

---

### Task 3: Thread body weight through `useWeekPlan`

**Files:**
- Modify: `src/hooks/useWeekPlan.js`

No unit test — DB-coupled hooks are not tested in this repo (project convention).

- [ ] **Step 1: Fetch and pass `bodyWeightLbs`**

In `src/hooks/useWeekPlan.js`, inside the `useLiveQuery` callback, replace the last two statements of the cycle branch:

```js
    const allRoutines = await db.conditioningRoutines.toArray()
    const bwEntry = await db.appState.get('bodyWeightLbs')

    return buildWeekPlan(cycle, liftsWithTM, allRoutines, weekOffset, bwEntry?.value ?? null)
```

(`useLiveQuery` re-runs automatically when `appState` or `lifts` change — no dependency-array change needed.)

- [ ] **Step 2: Verify nothing broke**

Run: `npx vitest run && npm run lint`
Expected: tests PASS, lint clean.

---

### Task 4: Render modes in `StrengthSessionCard`

**Files:**
- Modify: `src/components/StrengthSessionCard.jsx`

The left column (`{ex.sets}×{ex.reps} @ {ex.loadPercent}%`) already reads correctly in every mode — reps mode carries its computed reps in `ex.reps`. Only the right-side weight display changes.

- [ ] **Step 1: Replace the weight span**

In `src/components/StrengthSessionCard.jsx`, replace:

```jsx
            <span className="text-lg font-bold text-gray-800 dark:text-white">
              {ex.weightLbs} lbs
            </span>
```

with:

```jsx
            {ex.mode === 'reps' ? (
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800 dark:text-white">
                  {ex.reps} reps
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">bodyweight</div>
              </div>
            ) : ex.mode === 'weighted-bw' ? (
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800 dark:text-white">
                  +{ex.addedLbs} lbs
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {ex.totalLbs} total
                </div>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-800 dark:text-white">
                {ex.weightLbs} lbs
              </span>
            )}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: clean. (Visual check happens in Task 8.)

---

### Task 5: Body weight card in Settings

**Files:**
- Create: `src/components/BodyWeightCard.jsx`
- Modify: `src/views/SettingsView.jsx`

- [ ] **Step 1: Create the component**

Create `src/components/BodyWeightCard.jsx`:

```jsx
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export default function BodyWeightCard() {
  const stored = useLiveQuery(async () => (await db.appState.get('bodyWeightLbs'))?.value ?? null)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  async function save() {
    const v = parseInt(value, 10)
    if (!v || v <= 0) return
    await db.appState.put({ key: 'bodyWeightLbs', value: v })
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm text-gray-800 dark:text-white">Body Weight</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Used for bodyweight lifts like weighted pullups
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => { setValue(stored ? String(stored) : ''); setEditing(true) }}
            className="text-lg font-bold text-gray-800 dark:text-white"
          >
            {stored ? `${stored} lbs` : 'Set'}
          </button>
        )}
      </div>
      {editing && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            placeholder="Body weight (lbs)"
            autoFocus
          />
          <button onClick={save} className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium">
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Mount it in SettingsView**

In `src/views/SettingsView.jsx`, add the import:

```jsx
import BodyWeightCard from '../components/BodyWeightCard'
```

Then render it as the first child inside the scroll container, directly above the `{allCycles.length === 0 && !creating && (` block:

```jsx
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-24">

        <BodyWeightCard />

        {allCycles.length === 0 && !creating && (
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: clean.

---

### Task 6: Bodyweight toggle + max reps on `LiftCard`

**Files:**
- Modify: `src/components/LiftCard.jsx`

- [ ] **Step 1: Add state, save logic, badge, and edit fields**

Replace the full contents of `src/components/LiftCard.jsx` with:

```jsx
import { useState } from 'react'
import { db } from '../db/db'
import { updateLiftOneRM } from '../hooks/useLifts'
import { calcTrainingMax } from '../utils/loadCalculator'

export default function LiftCard({ lift, onViewHistory }) {
  const [editing, setEditing] = useState(false)
  const [newRM, setNewRM] = useState(String(lift.oneRepMax))
  const [isBw, setIsBw] = useState(!!lift.isBodyweight)
  const [newMaxReps, setNewMaxReps] = useState(lift.maxReps ? String(lift.maxReps) : '')

  async function handleSave() {
    const val = parseInt(newRM, 10)
    if (!val || val <= 0) return
    if (val !== lift.oneRepMax) await updateLiftOneRM(lift.id, val)
    const reps = parseInt(newMaxReps, 10)
    await db.lifts.update(lift.id, {
      isBodyweight: isBw,
      maxReps: isBw && reps > 0 ? reps : null,
    })
    setEditing(false)
  }

  function handleCancel() {
    setEditing(false)
    setNewRM(String(lift.oneRepMax))
    setIsBw(!!lift.isBodyweight)
    setNewMaxReps(lift.maxReps ? String(lift.maxReps) : '')
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-800 dark:text-white">{lift.name}</span>
            {lift.isBodyweight && (
              <span className="text-xs font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded">
                BW
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            TM: <span className="font-medium text-gray-700 dark:text-gray-200">
              {calcTrainingMax(lift.oneRepMax)} lbs
            </span>
            {lift.isBodyweight && lift.maxReps > 0 && (
              <> · Max reps: <span className="font-medium text-gray-700 dark:text-gray-200">{lift.maxReps}</span></>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            {lift.oneRepMax} lbs
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">1RM</div>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <input
            type="number"
            value={newRM}
            onChange={(e) => setNewRM(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            placeholder="New 1RM (lbs)"
            autoFocus
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={isBw}
              onChange={(e) => setIsBw(e.target.checked)}
              className="w-4 h-4"
            />
            Bodyweight lift (1RM includes body weight)
          </label>
          {isBw && (
            <input
              type="number"
              value={newMaxReps}
              onChange={(e) => setNewMaxReps(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              placeholder="Max unweighted reps"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            Edit
          </button>
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            >
              History
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

Notes on intentional behavior:
- `updateLiftOneRM` is only called when the 1RM actually changed, so toggling the BW flag doesn't pollute `liftHistory`.
- The button label changes from "Update 1RM" to "Edit" since it now edits more than the 1RM.

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: clean.

---

### Task 7: "Weighted Pullups" preset creates a bodyweight lift

**Files:**
- Modify: `src/components/LiftClusterEditor.jsx`

- [ ] **Step 1: Flag the preset**

In `src/components/LiftClusterEditor.jsx`, below the `PRESET_LIFTS` array, add:

```js
const BODYWEIGHT_PRESETS = ['Weighted Pullups']
```

In `selectPreset`, replace the creation line:

```js
      const id = await db.lifts.add({ name, oneRepMax: 135, notes: '' })
```

with:

```js
      const id = await db.lifts.add({
        name,
        oneRepMax: 135,
        notes: '',
        isBodyweight: BODYWEIGHT_PRESETS.includes(name),
      })
```

- [ ] **Step 2: Verify**

Run: `npm run lint && npx vitest run`
Expected: clean, all tests pass.

---

### Task 8: Full verification (no commits)

**Files:** none

- [ ] **Step 1: Full suite + lint + build**

Run: `npx vitest run && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 2: Manual verification checklist (user runs `npm run dev`)**

1. Settings tab → Body Weight card → set 180.
2. Actions tab → Weighted Pullups → Edit → confirm BW toggle is on (or enable it), set 1RM 240, max reps (e.g. 15) → Save. Card shows "BW" badge and "Max reps: 15".
3. This Week tab, wave week 1 (75%): Weighted Pullups shows **10 reps / bodyweight** (5×10 @ 75%).
4. Jump ahead (Settings → Wave Week +) to a week where TM×% exceeds 180 — with 1RM 240 all Operator weeks are below BW, so temporarily set 1RM to 300 (TM 270): week 1 → 270×0.75 = 202.5 → added = round(22.5/5)×5 = 25 → **+25 lbs / 205 total**. Restore 1RM afterwards.
5. Confirm normal barbell lifts (Squat/Bench) look unchanged.
6. Clear body weight scenario: with `bodyWeightLbs` unset (fresh browser profile / IndexedDB cleared), pullups show a plain total weight — no crash.

**After the user confirms: batch commits into logical units per his workflow.**
