import Dexie from 'dexie'
import { TB_TEMPLATES } from '../data/tbTemplates'

export const db = new Dexie('OperatorLogDB')

db.version(1).stores({
  lifts: '++id, name',
  liftHistory: '++id, liftId, date',
  templates: '++id, name',
  cycles: '++id, status',
  appState: 'key',
})

/** Seed default TB templates + a starter cycle on first run */
export async function seedIfEmpty() {
  const existingTemplates = await db.templates.count()
  if (existingTemplates > 0) return

  // Seed templates
  for (const t of TB_TEMPLATES) {
    await db.templates.add({
      name: t.name,
      isCustom: false,
      tbId: t.id,
      sessionsPerWeek: t.sessionsPerWeek,
      sessionLabels: t.sessionLabels,
      waveWeeks: t.waveWeeks,
      sessionLiftMap: t.sessionLiftMap,
      defaultDays: t.defaultDays,
    })
  }

  // Seed default lifts
  const liftIds = []
  const defaultLifts = [
    { name: 'Squat', oneRepMax: 225 },
    { name: 'Bench Press', oneRepMax: 185 },
    { name: 'Deadlift', oneRepMax: 315 },
    { name: 'Press (OHP)', oneRepMax: 115 },
  ]
  for (const l of defaultLifts) {
    const id = await db.lifts.add({ name: l.name, oneRepMax: l.oneRepMax, notes: '' })
    liftIds.push(id)
  }

  // Seed a starter Operator cycle starting today
  const today = new Date().toISOString().split('T')[0]
  await db.cycles.add({
    templateId: 'operator',
    name: 'Cycle 1',
    startDate: today,
    currentWeekOffset: 0,
    totalWeeks: 12,
    liftIds,
    liftSessionMap: {}, // empty = all lifts all sessions (Operator style)
    conditioningDays: [],
    status: 'active',
  })

  await db.appState.put({ key: 'activeCycleId', value: 1 })
}
