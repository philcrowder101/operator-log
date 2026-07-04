import { TB_TEMPLATES } from '../data/tbTemplates'

// Returns today's date as a local YYYY-MM-DD string (not UTC).
function todayLocalStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Given a cycle's start date and template, return an array of 7 day objects
 * for the week containing `targetDate`.
 *
 * Each day: { date: Date, dayLabel: string, sessionIndex: number|null, sessionLabel: string|null }
 * sessionIndex = index into waveWeeks array (0-based)
 * sessionLabel = 'A' | 'B' | 'C' | null (rest)
 */
export function getWeekDays(cycle, weekOffset = 0) {
  const template = TB_TEMPLATES.find((t) => t.id === cycle.templateId) || null

  // Start of the display week (Mon of current week + offset)
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)

  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    days.push({ date, dayOfWeek: date.getDay() })
  }

  if (!template) {
    return days.map((d) => ({ ...d, sessionLabel: null, sessionIndex: null }))
  }

  const trainingDays = template.defaultDays // e.g. [1,3,5]
  const sessionLabels = template.sessionLabels // e.g. ['A','B','C']

  // For Zulu (4x/week A/B alternating), we need to count across weeks
  // Use cycle start date to keep session sequencing consistent
  // Parse as local midnight, not UTC (date-only ISO strings default to UTC).
  const cycleStart = new Date(cycle.startDate + 'T00:00:00')

  // Count total training sessions before this week's Monday
  let totalSessionsBefore = 0
  const refMonday = new Date(monday)
  const dayDiff = Math.round((refMonday - cycleStart) / (1000 * 60 * 60 * 24))
  if (dayDiff > 0) {
    // Weeks before this week
    const fullWeeksBefore = Math.floor(dayDiff / 7)
    totalSessionsBefore = fullWeeksBefore * trainingDays.length

    // Partial week days before Monday
    const remainderDays = dayDiff % 7
    for (let d = 0; d < remainderDays; d++) {
      const checkDate = new Date(cycleStart)
      checkDate.setDate(cycleStart.getDate() + fullWeeksBefore * 7 + d)
      if (trainingDays.includes(checkDate.getDay())) {
        totalSessionsBefore++
      }
    }
  }

  return days.map((d) => {
    if (!trainingDays.includes(d.dayOfWeek)) {
      return { ...d, sessionLabel: null, sessionIndex: null }
    }
    // Find position of this day in the week's training days
    const posInWeek = trainingDays.indexOf(d.dayOfWeek)
    const globalSessionIdx = totalSessionsBefore + posInWeek
    const labelIdx = globalSessionIdx % sessionLabels.length
    return {
      ...d,
      sessionLabel: sessionLabels[labelIdx],
      sessionIndex: posInWeek,
    }
  })
}

/**
 * Given a cycle + weekOffset, return the wave week index (0-based).
 * Wave repeats every waveWeeks.length weeks.
 */
export function getWaveWeekIndex(cycle, weekOffset = 0) {
  const template = TB_TEMPLATES.find((t) => t.id === cycle.templateId)
  if (!template) return 0
  const totalWaveWeeks = template.waveWeeks.length

  // Parse as local midnight, not UTC (date-only ISO strings default to UTC).
  const cycleStart = new Date(cycle.startDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysSinceStart = Math.round((today - cycleStart) / (24 * 60 * 60 * 1000))
  const weeksSinceStart = Math.floor(daysSinceStart / 7)
  const raw = (weeksSinceStart + weekOffset + (cycle.currentWeekOffset || 0)) % totalWaveWeeks
  return ((raw % totalWaveWeeks) + totalWaveWeeks) % totalWaveWeeks
}

/** Returns true if the cycle's start date is today or in the past. */
export function cycleHasStarted(cycle) {
  return cycle.startDate <= todayLocalStr()
}

/**
 * Returns how many calendar weeks from this week until the cycle's start week.
 * Negative when the cycle started in the past, 0 when it starts this week.
 */
export function weeksUntilCycle(cycle) {
  const getMonday = (dateStr) => {
    const dt = new Date(dateStr + 'T00:00:00') // local-time parse
    const day = dt.getDay()
    dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1))
    return dt
  }
  const nowMonday = getMonday(todayLocalStr())
  const startMonday = getMonday(cycle.startDate)
  return Math.round((startMonday - nowMonday) / (7 * 24 * 60 * 60 * 1000))
}

/**
 * Returns the cycle that is active for the week at the given weekOffset, or null
 * if that week is a rest/gap week.
 *
 * A cycle with a successor ends after the last full wave that fits before the next
 * cycle starts. Weeks in the resulting gap are rest weeks.
 * A cycle with no successor repeats its wave indefinitely.
 */
export function getCycleForWeek(allCycles, weekOffset = 0) {
  if (!allCycles || allCycles.length === 0) return null

  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayDelta = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekMonday = new Date(today)
  weekMonday.setDate(today.getDate() + mondayDelta + weekOffset * 7)
  weekMonday.setHours(0, 0, 0, 0)

  // A cycle is considered "started" for a given week if its start date falls
  // anywhere within that week (Mon–Sun) or earlier.
  const weekSunday = new Date(weekMonday)
  weekSunday.setDate(weekMonday.getDate() + 6)
  const pad = (n) => String(n).padStart(2, '0')
  const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const weekSundayStr = toStr(weekSunday)

  // Most recently started cycle as of this week's Sunday
  const candidate = allCycles
    .filter((c) => c.startDate <= weekSundayStr)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null

  if (!candidate) return null

  // Find the next cycle by start date (started or upcoming)
  const allSorted = [...allCycles].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const idx = allSorted.findIndex((c) => c.id === candidate.id)
  const nextCycle = idx < allSorted.length - 1 ? allSorted[idx + 1] : null

  if (!nextCycle) return candidate // No successor — repeats indefinitely

  // Compute how many full waves fit between this cycle's start and the next cycle's start
  const template = TB_TEMPLATES.find((t) => t.id === candidate.templateId)
  if (!template) return candidate
  const waveDays = template.waveWeeks.length * 7
  const cycleStart = new Date(candidate.startDate + 'T00:00:00')
  const nextStart = new Date(nextCycle.startDate + 'T00:00:00')
  const daysBetween = Math.round((nextStart - cycleStart) / 86400000)
  const completedWaves = Math.floor(daysBetween / waveDays)

  if (completedWaves === 0) return candidate // Next cycle starts mid-wave, no gap

  // Effective end = start of the first rest week (one day after last training day)
  const effectiveEnd = new Date(cycleStart)
  effectiveEnd.setDate(cycleStart.getDate() + completedWaves * waveDays)

  return weekMonday >= effectiveEnd ? null : candidate
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
