import { useState } from 'react'
import { updateLiftOneRM } from '../hooks/useLifts'
import { calcTrainingMax } from '../utils/loadCalculator'

export default function LiftCard({ lift, onViewHistory }) {
  const [editing, setEditing] = useState(false)
  const [newRM, setNewRM] = useState(String(lift.oneRepMax))

  async function handleSave() {
    const val = parseInt(newRM, 10)
    if (!val || val <= 0) return
    await updateLiftOneRM(lift.id, val)
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-gray-800 dark:text-white">{lift.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            TM: <span className="font-medium text-gray-700 dark:text-gray-200">
              {calcTrainingMax(lift.oneRepMax)} lbs
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-800 dark:text-white">
            {lift.oneRepMax} lbs
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">1RM</div>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            value={newRM}
            onChange={(e) => setNewRM(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            placeholder="New 1RM (lbs)"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium"
          >
            Save
          </button>
          <button
            onClick={() => { setEditing(false); setNewRM(String(lift.oneRepMax)) }}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            Update 1RM
          </button>
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            >
              History
            </button>
          )}
        </div>
      )}
    </div>
  )
}
