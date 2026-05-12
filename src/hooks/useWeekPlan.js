import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { calcTrainingMax } from '../utils/loadCalculator'
import { buildWeekPlan } from '../utils/weekPlanBuilder'

/**
 * Returns array of 7 day objects for the week at weekOffset from current week.
 * Each day: { date, dayOfWeek, dayLabel, sessionLabel, waveWeek, exercises, conditioning }
 *
 * Data fetching is handled here; all scheduling logic lives in buildWeekPlan.
 */
export function useWeekPlan(cycle, weekOffset = 0) {
  const plan = useLiveQuery(async () => {
    if (!cycle) return buildWeekPlan(null, [], [], weekOffset)

    const lifts = await db.lifts.where('id').anyOf(cycle.liftIds || []).toArray()
    const liftsWithTM = lifts.map((l) => ({ ...l, trainingMax: calcTrainingMax(l.oneRepMax) }))
    const allRoutines = await db.conditioningRoutines.toArray()

    return buildWeekPlan(cycle, liftsWithTM, allRoutines, weekOffset)
  }, [
    cycle?.id,
    cycle?.startDate,
    cycle?.currentWeekOffset,
    JSON.stringify(cycle?.liftIds),
    JSON.stringify(cycle?.liftSessionMap),
    JSON.stringify(cycle?.conditioningSchedule),
    JSON.stringify(cycle?.hingeConfig),
    weekOffset,
  ])

  return plan || null
}
