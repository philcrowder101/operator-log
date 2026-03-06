import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { calcTrainingMax } from '../utils/loadCalculator'

export function useLifts(liftIds = null) {
  const lifts = useLiveQuery(async () => {
    const all = liftIds
      ? await db.lifts.where('id').anyOf(liftIds).toArray()
      : await db.lifts.toArray()
    return all.map((l) => ({
      ...l,
      trainingMax: calcTrainingMax(l.oneRepMax),
    }))
  }, [JSON.stringify(liftIds)])

  return lifts || []
}

export async function updateLiftOneRM(liftId, newOneRM) {
  const tm = calcTrainingMax(newOneRM)
  await db.lifts.update(liftId, { oneRepMax: newOneRM })
  await db.liftHistory.add({
    liftId,
    date: new Date().toISOString(),
    oneRepMax: newOneRM,
    trainingMax: tm,
  })
}
