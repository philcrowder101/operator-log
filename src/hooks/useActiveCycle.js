import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export function useActiveCycle() {
  const state = useLiveQuery(() => db.appState.get('activeCycleId'))
  const cycleId = state?.value

  const cycle = useLiveQuery(
    () => (cycleId ? db.cycles.get(cycleId) : null),
    [cycleId]
  )

  return { cycle, cycleId }
}
