import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

export default function LiftClusterEditor({ liftIds, onChange }) {
  const allLifts = useLiveQuery(() => db.lifts.toArray()) || []
  const [addingNew, setAddingNew] = useState(false)
  const [newLiftName, setNewLiftName] = useState('')
  const [newLiftRM, setNewLiftRM] = useState('')

  async function addExisting(liftId) {
    if (!liftIds.includes(liftId)) {
      onChange([...liftIds, liftId])
    }
  }

  function removeLift(liftId) {
    onChange(liftIds.filter((id) => id !== liftId))
  }

  async function createAndAdd() {
    const name = newLiftName.trim()
    const rm = parseInt(newLiftRM, 10)
    if (!name || !rm) return
    const id = await db.lifts.add({ name, oneRepMax: rm, notes: '' })
    onChange([...liftIds, id])
    setNewLiftName('')
    setNewLiftRM('')
    setAddingNew(false)
  }

  const clusterLifts = allLifts.filter((l) => liftIds.includes(l.id))
  const availableToAdd = allLifts.filter((l) => !liftIds.includes(l.id))

  return (
    <div className="space-y-3">
      {/* Current cluster */}
      {clusterLifts.map((lift) => (
        <div key={lift.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{lift.name}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">{lift.oneRepMax} lbs 1RM</span>
            <button
              onClick={() => removeLift(lift.id)}
              className="text-red-400 hover:text-red-600 text-xs"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* Add from existing */}
      {availableToAdd.length > 0 && (
        <select
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          onChange={(e) => { if (e.target.value) addExisting(Number(e.target.value)) }}
          value=""
        >
          <option value="">+ Add existing lift...</option>
          {availableToAdd.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      )}

      {/* Create new lift */}
      {addingNew ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Lift name"
            value={newLiftName}
            onChange={(e) => setNewLiftName(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          />
          <input
            type="number"
            placeholder="1RM"
            value={newLiftRM}
            onChange={(e) => setNewLiftRM(e.target.value)}
            className="w-20 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          />
          <button onClick={createAndAdd} className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg">Add</button>
          <button onClick={() => setAddingNew(false)} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="w-full py-2 text-sm font-medium rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400"
        >
          + Create new lift
        </button>
      )}
    </div>
  )
}
