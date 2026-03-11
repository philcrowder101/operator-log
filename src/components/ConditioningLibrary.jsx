import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import ConditioningRoutineForm from './ConditioningRoutineForm'

const TYPE_COLORS = {
  SE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  HIC: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  Endurance: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
}

function routineSubtitle(r) {
  if (r.sessionType === 'SE') return r.details.exercises?.[0]?.name || 'Circuit'
  if (r.sessionType === 'Endurance') return [r.details.activity, r.details.duration].filter(Boolean).join(' · ')
  if (r.sessionType === 'HIC') return `${r.details.rounds} rounds · ${r.details.exercise || 'HIC'}`
  return ''
}

export default function ConditioningLibrary() {
  const routines = useLiveQuery(() => db.conditioningRoutines.toArray()) || []
  const [editing, setEditing] = useState(null) // null | 'new' | routine object

  async function saveRoutine(routine) {
    if (routine.id) {
      await db.conditioningRoutines.update(routine.id, {
        name: routine.name,
        sessionType: routine.sessionType,
        details: routine.details,
      })
    } else {
      await db.conditioningRoutines.add({
        name: routine.name,
        sessionType: routine.sessionType,
        details: routine.details,
      })
    }
    setEditing(null)
  }

  async function deleteRoutine(id) {
    if (confirm('Delete this routine? It will be removed from any schedules that use it.')) {
      await db.conditioningRoutines.delete(id)
    }
  }

  return (
    <div className="space-y-1">
      {routines.length === 0 && (
        <div className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          No routines yet. Create one to assign to cycle schedules.
        </div>
      )}

      {routines.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[r.sessionType] || ''}`}>
            {r.sessionType}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 dark:text-white truncate">{r.name}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 truncate">{routineSubtitle(r)}</div>
          </div>
          <button
            onClick={() => setEditing(r)}
            className="text-xs text-blue-500 dark:text-blue-400 font-medium flex-shrink-0"
          >
            Edit
          </button>
          <button
            onClick={() => deleteRoutine(r.id)}
            className="text-xs text-red-400 font-medium flex-shrink-0"
          >
            Delete
          </button>
        </div>
      ))}

      <button
        onClick={() => setEditing('new')}
        className="w-full py-2 mt-1 text-sm text-blue-500 dark:text-blue-400 font-medium border border-dashed border-blue-300 dark:border-blue-700 rounded-lg"
      >
        + New Routine
      </button>

      {editing && (
        <ConditioningRoutineForm
          routine={editing === 'new' ? null : editing}
          onSave={saveRoutine}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
