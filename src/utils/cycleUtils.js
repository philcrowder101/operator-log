import { TB_TEMPLATES } from '../data/tbTemplates'

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

  // Map each training day to a session label in order
  let sessionCounter = 0

  // For Zulu (4x/week A/B alternating), we need to count across weeks
  // Use cycle start date to keep session sequencing consistent
  const cycleStart = new Date(cycle.startDate)
  cycleStart.setHours(0, 0, 0, 0)

  // Count total training sessions before this week's Monday
  let totalSessionsBefore = 0
  const refMonday = new Date(monday)
  const dayDiff = Math.floor((refMonday - cycleStart) / (1000 * 60 * 60 * 24))
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

  const cycleStart = new Date(cycle.startDate)
  cycleStart.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weeksSinceStart = Math.floor((today - cycleStart) / (7 * 24 * 60 * 60 * 1000))
  const raw = (weeksSinceStart + weekOffset + (cycle.currentWeekOffset || 0)) % totalWaveWeeks
  return ((raw % totalWaveWeeks) + totalWaveWeeks) % totalWaveWeeks
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
