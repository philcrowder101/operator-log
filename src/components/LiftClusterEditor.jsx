import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

const PRESET_LIFTS = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Weighted Pullups',
  'Military Press',
  'Bulgarian Split Squats',
  'Single Leg Deadlift',
  'Incline Bench',
  'Decline Bench',
  'Rows',
]

export default function LiftClusterEditor({ liftIds, onChange }) {
  const allLifts = useLiveQuery(() => db.lifts.toArray()) || []
  const [adding, setAdding] = useState(false)
  const [liftName, setLiftName] = useState('')
  const [liftRM, setLiftRM] = useState('')

  const clusterLifts = allLifts.filter((l) => liftIds.includes(l.id))
  const existingNames = allLifts.map((l) => l.name.toLowerCase())

  // Presets not already in the DB or cluster
  const availablePresets = PRESET_LIFTS.filter(
    (p) => !clusterLifts.some((l) => l.name.toLowerCase() === p.toLowerCase())
  )
  // Existing DB lifts not in cluster
  const availableExisting = allLifts.filter((l) => !liftIds.includes(l.id))

  function removeLift(liftId) {
    onChange(liftIds.filter((id) => id !== liftId))
  }

  async function addLift() {
    const name = liftName.trim()
    const rm = parseInt(liftRM, 10)
    if (!name || !rm) return

    // Reuse existing lift record if name matches
    const existing = allLifts.find((l) => l.name.toLowerCase() === name.toLowerCase())
    const id = existing ? existing.id : await db.lifts.add({ name, oneRepMax: rm, notes: '' })
    if (!liftIds.includes(id)) onChange([...liftIds, id])
    setLiftName('')
    setLiftRM('')
    setAdding(false)
  }

  async function selectPreset(name) {
    const existing = allLifts.find((l) => l.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      if (!liftIds.includes(existing.id)) onChange([...liftIds, existing.id])
    } else {
      // Create with placeholder 1RM — user updates it in Lifts tab
      const id = await db.lifts.add({ name, oneRepMax: 135, notes: '' })
      onChange([...liftIds, id])
    }
  }

  async function selectExisting(liftId) {
    if (!liftIds.includes(liftId)) onChange([...liftIds, liftId])
  }

  return (
    <div className="space-y-3">
      {/* Current cluster */}
      {clusterLifts.length === 0 && (
        <div className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
          No lifts added yet.
        </div>
      )}
      {clusterLifts.map((lift) => (
        <div key={lift.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{lift.name}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">{lift.oneRepMax} lbs</span>
            <button onClick={() => removeLift(lift.id)} className="text-red-400 text-xs">Remove</button>
          </div>
        </div>
      ))}

      {/* Preset lift pills */}
      {availablePresets.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">Quick add</div>
          <div className="flex flex-wrap gap-2">
            {availablePresets.map((name) => (
              <button
                key={name}
                onClick={() => selectPreset(name)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add from existing DB lifts not in cluster */}
      {availableExisting.length > 0 && (
        <select
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          onChange={(e) => { if (e.target.value) selectExisting(Number(e.target.value)) }}
          value=""
        >
          <option value="">+ Add from saved lifts...</option>
          {availableExisting.map((l) => (
            <option key={l.id} value={l.id}>{l.name} ({l.oneRepMax} lbs)</option>
          ))}
        </select>
      )}

      {/* Custom free-text lift */}
      {adding ? (
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <input
            type="text"
            placeholder="Lift name"
            value={liftName}
            onChange={(e) => setLiftName(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            autoFocus
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="1RM (lbs)"
              value={liftRM}
              onChange={(e) => setLiftRM(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            />
            <button onClick={addLift} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium">Add</button>
            <button onClick={() => { setAdding(false); setLiftName(''); setLiftRM('') }} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-2 text-sm font-medium rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
        >
          + Custom lift
        </button>
      )}
    </div>
  )
}
