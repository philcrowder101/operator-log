import { useState } from 'react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const DEFAULT_SE = {
  exercises: [{ name: '', circuits: 3, reps: 10 }],
  restBetweenCircuits: '2 min',
}
const DEFAULT_ENDURANCE = { activity: 'Run', duration: '30 min', distance: '' }
const DEFAULT_HIC = { exercise: '', workInterval: '20s', restInterval: '40s', rounds: 8 }

export default function ConditioningDayEditor({ conditioningDays, onChange }) {
  const [editingDay, setEditingDay] = useState(null) // dayOfWeek number or null
  const [editState, setEditState] = useState(null)

  function startEdit(dayOfWeek) {
    const existing = conditioningDays.find((c) => c.dayOfWeek === dayOfWeek)
    setEditingDay(dayOfWeek)
    setEditState(existing ? { ...existing } : { dayOfWeek, sessionType: 'SE', details: { ...DEFAULT_SE } })
  }

  function saveEdit() {
    const updated = conditioningDays.filter((c) => c.dayOfWeek !== editingDay)
    onChange([...updated, editState])
    setEditingDay(null)
  }

  function removeDay(dayOfWeek) {
    onChange(conditioningDays.filter((c) => c.dayOfWeek !== dayOfWeek))
  }

  function changeType(type) {
    const defaults = type === 'SE' ? DEFAULT_SE : type === 'Endurance' ? DEFAULT_ENDURANCE : DEFAULT_HIC
    setEditState({ ...editState, sessionType: type, details: { ...defaults } })
  }

  return (
    <div className="space-y-2">
      {DAY_NAMES.map((name, dow) => {
        const existing = conditioningDays.find((c) => c.dayOfWeek === dow)
        return (
          <div key={dow} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-10">{name}</span>
            {existing ? (
              <div className="flex items-center gap-2 flex-1 mx-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                  {existing.sessionType}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-1 truncate">
                  {existing.sessionType === 'SE' && (existing.details.exercises?.[0]?.name || 'Circuit')}
                  {existing.sessionType === 'Endurance' && existing.details.activity}
                  {existing.sessionType === 'HIC' && `${existing.details.rounds} rounds`}
                </span>
              </div>
            ) : (
              <div className="flex-1 mx-3" />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(dow)}
                className="text-xs text-blue-500 dark:text-blue-400 font-medium"
              >
                {existing ? 'Edit' : '+ Add'}
              </button>
              {existing && (
                <button onClick={() => removeDay(dow)} className="text-xs text-red-400">
                  Remove
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Edit modal */}
      {editingDay !== null && editState && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {DAY_NAMES[editingDay]} Conditioning
              </h3>
              <button onClick={() => setEditingDay(null)} className="text-gray-400">✕</button>
            </div>

            {/* Type picker */}
            <div className="flex gap-2 mb-4">
              {['SE', 'Endurance', 'HIC'].map((t) => (
                <button
                  key={t}
                  onClick={() => changeType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    editState.sessionType === t
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* SE fields */}
            {editState.sessionType === 'SE' && (
              <div className="space-y-3">
                {(editState.details.exercises || []).map((ex, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <input
                      className="col-span-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      placeholder="Exercise"
                      value={ex.name}
                      onChange={(e) => {
                        const exs = [...editState.details.exercises]
                        exs[i] = { ...exs[i], name: e.target.value }
                        setEditState({ ...editState, details: { ...editState.details, exercises: exs } })
                      }}
                    />
                    <input
                      type="number"
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      placeholder="Circuits"
                      value={ex.circuits}
                      onChange={(e) => {
                        const exs = [...editState.details.exercises]
                        exs[i] = { ...exs[i], circuits: Number(e.target.value) }
                        setEditState({ ...editState, details: { ...editState.details, exercises: exs } })
                      }}
                    />
                    <input
                      type="number"
                      className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      placeholder="Reps"
                      value={ex.reps}
                      onChange={(e) => {
                        const exs = [...editState.details.exercises]
                        exs[i] = { ...exs[i], reps: Number(e.target.value) }
                        setEditState({ ...editState, details: { ...editState.details, exercises: exs } })
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => setEditState({
                    ...editState,
                    details: { ...editState.details, exercises: [...editState.details.exercises, { name: '', circuits: 3, reps: 10 }] }
                  })}
                  className="text-sm text-blue-500 dark:text-blue-400"
                >
                  + Add exercise
                </button>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Rest between circuits</label>
                  <input
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    value={editState.details.restBetweenCircuits}
                    onChange={(e) => setEditState({ ...editState, details: { ...editState.details, restBetweenCircuits: e.target.value } })}
                  />
                </div>
              </div>
            )}

            {/* Endurance fields */}
            {editState.sessionType === 'Endurance' && (
              <div className="space-y-3">
                {[['activity', 'Activity (Run, Bike, Swim...)'], ['duration', 'Duration (30 min)'], ['distance', 'Distance (optional)']].map(([field, label]) => (
                  <div key={field}>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      value={editState.details[field] || ''}
                      onChange={(e) => setEditState({ ...editState, details: { ...editState.details, [field]: e.target.value } })}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* HIC fields */}
            {editState.sessionType === 'HIC' && (
              <div className="space-y-3">
                {[['exercise', 'Exercise'], ['workInterval', 'Work interval (20s)'], ['restInterval', 'Rest interval (40s)'], ['rounds', 'Rounds']].map(([field, label]) => (
                  <div key={field}>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
                    <input
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      value={editState.details[field] || ''}
                      onChange={(e) => setEditState({ ...editState, details: { ...editState.details, [field]: e.target.value } })}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveEdit}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setEditingDay(null)}
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
