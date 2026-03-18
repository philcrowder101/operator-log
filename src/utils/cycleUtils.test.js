import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getWaveWeekIndex, getWeekDays, cycleHasStarted, weeksUntilCycle } from './cycleUtils'

// Pin "today" to a known Monday using local time.
// April 13, 2026 is a Monday and is well clear of the March 8 US DST boundary,
// so millisecond-based week arithmetic is stable.
const FAKE_TODAY = new Date(2026, 3, 13) // April 13, 2026, local midnight

// Build a cycle start date string that parses as LOCAL time.
// Date-only ISO strings (e.g. '2026-04-06') are parsed as UTC midnight, which
// shifts to the previous day in US timezones. Using a local noon datetime
// string avoids that shift across any realistic timezone.
function localStartDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T12:00:00` // no trailing Z → parsed as local time
}

// Return a startDate string that is exactly n * 7 days before FAKE_TODAY.
function weeksAgo(n) {
  const d = new Date(FAKE_TODAY)
  d.setDate(d.getDate() - n * 7)
  return localStartDate(d)
}

function operatorCycle(startDate, overrides = {}) {
  return { templateId: 'operator', startDate, currentWeekOffset: 0, ...overrides }
}

function zuluCycle(startDate) {
  return { templateId: 'zulu', startDate, currentWeekOffset: 0 }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FAKE_TODAY)
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── cycleHasStarted ────────────────────────────────────────────────────────

describe('cycleHasStarted', () => {
  it('returns true when startDate equals today (UTC)', () => {
    // FAKE_TODAY local midnight → UTC ISO starts with '2026-04-13'
    expect(cycleHasStarted({ startDate: '2026-04-13' })).toBe(true)
  })

  it('returns true when startDate is in the past', () => {
    expect(cycleHasStarted({ startDate: '2026-04-12' })).toBe(true)
    expect(cycleHasStarted({ startDate: '2025-01-01' })).toBe(true)
  })

  it('returns false when startDate is in the future', () => {
    expect(cycleHasStarted({ startDate: '2026-04-14' })).toBe(false)
    expect(cycleHasStarted({ startDate: '2027-01-01' })).toBe(false)
  })
})

// ─── weeksUntilCycle ────────────────────────────────────────────────────────

describe('weeksUntilCycle', () => {
  it('returns 0 when cycle starts this week (same Monday)', () => {
    expect(weeksUntilCycle({ startDate: '2026-04-13' })).toBe(0) // the Monday itself
    expect(weeksUntilCycle({ startDate: '2026-04-15' })).toBe(0) // mid-week
  })

  it('returns 1 for a cycle starting next Monday', () => {
    expect(weeksUntilCycle({ startDate: '2026-04-20' })).toBe(1)
  })

  it('returns negative for a cycle that already started', () => {
    expect(weeksUntilCycle({ startDate: '2026-04-06' })).toBe(-1) // last week
    expect(weeksUntilCycle({ startDate: '2026-03-30' })).toBe(-2)
  })
})

// ─── getWaveWeekIndex ───────────────────────────────────────────────────────

describe('getWaveWeekIndex', () => {
  it('returns 0 when cycle started this week', () => {
    expect(getWaveWeekIndex(operatorCycle(weeksAgo(0)), 0)).toBe(0)
  })

  it('advances by 1 each week', () => {
    expect(getWaveWeekIndex(operatorCycle(weeksAgo(1)), 0)).toBe(1)
    expect(getWaveWeekIndex(operatorCycle(weeksAgo(2)), 0)).toBe(2)
  })

  it('wraps back to 0 after the full wave length', () => {
    // Operator has 3 wave weeks; 3 weeks since start → index 0 again
    expect(getWaveWeekIndex(operatorCycle(weeksAgo(3)), 0)).toBe(0)
    expect(getWaveWeekIndex(operatorCycle(weeksAgo(4)), 0)).toBe(1)
  })

  it('applies weekOffset correctly', () => {
    const cycle = operatorCycle(weeksAgo(0))
    expect(getWaveWeekIndex(cycle, 1)).toBe(1)
    expect(getWaveWeekIndex(cycle, 2)).toBe(2)
    expect(getWaveWeekIndex(cycle, 3)).toBe(0) // wraps
  })

  it('handles negative weekOffset without going below 0', () => {
    const cycle = operatorCycle(weeksAgo(0))
    expect(getWaveWeekIndex(cycle, -1)).toBe(2) // wraps to last wave week
  })

  it('applies cycle.currentWeekOffset', () => {
    const cycle = operatorCycle(weeksAgo(0), { currentWeekOffset: 1 })
    expect(getWaveWeekIndex(cycle, 0)).toBe(1)
  })

  it('returns 0 for unknown templateId', () => {
    const cycle = { templateId: 'nonexistent', startDate: weeksAgo(1), currentWeekOffset: 0 }
    expect(getWaveWeekIndex(cycle, 0)).toBe(0)
  })

  it('counts 1 week correctly across a DST spring-forward boundary', () => {
    // US DST 2026: clocks spring forward March 8 at 2am (Mon–Sun window).
    // A cycle starting Mon March 2 and checked on Mon March 9 spans the
    // boundary, making that "week" only ~167 hours in ms. Math.round corrects
    // this; Math.floor would return 0 instead of 1.
    vi.setSystemTime(new Date(2026, 2, 9))  // March 9 local midnight (post-DST)
    const startDate = localStartDate(new Date(2026, 2, 2)) // March 2 local noon
    const cycle = operatorCycle(startDate)
    expect(getWaveWeekIndex(cycle, 0)).toBe(1)
  })
})

// ─── getWeekDays ────────────────────────────────────────────────────────────

describe('getWeekDays', () => {
  it('returns 7 days starting on Monday', () => {
    const days = getWeekDays(operatorCycle(weeksAgo(0)), 0)
    expect(days).toHaveLength(7)
    expect(days[0].date.getDay()).toBe(1) // Monday
    expect(days[6].date.getDay()).toBe(0) // Sunday
  })

  it('assigns session labels A/B/C to Mon/Wed/Fri for Operator', () => {
    const days = getWeekDays(operatorCycle(weeksAgo(0)), 0)
    const sessions = days.filter((d) => d.sessionLabel !== null)
    expect(sessions).toHaveLength(3)
    expect(sessions[0].sessionLabel).toBe('A') // Monday
    expect(sessions[1].sessionLabel).toBe('B') // Wednesday
    expect(sessions[2].sessionLabel).toBe('C') // Friday
  })

  it('marks non-training days with null sessionLabel', () => {
    const days = getWeekDays(operatorCycle(weeksAgo(0)), 0)
    // Tue, Thu, Sat, Sun are rest days for Operator
    expect(days.filter((d) => d.sessionLabel === null)).toHaveLength(4)
  })

  it('session labels continue correctly into the next week', () => {
    // Operator: 3 sessions/week with labels A/B/C — they repeat each week
    const cycle = operatorCycle(weeksAgo(0))
    const sessions = getWeekDays(cycle, 1).filter((d) => d.sessionLabel !== null)
    expect(sessions[0].sessionLabel).toBe('A')
    expect(sessions[1].sessionLabel).toBe('B')
    expect(sessions[2].sessionLabel).toBe('C')
  })

  it('Zulu alternates A/B across 4 sessions per week', () => {
    const days = getWeekDays(zuluCycle(weeksAgo(0)), 0)
    const sessions = days.filter((d) => d.sessionLabel !== null)
    expect(sessions).toHaveLength(4)
    expect(sessions[0].sessionLabel).toBe('A') // Monday
    expect(sessions[1].sessionLabel).toBe('B') // Tuesday
    expect(sessions[2].sessionLabel).toBe('A') // Thursday
    expect(sessions[3].sessionLabel).toBe('B') // Friday
  })

  it('returns all-null sessions for unknown templateId', () => {
    const cycle = { templateId: 'nonexistent', startDate: weeksAgo(0), currentWeekOffset: 0 }
    const days = getWeekDays(cycle, 0)
    expect(days).toHaveLength(7)
    expect(days.every((d) => d.sessionLabel === null)).toBe(true)
  })

  it('weekOffset shifts the displayed week by exactly 7 days', () => {
    const cycle = operatorCycle(weeksAgo(0))
    const thisWeek = getWeekDays(cycle, 0)
    const nextWeek = getWeekDays(cycle, 1)
    const diff = (nextWeek[0].date - thisWeek[0].date) / (1000 * 60 * 60 * 24)
    expect(diff).toBe(7)
  })
})
