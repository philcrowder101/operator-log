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

/** Seed default TB templates on first run (no starter cycle) */
export async function seedIfEmpty() {
  const existingTemplates = await db.templates.count()
  if (existingTemplates > 0) return

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
}
