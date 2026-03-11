import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TYPE_COLORS = {
  SE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  HIC: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  Endurance: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
}

export default function ConditioningScheduleEditor({ cycle, totalWaveWeeks, onChange }) {
  const schedule = cycle.conditioningSchedule || []
  const routines = useLiveQuery(() => db.conditioningRoutines.toArray()) || []
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [assigningDay, setAssigningDay] = useState(null) // dayOfWeek or null

  function assignRoutine(routineId) {
    const updated = schedule.filter(
      (e) => !(e.weekNumber === selectedWeek && e.dayOfWeek === assigningDay)
    )
    onChange([...updated, { weekNumber: selectedWeek, dayOfWeek: assigningDay, routineId }])
    setAssigningDay(null)
  }

  function removeAssignment(dayOfWeek) {
    onChange(schedule.filter((e) => !(e.weekNumber === selectedWeek && e.dayOfWeek === dayOfWeek)))
  }

  const weekNums = Array.from({ length: totalWaveWeeks }, (_, i) => i + 1)

  return (
    <div>
      {/* Week picker */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {weekNums.map((w) => (
          <button
            key={w}
            onClick={() => setSelectedWeek(w)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedWeek === w
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Wk {w}
          </button>
        ))}
      </div>

      {/* Day rows */}
      <div className="space-y-0">
        {DAY_NAMES.map((name, dow) => {
          const entry = schedule.find(
            (e) => e.weekNumber === selectedWeek && e.dayOfWeek === dow
          )
          const routine = entry ? routines.find((r) => r.id === entry.routineId) : null

          return (
            <div
              key={dow}
              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-10 flex-shrink-0">
                {name}
              </span>

              {routine ? (
                <div className="flex items-center gap-2 flex-1 mx-3 min-w-0">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[routine.sessionType] || ''}`}
                  >
                    {routine.sessionType}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{routine.name}</span>
                </div>
              ) : (
                <div className="flex-1 mx-3 text-xs text-gray-300 dark:text-gray-600">—</div>
              )}

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setAssigningDay(dow)}
                  className="text-xs text-blue-500 dark:text-blue-400 font-medium"
                >
                  {routine ? 'Change' : '+ Assign'}
                </button>
                {routine && (
                  <button
                    onClick={() => removeAssignment(dow)}
                    className="text-xs text-red-400 font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Routine picker modal */}
      {assigningDay !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full max-w-lg p-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {DAY_NAMES[assigningDay]}, Week {selectedWeek}
              </h3>
              <button onClick={() => setAssigningDay(null)} className="text-gray-400 text-lg">✕</button>
            </div>

            {routines.length === 0 ? (
              <div className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                No routines in library yet. Add some in the Conditioning Library section above.
              </div>
            ) : (
              <div className="space-y-4">
                {['SE', 'HIC', 'Endurance'].map((type) => {
                  const group = routines.filter((r) => r.sessionType === type)
                  if (group.length === 0) return null
                  return (
                    <div key={type}>
                      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                        {type}
                      </div>
                      <div className="space-y-1">
                        {group.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => assignRoutine(r.id)}
                            className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TYPE_COLORS[type] || ''}`}
                            >
                              {type}
                            </span>
                            <span className="text-sm text-gray-800 dark:text-white">{r.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
