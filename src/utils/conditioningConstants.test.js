import { describe, it, expect } from 'vitest'
import { TYPE_COLORS, DEFAULT_SE, DEFAULT_ENDURANCE, DEFAULT_HIC } from './conditioningConstants'

// ─── TYPE_COLORS ─────────────────────────────────────────────────────────────

describe('TYPE_COLORS', () => {
  it('has entries for all three session types', () => {
    expect(TYPE_COLORS).toHaveProperty('SE')
    expect(TYPE_COLORS).toHaveProperty('HIC')
    expect(TYPE_COLORS).toHaveProperty('Endurance')
  })

  it('each value is a non-empty string', () => {
    for (const val of Object.values(TYPE_COLORS)) {
      expect(typeof val).toBe('string')
      expect(val.length).toBeGreaterThan(0)
    }
  })

  // Canonical colors: SE=green, HIC=red, Endurance=blue.
  // ConditioningCard previously used SE=orange/Endurance=green — this test
  // locks in the correct values so the bug cannot regress.
  it('SE is green', () => {
    expect(TYPE_COLORS.SE).toMatch(/green/)
  })

  it('HIC is red', () => {
    expect(TYPE_COLORS.HIC).toMatch(/red/)
  })

  it('Endurance is blue', () => {
    expect(TYPE_COLORS.Endurance).toMatch(/blue/)
  })
})

// ─── DEFAULT_SE ───────────────────────────────────────────────────────────────

describe('DEFAULT_SE', () => {
  it('has an exercises array with one entry', () => {
    expect(Array.isArray(DEFAULT_SE.exercises)).toBe(true)
    expect(DEFAULT_SE.exercises).toHaveLength(1)
  })

  it('default exercise has name, circuits, and reps', () => {
    const ex = DEFAULT_SE.exercises[0]
    expect(ex).toHaveProperty('name')
    expect(ex).toHaveProperty('circuits')
    expect(ex).toHaveProperty('reps')
  })

  it('has restBetweenCircuits', () => {
    expect(DEFAULT_SE).toHaveProperty('restBetweenCircuits')
    expect(typeof DEFAULT_SE.restBetweenCircuits).toBe('string')
  })

  it('spreading produces an independent object (no shared reference mutation)', () => {
    const copy = { ...DEFAULT_SE, exercises: [...DEFAULT_SE.exercises] }
    copy.exercises.push({ name: 'Extra', circuits: 1, reps: 5 })
    expect(DEFAULT_SE.exercises).toHaveLength(1)
  })
})

// ─── DEFAULT_ENDURANCE ───────────────────────────────────────────────────────

describe('DEFAULT_ENDURANCE', () => {
  it('has activity, duration, and distance', () => {
    expect(DEFAULT_ENDURANCE).toHaveProperty('activity')
    expect(DEFAULT_ENDURANCE).toHaveProperty('duration')
    expect(DEFAULT_ENDURANCE).toHaveProperty('distance')
  })

  it('activity and duration are non-empty strings', () => {
    expect(DEFAULT_ENDURANCE.activity.length).toBeGreaterThan(0)
    expect(DEFAULT_ENDURANCE.duration.length).toBeGreaterThan(0)
  })
})

// ─── DEFAULT_HIC ─────────────────────────────────────────────────────────────

describe('DEFAULT_HIC', () => {
  it('has exercise, workInterval, restInterval, and rounds', () => {
    expect(DEFAULT_HIC).toHaveProperty('exercise')
    expect(DEFAULT_HIC).toHaveProperty('workInterval')
    expect(DEFAULT_HIC).toHaveProperty('restInterval')
    expect(DEFAULT_HIC).toHaveProperty('rounds')
  })

  it('intervals are non-empty strings', () => {
    expect(DEFAULT_HIC.workInterval.length).toBeGreaterThan(0)
    expect(DEFAULT_HIC.restInterval.length).toBeGreaterThan(0)
  })

  it('rounds is a positive number', () => {
    expect(typeof DEFAULT_HIC.rounds).toBe('number')
    expect(DEFAULT_HIC.rounds).toBeGreaterThan(0)
  })
})
