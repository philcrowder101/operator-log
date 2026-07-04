import { describe, it, expect } from 'vitest'
import { calcTrainingMax, calcWeight, calcBodyweightReps, calcAddedWeight } from './loadCalculator'

describe('calcTrainingMax', () => {
  it('returns 90% of 1RM rounded to nearest 5', () => {
    expect(calcTrainingMax(100)).toBe(90)   // 90.0 → 90
    expect(calcTrainingMax(225)).toBe(205)  // 202.5 → round(40.5)*5 = 205
    expect(calcTrainingMax(315)).toBe(285)  // 283.5 → round(56.7)*5 = 285
    expect(calcTrainingMax(135)).toBe(120)  // 121.5 → round(24.3)*5 = 120
  })

  it('rounds up when exactly halfway', () => {
    // 111 * 0.9 = 99.9 → round(19.98)*5 = 100
    expect(calcTrainingMax(111)).toBe(100)
  })

  it('returns 0 for 0 input', () => {
    expect(calcTrainingMax(0)).toBe(0)
  })
})

describe('calcWeight', () => {
  it('returns trainingMax * loadPercent rounded to nearest 5', () => {
    expect(calcWeight(200, 80)).toBe(160)  // 160.0 → 160
    expect(calcWeight(200, 85)).toBe(170)  // 170.0 → 170
    expect(calcWeight(200, 75)).toBe(150)  // 150.0 → 150
  })

  it('rounds to nearest 5 when result is not plate-friendly', () => {
    expect(calcWeight(185, 80)).toBe(150)  // 148 → round(29.6)*5 = 150
    expect(calcWeight(225, 70)).toBe(160)  // 157.5 → round(31.5)*5 = 160
    expect(calcWeight(205, 90)).toBe(185)  // 184.5 → round(36.9)*5 = 185
  })

  it('handles 100% load', () => {
    expect(calcWeight(200, 100)).toBe(200)
  })
})

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
