import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { TB_TEMPLATES } from '../data/tbTemplates'
import { calcWeight, calcTrainingMax } from '../utils/loadCalculator'
import { getWeekDays, getWaveWeekIndex } from '../utils/cycleUtils'

/**
 * Returns array of 7 day objects for the week at weekOffset from current week.
 * Each day: { date, dayOfWeek, dayLabel, sessionLabel, waveWeek, exercises, conditioning }
 */
export function useWeekPlan(cycle, weekOffset = 0) {
  const plan = useLiveQuery(async () => {
    if (!cycle) return null

    const template = TB_TEMPLATES.find((t) => t.id === cycle.templateId)
    if (!template) return null

    // Load lifts for this cycle
    const lifts = await db.lifts.where('id').anyOf(cycle.liftIds || []).toArray()
    const liftsWithTM = lifts.map((l) => ({ ...l, trainingMax: calcTrainingMax(l.oneRepMax) }))

    // Hinge lift config
    const hingeConfig = cycle.hingeConfig || null
    const hingeLift = hingeConfig?.liftId
      ? liftsWithTM.find((l) => l.id === hingeConfig.liftId)
      : null
    const hingeMode = hingeConfig?.mode || 'each-day'
    const replacedLiftId = hingeConfig?.replacedLiftId || null

    // Regular lifts exclude the hinge lift (it's scheduled separately)
    const regularLifts = hingeLift
      ? liftsWithTM.filter((l) => l.id !== hingeLift.id)
      : liftsWithTM

    const waveIdx = getWaveWeekIndex(cycle, weekOffset)
    const waveWeek = template.waveWeeks[waveIdx] ?? template.waveWeeks[0]
    const weekDays = getWeekDays(cycle, weekOffset)

    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // sessionIndex === 2 means 3rd training day of the week
    const is3rdDay = (day) => day.sessionIndex === 2

    return weekDays.map((day) => {
      const isTraining = day.sessionLabel !== null

      let exercises = []
      if (isTraining && !waveWeek.strengthOff) {
        // Determine which lifts appear in this session
        let sessionLifts = regularLifts
        const liftSessionMap = cycle.liftSessionMap || {}
        const sessionLabel = day.sessionLabel

        if (Object.keys(liftSessionMap).length > 0 && liftSessionMap[sessionLabel]) {
          // Custom session map: only include assigned lifts
          const assignedIds = liftSessionMap[sessionLabel]
          sessionLifts = regularLifts.filter((l) => assignedIds.includes(l.id))
        }

        // On the 3rd day with a day3 mode, exclude the lift being replaced by the hinge
        const onThirdDay = is3rdDay(day)
        const excludeOnThisDay = onThirdDay && replacedLiftId && (hingeMode === 'day3-3sets' || hingeMode === 'day3-1set')
          ? replacedLiftId
          : null

        exercises = sessionLifts
          .filter((lift) => lift.id !== excludeOnThisDay)
          .map((lift) => ({
            id: lift.id,
            name: lift.name,
            sets: waveWeek.sets,
            reps: waveWeek.reps,
            loadPercent: waveWeek.loadPercent,
            weightLbs: calcWeight(lift.trainingMax, waveWeek.loadPercent),
            restMinutes: waveWeek.restMinutes,
          }))

        // Add hinge lift per mode
        if (hingeLift) {
          const addHinge = (sets) => exercises.push({
            id: hingeLift.id,
            name: hingeLift.name,
            sets,
            reps: waveWeek.reps,
            loadPercent: waveWeek.loadPercent,
            weightLbs: calcWeight(hingeLift.trainingMax, waveWeek.loadPercent),
            restMinutes: waveWeek.restMinutes,
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

      // Find conditioning for this day of week
      const conditioning = (cycle.conditioningDays || []).find(
        (c) => c.dayOfWeek === day.dayOfWeek
      ) || null

      return {
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        dayLabel: DAY_LABELS[day.dayOfWeek],
        sessionLabel: day.sessionLabel,
        waveWeek: waveWeek,
        exercises,
        conditioning,
      }
    })
  }, [cycle?.id, JSON.stringify(cycle?.liftIds), JSON.stringify(cycle?.liftSessionMap), JSON.stringify(cycle?.conditioningDays), JSON.stringify(cycle?.hingeConfig), weekOffset])

  return plan || null
}
