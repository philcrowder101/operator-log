import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

const HINGE_OPTIONS = [
  { value: 'deadlift', label: 'Deadlift' },
  { value: 'single-leg-deadlift', label: 'Single Leg Deadlift' },
]

const HINGE_NAMES = {
  'deadlift': 'Deadlift',
  'single-leg-deadlift': 'Single Leg Deadlift',
}

const MODE_OPTIONS = [
  { value: 'each-day', label: '1 set — every lift day' },
  { value: 'day3-3sets', label: '3 sets — 3rd lift day only (replaces a lift)' },
  { value: 'day3-1set', label: '1 set — 3rd lift day only (replaces a lift)' },
]

export default function HingeLiftEditor({
  hingeConfig,
  onHingeChange,
  liftIds,
  onLiftIdsChange,
  sessionsPerWeek,
  clusterLifts,
}) {
  const allLifts = useLiveQuery(() => db.lifts.toArray()) || []
  const [editingRM, setEditingRM] = useState(false)
  const [rmInput, setRmInput] = useState('')

  const selectedType = hingeConfig?.type || null
  const selectedMode = hingeConfig?.mode || 'each-day'
  const hingeLiftId = hingeConfig?.liftId || null
  const replacedLiftId = hingeConfig?.replacedLiftId || null
  const hingeLift = hingeLiftId ? allLifts.find((l) => l.id === hingeLiftId) : null

  const needsReplacement = selectedMode === 'day3-3sets' || selectedMode === 'day3-1set'

  async function selectHingeType(type) {
    if (!type) {
      if (hingeLiftId && liftIds.includes(hingeLiftId)) {
        onLiftIdsChange(liftIds.filter((id) => id !== hingeLiftId))
      }
      onHingeChange(null)
      return
    }

    const name = HINGE_NAMES[type]
    const existing = allLifts.find((l) => l.name.toLowerCase() === name.toLowerCase())
    const id = existing ? existing.id : await db.lifts.add({ name, oneRepMax: 135, notes: '' })

    let newLiftIds = liftIds.filter((lid) => lid !== hingeLiftId)
    if (!newLiftIds.includes(id)) newLiftIds = [...newLiftIds, id]

    onLiftIdsChange(newLiftIds)
    onHingeChange({ type, liftId: id, mode: selectedMode, replacedLiftId: null })
  }

  function selectMode(mode) {
    const needsReplace = mode === 'day3-3sets' || mode === 'day3-1set'
    onHingeChange({
      ...hingeConfig,
      mode,
      replacedLiftId: needsReplace ? replacedLiftId : null,
    })
  }

  function selectReplacedLift(liftId) {
    onHingeChange({ ...hingeConfig, replacedLiftId: liftId ? Number(liftId) : null })
  }

  async function saveRM() {
    const rm = parseInt(rmInput, 10)
    if (!rm || !hingeLiftId) return
    await db.lifts.update(hingeLiftId, { oneRepMax: rm })
    setEditingRM(false)
    setRmInput('')
  }

  const availableModes = sessionsPerWeek >= 3
    ? MODE_OPTIONS
    : MODE_OPTIONS.filter((m) => m.value === 'each-day')

  // Cluster lifts that could be replaced (exclude the hinge lift itself)
  const replaceableLift = clusterLifts.filter((l) => l.id !== hingeLiftId)

  return (
    <div className="space-y-3">
      {/* Hinge type selection */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5">Select lift</label>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => selectHingeType(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              !selectedType
                ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-800 dark:border-gray-100'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
            }`}
          >
            None
          </button>
          {HINGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => selectHingeType(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedType === opt.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {selectedType && (
        <>
          {/* Scheduling mode */}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5">Schedule</label>
            <div className="space-y-1.5">
              {availableModes.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectMode(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors ${
                    selectedMode === opt.value
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 font-medium'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {sessionsPerWeek < 3 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                3rd-day modes require 3+ sessions/week.
              </p>
            )}
          </div>

          {/* Replaced lift picker — only for day3 modes */}
          {needsReplacement && (
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1.5">
                Replaces on 3rd day
              </label>
              {replaceableLift.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Add cluster lifts first.
                </p>
              ) : (
                <select
                  value={replacedLiftId || ''}
                  onChange={(e) => selectReplacedLift(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  <option value="">— pick a lift —</option>
                  {replaceableLift.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* 1RM */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">1RM</span>
            {editingRM ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={rmInput}
                  onChange={(e) => setRmInput(e.target.value)}
                  placeholder={String(hingeLift?.oneRepMax || 135)}
                  className="w-20 text-xs border border-gray-300 dark:border-gray-500 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveRM()}
                />
                <button onClick={saveRM} className="text-xs text-blue-500 font-medium">Save</button>
                <button
                  onClick={() => { setEditingRM(false); setRmInput('') }}
                  className="text-xs text-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingRM(true); setRmInput(String(hingeLift?.oneRepMax || '')) }}
                className="text-xs text-gray-700 dark:text-gray-200 font-medium"
              >
                {hingeLift?.oneRepMax || '—'} lbs{' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal">edit</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
