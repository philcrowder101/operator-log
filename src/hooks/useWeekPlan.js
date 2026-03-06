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

    const waveIdx = getWaveWeekIndex(cycle, weekOffset)
    const waveWeek = template.waveWeeks[waveIdx] ?? template.waveWeeks[0]
    const weekDays = getWeekDays(cycle, weekOffset)

    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return weekDays.map((day) => {
      const isTraining = day.sessionLabel !== null

      let exercises = []
      if (isTraining) {
        // Determine which lifts appear in this session
        let sessionLifts = liftsWithTM
        const liftSessionMap = cycle.liftSessionMap || {}
        const sessionLabel = day.sessionLabel

        if (Object.keys(liftSessionMap).length > 0 && liftSessionMap[sessionLabel]) {
          // Custom session map: only include assigned lifts
          const assignedIds = liftSessionMap[sessionLabel]
          sessionLifts = liftsWithTM.filter((l) => assignedIds.includes(l.id))
        }

        exercises = sessionLifts.map((lift) => ({
          id: lift.id,
          name: lift.name,
          sets: waveWeek.sets,
          reps: waveWeek.reps,
          loadPercent: waveWeek.loadPercent,
          weightLbs: calcWeight(lift.trainingMax, waveWeek.loadPercent),
          restMinutes: waveWeek.restMinutes,
        }))
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
  }, [cycle?.id, cycle?.liftIds, cycle?.liftSessionMap, cycle?.conditioningDays, weekOffset])

  return plan || null
}
