import { TB_TEMPLATES } from '../data/tbTemplates'
import { calcWeight, calcAddedWeight, calcBodyweightReps } from './loadCalculator'
import { getWeekDays, getWaveWeekIndex, DAY_NAMES } from './cycleUtils'

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

/**
 * Pure function — builds the 7-day training plan for a given week.
 *
 * @param {object|null} cycle  - The active cycle, or null for a rest week.
 * @param {object[]}    lifts  - Lifts for the cycle, each already augmented with trainingMax.
 * @param {object[]}    conditioningRoutines - All conditioning routines from the library.
 * @param {number}      weekOffset - 0 = current week, ±n = n weeks forward/back.
 * @param {number|null} bodyWeight - User's body weight in lbs, for bodyweight lifts.
 * @returns {object[]|null} Array of 7 day objects, or null if the template is unknown.
 */
export function buildWeekPlan(cycle, lifts, conditioningRoutines, weekOffset = 0, bodyWeight = null) {
  if (!cycle) {
    // No active cycle — return an empty week so the UI can still show dates.
    const today = new Date()
    const dow = today.getDay()
    const mondayOffset = dow === 0 ? -6 : 1 - dow
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset + weekOffset * 7)
    monday.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      return {
        date,
        dayOfWeek: date.getDay(),
        dayLabel: DAY_NAMES[date.getDay()],
        sessionLabel: null,
        waveWeek: null,
        exercises: [],
        conditioning: null,
        coreWork: null,
      }
    })
  }

  const template = TB_TEMPLATES.find((t) => t.id === cycle.templateId)
  if (!template) return null

  // Hinge lift setup
  const hingeConfig = cycle.hingeConfig || null
  const hingeLift = hingeConfig?.liftId ? lifts.find((l) => l.id === hingeConfig.liftId) : null
  const hingeMode = hingeConfig?.mode || 'each-day'
  const replacedLiftId = hingeConfig?.replacedLiftId || null

  // Regular lifts exclude the hinge (scheduled separately below)
  const regularLifts = hingeLift ? lifts.filter((l) => l.id !== hingeLift.id) : lifts

  const waveIdx = getWaveWeekIndex(cycle, weekOffset)
  const waveWeek = template.waveWeeks[waveIdx] ?? template.waveWeeks[0]
  const weekDays = getWeekDays(cycle, weekOffset)

  const is3rdDay = (day) => day.sessionIndex === 2

  return weekDays.map((day) => {
    const isTraining = day.sessionLabel !== null

    let exercises = []
    if (isTraining && !waveWeek.strengthOff) {
      // Determine which lifts appear in this session
      let sessionLifts = regularLifts
      const liftSessionMap = cycle.liftSessionMap || {}
      if (Object.keys(liftSessionMap).length > 0 && liftSessionMap[day.sessionLabel]) {
        const assignedIds = liftSessionMap[day.sessionLabel]
        sessionLifts = regularLifts.filter((l) => assignedIds.includes(l.id))
      }

      // On the 3rd day with a day3 hinge mode, exclude the lift being replaced
      const onThirdDay = is3rdDay(day)
      const excludeOnThisDay =
        onThirdDay && replacedLiftId && (hingeMode === 'day3-3sets' || hingeMode === 'day3-1set')
          ? replacedLiftId
          : null

      exercises = sessionLifts
        .filter((lift) => lift.id !== excludeOnThisDay)
        .map((lift) => buildExercise(lift, waveWeek, bodyWeight))

      // Add hinge lift per mode
      if (hingeLift) {
        const addHinge = (sets) =>
          exercises.push({
            ...buildExercise(hingeLift, waveWeek, bodyWeight),
            sets,
            isHinge: true,
          })

        if (hingeMode === 'each-day') {
          addHinge(1)
        } else if (hingeMode === 'day3-3sets' && onThirdDay) {
          addHinge(3)
        } else if (hingeMode === 'day3-1set' && onThirdDay) {
          addHinge(1)
        }
      }
    }

    // Match conditioning from the schedule
    const schedEntry = (cycle.conditioningSchedule || []).find(
      (e) => e.weekNumber === waveWeek?.week && e.dayOfWeek === day.dayOfWeek
    )
    const conditioning = schedEntry
      ? conditioningRoutines.find((r) => r.id === schedEntry.routineId) || null
      : null

    const coreWork =
      (cycle.coreWorkSchedule || []).find(
        (e) => e.weekNumber === waveWeek?.week && e.dayOfWeek === day.dayOfWeek
      ) || null

    return {
      date: day.date,
      dayOfWeek: day.dayOfWeek,
      dayLabel: DAY_NAMES[day.dayOfWeek],
      sessionLabel: day.sessionLabel,
      waveWeek,
      exercises,
      conditioning,
      coreWork,
    }
  })
}
