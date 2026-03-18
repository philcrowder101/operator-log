# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
npm test           # Run all tests (Vitest)
npm run test:watch # Run tests in watch mode
```

## Architecture

**Operator Log** is a mobile-first PWA for planning and logging workouts based on the Tactical Barbell methodology. It runs entirely in-browser with IndexedDB persistence — no backend.

### Key Technologies
- **React 19** with Vite 7 and Tailwind CSS 4
- **Dexie 4** (IndexedDB) + `dexie-react-hooks` for reactive queries via `useLiveQuery`
- **Recharts** for data visualization
- **vite-plugin-pwa** with Workbox for offline support

### Data Model (`src/db/db.js`)
Six Dexie stores:
- `lifts` — user's lift library (name, oneRM, type)
- `liftHistory` — historical 1RM entries per lift
- `templates` — TB program templates (seeded from `src/data/tbTemplates.js`)
- `cycles` — active/past training cycles (each holds waveWeeks config, selected lifts, start date)
- `appState` — simple key-value store; `activeCycleId` is the primary key used app-wide
- `conditioningRoutines` — conditioning library entries

### Navigation (`src/App.jsx`)
No React Router. Three-tab layout managed with local state (`activeTab`): **This Week**, **Actions** (lifts), **Settings** (cycle management). A fourth view, `LiftDetailView`, renders as an overlay controlled by `selectedLift` state.

### Core Data Flow
1. `appState.activeCycleId` → `useActiveCycle()` hook → current cycle object
2. `useWeekPlan(cycle, weekOffset)` — fetches lifts and conditioning routines from Dexie, then delegates all scheduling to `buildWeekPlan()`
3. `buildWeekPlan(cycle, lifts, routines, weekOffset)` in `src/utils/weekPlanBuilder.js` — pure function; produces the 7-day plan array. This is where hinge lift logic, session mapping, and conditioning assignment live.
4. `loadCalculator.js` — computes working weights from 1RM percentages and training max
5. `cycleUtils.js` — date/week utilities: `getWaveWeekIndex`, `getWeekDays`, `cycleHasStarted`, `weeksUntilCycle`

### Training Structure
- **Templates** (`src/data/tbTemplates.js`): pre-built Tactical Barbell programs (Operator, Zulu, Fighter, Base Build, etc.) define session counts and default wave structure
- **Cycles**: user picks a template, assigns lifts, configures `waveWeeks[]` (sets/reps/load%/rest per week), and sets a start date
- **Hinge lift**: one lift is designated as the hinge movement and follows separate scheduling logic
- **Conditioning**: scheduled per-week via `ConditioningScheduleEditor`; routines come from the conditioning library

### Testing
- **Vitest** is configured via the `test` block in `vite.config.js` (`environment: 'node'`, `globals: true`)
- Tests live alongside source files as `*.test.js`
- Pure utility functions are the primary test target — DB-coupled hooks are not tested
- Date-sensitive tests use `vi.useFakeTimers()` + `vi.setSystemTime()`. Always pin to a date well clear of US DST boundaries (e.g., mid-April). Use `new Date(year, month-1, day)` for the fake date and local noon datetime strings (no trailing `Z`) for cycle `startDate` values to avoid UTC-vs-local day-shift issues.

### Styling Notes
- Tailwind dark mode via `prefers-color-scheme` media query
- iOS safe area handled via custom `.pb-safe` / `.pb-safe-or-3` utility classes in `index.css`
- Bottom tab bar uses `viewport-fit=cover` and env-based padding for notch/home indicator
