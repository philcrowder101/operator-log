import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export default function BodyWeightCard() {
  const stored = useLiveQuery(async () => (await db.appState.get('bodyWeightLbs'))?.value ?? null)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  async function save() {
    const v = parseInt(value, 10)
    if (!v || v <= 0) return
    await db.appState.put({ key: 'bodyWeightLbs', value: v })
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm text-gray-800 dark:text-white">Body Weight</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Used for bodyweight lifts like weighted pullups
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => { setValue(stored ? String(stored) : ''); setEditing(true) }}
            className="text-lg font-bold text-gray-800 dark:text-white"
          >
            {stored ? `${stored} lbs` : 'Set'}
          </button>
        )}
      </div>
      {editing && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            placeholder="Body weight (lbs)"
            autoFocus
          />
          <button onClick={save} className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium">
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
