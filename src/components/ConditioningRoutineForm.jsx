import { useState } from 'react'

const DEFAULT_SE = { exercises: [{ name: '', circuits: 3, reps: 10 }], restBetweenCircuits: '2 min' }
const DEFAULT_ENDURANCE = { activity: 'Run', duration: '30 min', distance: '' }
const DEFAULT_HIC = { exercise: '', workInterval: '20s', restInterval: '40s', rounds: 8 }

export default function ConditioningRoutineForm({ routine, onSave, onCancel }) {
  const [name, setName] = useState(routine?.name || '')
  const [sessionType, setSessionType] = useState(routine?.sessionType || 'SE')
  const [details, setDetails] = useState(routine?.details ? { ...routine.details } : { ...DEFAULT_SE })

  function changeType(type) {
    const defaults = type === 'SE' ? DEFAULT_SE : type === 'Endurance' ? DEFAULT_ENDURANCE : DEFAULT_HIC
    setSessionType(type)
    setDetails({ ...defaults })
  }

  function save() {
    if (!name.trim()) return
    onSave({ ...routine, name: name.trim(), sessionType, details })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            {routine ? 'Edit Routine' : 'New Routine'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 text-lg">✕</button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Routine Name</label>
          <input
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            placeholder="e.g. Long Run, KB Swing Circuit"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Type picker */}
        <div className="flex gap-2 mb-4">
          {['SE', 'HIC', 'Endurance'].map((t) => (
            <button
              key={t}
              onClick={() => changeType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                sessionType === t
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* SE fields */}
        {sessionType === 'SE' && (
          <div className="space-y-3">
            {(details.exercises || []).map((ex, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <input
                  className="col-span-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="Exercise"
                  value={ex.name}
                  onChange={(e) => {
                    const exs = [...details.exercises]
                    exs[i] = { ...exs[i], name: e.target.value }
                    setDetails({ ...details, exercises: exs })
                  }}
                />
                <input
                  type="number"
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="Circuits"
                  value={ex.circuits}
                  onChange={(e) => {
                    const exs = [...details.exercises]
                    exs[i] = { ...exs[i], circuits: Number(e.target.value) }
                    setDetails({ ...details, exercises: exs })
                  }}
                />
                <input
                  type="number"
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="Reps"
                  value={ex.reps}
                  onChange={(e) => {
                    const exs = [...details.exercises]
                    exs[i] = { ...exs[i], reps: Number(e.target.value) }
                    setDetails({ ...details, exercises: exs })
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => setDetails({ ...details, exercises: [...details.exercises, { name: '', circuits: 3, reps: 10 }] })}
              className="text-sm text-blue-500 dark:text-blue-400"
            >
              + Add exercise
            </button>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Rest between circuits</label>
              <input
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                value={details.restBetweenCircuits || ''}
                onChange={(e) => setDetails({ ...details, restBetweenCircuits: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Endurance fields */}
        {sessionType === 'Endurance' && (
          <div className="space-y-3">
            {[
              ['activity', 'Activity (Run, Bike, Swim...)'],
              ['duration', 'Duration (e.g. 30 min)'],
              ['distance', 'Distance (optional)'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
                <input
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  value={details[field] || ''}
                  onChange={(e) => setDetails({ ...details, [field]: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}

        {/* HIC fields */}
        {sessionType === 'HIC' && (
          <div className="space-y-3">
            {[
              ['exercise', 'Exercise'],
              ['workInterval', 'Work interval (e.g. 20s)'],
              ['restInterval', 'Rest interval (e.g. 40s)'],
              ['rounds', 'Rounds'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
                <input
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  value={details[field] || ''}
                  onChange={(e) => setDetails({ ...details, [field]: e.target.value })}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={save}
            disabled={!name.trim()}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-40"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
