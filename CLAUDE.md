# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

No test runner is configured.

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
2. `useWeekPlan(cycle, weekOffset)` — the main planning hook; combines cycle config + waveWeeks to produce a day-by-day training plan for the given week offset from cycle start
3. `loadCalculator.js` — computes working weights from 1RM percentages and training max
4. `cycleUtils.js` — week/wave index calculations relative to cycle start date

### Training Structure
- **Templates** (`src/data/tbTemplates.js`): pre-built Tactical Barbell programs (Operator, Zulu, Fighter, Base Build, etc.) define session counts and default wave structure
- **Cycles**: user picks a template, assigns lifts, configures `waveWeeks[]` (sets/reps/load%/rest per week), and sets a start date
- **Hinge lift**: one lift is designated as the hinge movement and follows separate scheduling logic
- **Conditioning**: scheduled per-week via `ConditioningScheduleEditor`; routines come from the conditioning library

### Styling Notes
- Tailwind dark mode via `prefers-color-scheme` media query
- iOS safe area handled via custom `.pb-safe` / `.pb-safe-or-3` utility classes in `index.css`
- Bottom tab bar uses `viewport-fit=cover` and env-based padding for notch/home indicator
