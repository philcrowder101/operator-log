import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { buildWeekPlan } from './weekPlanBuilder'

// Pin to April 13, 2026 (Monday), well clear of DST boundaries.
const FAKE_TODAY = new Date(2026, 3, 13)

function weeksAgo(n) {
  const d = new Date(FAKE_TODAY)
  d.setDate(d.getDate() - n * 7)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Shared fixtures ────────────────────────────────────────────────────────

// Lifts already have trainingMax computed (as the hook does before calling buildWeekPlan).
const squat = { id: 1, name: 'Squat', trainingMax: 180 }   // calcWeight(180, 80) = 145
const press  = { id: 2, name: 'Press', trainingMax: 90 }    // calcWeight(90,  80) = 70
const deadlift = { id: 9, name: 'Deadlift', trainingMax: 225 } // calcWeight(225, 80) = 180

function baseCycle(overrides = {}) {
  return {
    templateId: 'operator',      // 3 waveWeeks, Mon/Wed/Fri, labels A/B/C
    startDate: weeksAgo(0),      // started this week → wave week index 0
    currentWeekOffset: 0,
    liftIds: [1, 2],
    liftSessionMap: {},
    conditioningSchedule: [],
    hingeConfig: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FAKE_TODAY)
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── null cycle (rest week) ──────────────────────────────────────────────────

describe('buildWeekPlan — null cycle', () => {
  it('returns 7 days', () => {
    const plan = buildWeekPlan(null, [], [], 0)
    expect(plan).toHaveLength(7)
  })

  it('starts on Monday', () => {
    const plan = buildWeekPlan(null, [], [], 0)
    expect(plan[0].date.getDay()).toBe(1)
  })

  it('all days have sessionLabel null, empty exercises, and null conditioning', () => {
    const plan = buildWeekPlan(null, [], [], 0)
    expect(plan.every((d) => d.sessionLabel === null)).toBe(true)
    expect(plan.every((d) => d.exercises.length === 0)).toBe(true)
    expect(plan.every((d) => d.conditioning === null)).toBe(true)
    expect(plan.every((d) => d.waveWeek === null)).toBe(true)
  })

  it('respects weekOffset', () => {
    const thisWeek = buildWeekPlan(null, [], [], 0)
    const nextWeek = buildWeekPlan(null, [], [], 1)
    const diffDays = (nextWeek[0].date - thisWeek[0].date) / (1000 * 60 * 60 * 24)
    expect(diffDays).toBe(7)
  })
})

// ─── unknown template ────────────────────────────────────────────────────────

describe('buildWeekPlan — unknown template', () => {
  it('returns null', () => {
    const cycle = baseCycle({ templateId: 'nonexistent' })
    expect(buildWeekPlan(cycle, [], [], 0)).toBeNull()
  })
})

// ─── basic Operator scheduling ───────────────────────────────────────────────

describe('buildWeekPlan — Operator template basics', () => {
  it('returns 7 days', () => {
    const plan = buildWeekPlan(baseCycle(), [squat, press], [], 0)
    expect(plan).toHaveLength(7)
  })

  it('assigns session labels only to Mon/Wed/Fri', () => {
    const plan = buildWeekPlan(baseCycle(), [squat, press], [], 0)
    const trainingDays = plan.filter((d) => d.sessionLabel !== null)
    expect(trainingDays).toHaveLength(3)
    expect(trainingDays.map((d) => d.dayOfWeek)).toEqual([1, 3, 5]) // Mon, Wed, Fri
  })

  it('assigns session labels A/B/C in order', () => {
    const plan = buildWeekPlan(baseCycle(), [squat, press], [], 0)
    const labels = plan.filter((d) => d.sessionLabel).map((d) => d.sessionLabel)
    expect(labels).toEqual(['A', 'B', 'C'])
  })

  it('rest days have empty exercises', () => {
    const plan = buildWeekPlan(baseCycle(), [squat, press], [], 0)
    plan.filter((d) => d.sessionLabel === null).forEach((d) => {
      expect(d.exercises).toHaveLength(0)
    })
  })
})

// ─── exercise calculation ────────────────────────────────────────────────────

describe('buildWeekPlan — exercise weights', () => {
  it('calculates correct sets/reps/weight for Operator wave week 1', () => {
    // wave week 1: sets:5, reps:5, loadPercent:80, restMinutes:3
    // squat TM 180: calcWeight(180, 80) = round(144/5)*5 = 145
    // press TM 90:  calcWeight(90,  80) = round(72/5)*5  = 70
    const plan = buildWeekPlan(baseCycle(), [squat, press], [], 0)
    const monday = plan.find((d) => d.dayOfWeek === 1)
    expect(monday.exercises).toHaveLength(2)
    expect(monday.exercises[0]).toMatchObject({ name: 'Squat', sets: 5, reps: 5, weightLbs: 145 })
    expect(monday.exercises[1]).toMatchObject({ name: 'Press', sets: 5, reps: 5, weightLbs: 70 })
  })

  it('uses the correct wave week when weekOffset advances', () => {
    // weekOffset:1 → wave week index 1 → sets:5, reps:4, loadPercent:85
    // squat TM 180: calcWeight(180, 85) = round(153/5)*5 = 155
    const plan = buildWeekPlan(baseCycle(), [squat], [], 1)
    const monday = plan.find((d) => d.dayOfWeek === 1)
    expect(monday.exercises[0]).toMatchObject({ reps: 4, loadPercent: 85, weightLbs: 155 })
  })
})

// ─── strengthOff weeks ───────────────────────────────────────────────────────

describe('buildWeekPlan — strengthOff weeks', () => {
  it('training days have no exercises during a strengthOff week', () => {
    // bb-fighter-finish: weeks 1-5 are strengthOff. Cycle started this week → index 0 → strengthOff.
    const cycle = baseCycle({ templateId: 'bb-fighter-finish', liftIds: [1] })
    const plan = buildWeekPlan(cycle, [squat], [], 0)
    // Template defaultDays=[1,4] (Mon, Thu)
    const trainingDays = plan.filter((d) => d.sessionLabel !== null)
    expect(trainingDays).toHaveLength(2)
    trainingDays.forEach((d) => expect(d.exercises).toHaveLength(0))
  })
})

// ─── hinge lift modes ────────────────────────────────────────────────────────

describe('buildWeekPlan — hinge lift each-day', () => {
  it('adds hinge with 1 set to every training day', () => {
    const cycle = baseCycle({
      liftIds: [1, 9],
      hingeConfig: { liftId: 9, mode: 'each-day', replacedLiftId: null },
    })
    const plan = buildWeekPlan(cycle, [squat, deadlift], [], 0)
    const trainingDays = plan.filter((d) => d.sessionLabel !== null)
    trainingDays.forEach((d) => {
      const hinge = d.exercises.find((e) => e.isHinge)
      expect(hinge).toBeDefined()
      expect(hinge.sets).toBe(1)
      expect(hinge.name).toBe('Deadlift')
    })
  })

  it('excludes hinge from regular lifts list', () => {
    const cycle = baseCycle({
      liftIds: [1, 9],
      hingeConfig: { liftId: 9, mode: 'each-day', replacedLiftId: null },
    })
    const plan = buildWeekPlan(cycle, [squat, deadlift], [], 0)
    const monday = plan.find((d) => d.dayOfWeek === 1)
    const nonHinge = monday.exercises.filter((e) => !e.isHinge)
    expect(nonHinge.every((e) => e.name !== 'Deadlift')).toBe(true)
  })
})

describe('buildWeekPlan — hinge lift day3-3sets', () => {
  it('adds hinge with 3 sets only on the 3rd training day', () => {
    const cycle = baseCycle({
      liftIds: [1, 9],
      hingeConfig: { liftId: 9, mode: 'day3-3sets', replacedLiftId: null },
    })
    const plan = buildWeekPlan(cycle, [squat, deadlift], [], 0)
    // Operator: Mon=sessionIndex 0, Wed=1, Fri=2 (3rd day)
    const monday = plan.find((d) => d.dayOfWeek === 1)
    const wednesday = plan.find((d) => d.dayOfWeek === 3)
    const friday = plan.find((d) => d.dayOfWeek === 5)
    expect(monday.exercises.find((e) => e.isHinge)).toBeUndefined()
    expect(wednesday.exercises.find((e) => e.isHinge)).toBeUndefined()
    expect(friday.exercises.find((e) => e.isHinge)).toMatchObject({ sets: 3 })
  })
})

describe('buildWeekPlan — hinge lift day3-1set', () => {
  it('adds hinge with 1 set only on the 3rd training day', () => {
    const cycle = baseCycle({
      liftIds: [1, 9],
      hingeConfig: { liftId: 9, mode: 'day3-1set', replacedLiftId: null },
    })
    const plan = buildWeekPlan(cycle, [squat, deadlift], [], 0)
    const friday = plan.find((d) => d.dayOfWeek === 5)
    expect(friday.exercises.find((e) => e.isHinge)).toMatchObject({ sets: 1 })
  })
})

describe('buildWeekPlan — hinge replacedLiftId', () => {
  it('excludes the replaced lift on the 3rd training day', () => {
    // day3-3sets with replacedLiftId=1 (squat): squat should not appear on Friday
    const cycle = baseCycle({
      liftIds: [1, 9],
      hingeConfig: { liftId: 9, mode: 'day3-3sets', replacedLiftId: 1 },
    })
    const plan = buildWeekPlan(cycle, [squat, deadlift], [], 0)
    const friday = plan.find((d) => d.dayOfWeek === 5)
    expect(friday.exercises.find((e) => e.name === 'Squat')).toBeUndefined()
    expect(friday.exercises.find((e) => e.isHinge)).toBeDefined()
    // But squat should still appear on non-3rd days
    const monday = plan.find((d) => d.dayOfWeek === 1)
    expect(monday.exercises.find((e) => e.name === 'Squat')).toBeDefined()
  })
})

// ─── liftSessionMap ──────────────────────────────────────────────────────────

describe('buildWeekPlan — liftSessionMap', () => {
  it('shows only assigned lifts per session', () => {
    const cycle = baseCycle({
      liftIds: [1, 2],
      liftSessionMap: { A: [1], B: [2], C: [1, 2] },
    })
    const plan = buildWeekPlan(cycle, [squat, press], [], 0)
    const monday    = plan.find((d) => d.dayOfWeek === 1) // session A
    const wednesday = plan.find((d) => d.dayOfWeek === 3) // session B
    const friday    = plan.find((d) => d.dayOfWeek === 5) // session C

    expect(monday.exercises.map((e) => e.name)).toEqual(['Squat'])
    expect(wednesday.exercises.map((e) => e.name)).toEqual(['Press'])
    expect(friday.exercises.map((e) => e.name)).toEqual(['Squat', 'Press'])
  })
})

// ─── conditioning ────────────────────────────────────────────────────────────

describe('buildWeekPlan — conditioning', () => {
  it('attaches conditioning to the correct day', () => {
    // Operator wave week 1 has waveWeek.week = 1
    const cycle = baseCycle({
      conditioningSchedule: [{ weekNumber: 1, dayOfWeek: 3, routineId: 42 }],
    })
    const routines = [{ id: 42, name: 'Run 30min', sessionType: 'Endurance' }]
    const plan = buildWeekPlan(cycle, [squat], routines, 0)

    const wednesday = plan.find((d) => d.dayOfWeek === 3)
    expect(wednesday.conditioning).toMatchObject({ id: 42, name: 'Run 30min' })

    // Other days should have no conditioning
    plan.filter((d) => d.dayOfWeek !== 3).forEach((d) => {
      expect(d.conditioning).toBeNull()
    })
  })

  it('returns null conditioning when routineId is not found in library', () => {
    const cycle = baseCycle({
      conditioningSchedule: [{ weekNumber: 1, dayOfWeek: 3, routineId: 99 }],
    })
    const plan = buildWeekPlan(cycle, [], [], 0)
    const wednesday = plan.find((d) => d.dayOfWeek === 3)
    expect(wednesday.conditioning).toBeNull()
  })
})
