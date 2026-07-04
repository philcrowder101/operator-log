# Weighted Pull-ups: Bodyweight-Aware Prescriptions — Design

**Date:** 2026-07-04
**Status:** Approved

## Problem

For weighted pull-ups, the 1RM is total system weight (body weight + added weight).
Example: body weight 180 lbs, max weighted rep 240 lbs (180 BW + 60 added).
At lower wave percentages, the computed target falls below body weight
(70% of TM 216 = ~151 lbs), which is impossible to load. In those cases the
prescription must switch to sets at a percentage of max unweighted reps.

## Decisions (from brainstorming)

- **1RM semantics:** stored 1RM for bodyweight lifts = total system weight.
- **Body weight storage:** single global value in `appState` (key `bodyWeightLbs`), edited in Settings.
- **Rep formula:** `reps = max(1, round(maxReps × 0.9 × loadPercent/100))` — mirrors the 90% training-max discount used for barbell weights.
- **Weighted display:** big number is added weight (e.g. "+25 lbs"), total in fine print.
- **Lift flag:** explicit `isBodyweight` toggle on the lift; enabling it reveals a `maxReps` field.

## Data Model

- `appState`: new key `bodyWeightLbs` (number). No Dexie schema version bump (key-value store).
- `lifts`: new optional fields `isBodyweight` (boolean) and `maxReps` (number, max strict unweighted reps). Non-indexed, so no migration needed.
- `LiftClusterEditor` preset "Weighted Pullups" creates the lift with `isBodyweight: true`.

## Calculation Logic (pure layer)

`src/utils/loadCalculator.js`:
- `calcBodyweightReps(maxReps, loadPercent)` → `Math.max(1, Math.round(maxReps * 0.9 * loadPercent / 100))`
- Added weight (plate-friendly): `added = Math.round((trainingMax * pct/100 - bodyWeight) / 5) * 5`; displayed total = `bodyWeight + added`.

`src/utils/weekPlanBuilder.js`:
- `buildWeekPlan(cycle, lifts, conditioningRoutines, weekOffset, bodyWeight)` — new trailing param.
- A shared exercise-builder helper (used by both regular and hinge paths) assigns each exercise a `mode`:
  - **`weighted-bw`** — `isBodyweight` lift with `added > 0`: exercise carries `addedLbs` and `totalLbs`.
  - **`reps`** — `isBodyweight` lift with `added ≤ 0`: exercise carries `reps` from `calcBodyweightReps` (sets from the wave week), no weight.
  - **normal** — all other lifts, unchanged shape (`weightLbs`).

### Fallbacks
- `bodyWeightLbs` not set → bodyweight lifts render as normal weighted lifts (total shown).
- Reps mode would trigger but lift has no `maxReps` → render as normal weighted lift. Nothing breaks; entering the missing value fixes the display.

## Data Flow

`useWeekPlan` reads `bodyWeightLbs` from `appState` via `useLiveQuery` and passes it to `buildWeekPlan()`. All mode logic stays in the pure layer.

## UI

- **Settings tab:** small card with a body-weight input, persisted to `appState.bodyWeightLbs`.
- **LiftCard:** edit mode gains a "bodyweight lift" toggle; enabling it reveals a max-reps input. Bodyweight lifts show a small "BW" badge.
- **StrengthSessionCard:**
  - `weighted-bw`: big "+25 lbs", fine print "205 total"; sets/reps/% line unchanged.
  - `reps`: big "9 reps", subtitle "bodyweight"; the sets line reads e.g. `5×9 @ 70%`. Rest timer button unchanged.

## Testing

Unit tests (Vitest, pure layer only, per project convention):
- `loadCalculator.test.js`: reps formula (rounding, min 1), added-weight plate rounding.
- `weekPlanBuilder.test.js`: mode switch at/near body weight, `weighted-bw` fields, reps-mode fields, missing-bodyweight and missing-maxReps fallbacks, hinge-path parity.

## Worked Example

1RM 240, BW 180 → TM 216 (90%, rounded to 5).
- Week @ 70%: 216 × 0.70 = 151 → below BW → reps mode; maxReps 15 → round(15 × 0.9 × 0.7) = 9 reps/set.
- Week @ 95%: 216 × 0.95 = 205 → added = round((205−180)/5)×5 = 25 → "+25 lbs" (205 total).

## Out of Scope

- Body-weight history/trend tracking.
- Max-reps history (liftHistory continues to track 1RM only).
- Auto-estimating maxReps from 1RM/BW ratio.
