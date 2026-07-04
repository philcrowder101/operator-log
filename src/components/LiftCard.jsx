import { useState } from 'react'
import { db } from '../db/db'
import { updateLiftOneRM } from '../hooks/useLifts'
import { calcTrainingMax } from '../utils/loadCalculator'

export default function LiftCard({ lift, onViewHistory }) {
  const [editing, setEditing] = useState(false)
  const [newRM, setNewRM] = useState(String(lift.oneRepMax))
  const [isBw, setIsBw] = useState(!!lift.isBodyweight)
  const [newMaxReps, setNewMaxReps] = useState(lift.maxReps ? String(lift.maxReps) : '')

  async function handleSave() {
    const val = parseInt(newRM, 10)
    if (!val || val <= 0) return
    if (val !== lift.oneRepMax) await updateLiftOneRM(lift.id, val)
    const reps = parseInt(newMaxReps, 10)
    await db.lifts.update(lift.id, {
      isBodyweight: isBw,
      maxReps: isBw && reps > 0 ? reps : null,
    })
    setEditing(false)
  }

  function handleCancel() {
    setEditing(false)
    setNewRM(String(lift.oneRepMax))
    setIsBw(!!lift.isBodyweight)
    setNewMaxReps(lift.maxReps ? String(lift.maxReps) : '')
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-800 dark:text-white">{lift.name}</span>
            {lift.isBodyweight && (
              <span className="text-xs font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 px-1.5 py-0.5 rounded">
                BW
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            TM: <span className="font-medium text-gray-700 dark:text-gray-200">
              {calcTrainingMax(lift.oneRepMax)} lbs
            </span>
            {lift.isBodyweight && lift.maxReps > 0 && (
              <> · Max reps: <span className="font-medium text-gray-700 dark:text-gray-200">{lift.maxReps}</span></>
            )}
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
        <div className="mt-3 space-y-2">
          <input
            type="number"
            value={newRM}
            onChange={(e) => setNewRM(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            placeholder="New 1RM (lbs)"
            autoFocus
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={isBw}
              onChange={(e) => setIsBw(e.target.checked)}
              className="w-4 h-4"
            />
            Bodyweight lift (1RM includes body weight)
          </label>
          {isBw && (
            <input
              type="number"
              value={newMaxReps}
              onChange={(e) => setNewMaxReps(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              placeholder="Max unweighted reps"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            Edit
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
