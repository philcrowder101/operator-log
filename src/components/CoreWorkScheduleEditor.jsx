import { useState } from 'react'
import { DAY_NAMES } from '../utils/cycleUtils'
import {
  CORE_WORK_BLOCKS,
  buildDefaultAssignment,
  formatDuration,
  TIMED_SECONDS_MIN,
  TIMED_SECONDS_MAX,
  REST_MINUTES_MIN,
  REST_MINUTES_MAX,
} from '../data/coreWorkBlocks'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function CoreWorkScheduleEditor({ cycle, totalWaveWeeks, onChange }) {
  const schedule = cycle.coreWorkSchedule || []
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [assigningDay, setAssigningDay] = useState(null) // dayOfWeek or null
  const [draft, setDraft] = useState(null)

  const weekNums = Array.from({ length: totalWaveWeeks }, (_, i) => i + 1)
  const draftBlock = draft ? CORE_WORK_BLOCKS.find((b) => b.id === draft.blockId) : null

  function openEditor(dayOfWeek) {
    const existing = schedule.find(
      (e) => e.weekNumber === selectedWeek && e.dayOfWeek === dayOfWeek
    )
    setAssigningDay(dayOfWeek)
    setDraft(
      existing ? { ...existing, movements: existing.movements.map((m) => ({ ...m })) } : null
    )
  }

  function closeEditor() {
    setAssigningDay(null)
    setDraft(null)
  }

  function pickBlock(blockId) {
    setDraft({
      weekNumber: selectedWeek,
      dayOfWeek: assigningDay,
      ...buildDefaultAssignment(blockId),
    })
  }

  function pickChoice(choiceName) {
    const choiceNames = draftBlock.choiceMovements.map((m) => m.name)
    setDraft({
      ...draft,
      movements: draft.movements.map((m) =>
        choiceNames.includes(m.name) ? { ...m, name: choiceName } : m
      ),
    })
  }

  function updateMovement(index, rawValue) {
    setDraft({
      ...draft,
      movements: draft.movements.map((m, i) => {
        if (i !== index) return m
        return m.mode === 'timed' ? { ...m, seconds: rawValue } : { ...m, reps: rawValue }
      }),
    })
  }

  function save() {
    const [minRounds, maxRounds] = draftBlock.roundsRange
    const [minReps, maxReps] = draftBlock.repsRange
    const clean = {
      ...draft,
      rounds: clamp(draft.rounds, minRounds, maxRounds),
      restMinutes: clamp(draft.restMinutes, REST_MINUTES_MIN, REST_MINUTES_MAX),
      movements: draft.movements.map((m) =>
        m.mode === 'timed'
          ? {
              ...m,
              seconds: clamp(Number(m.seconds) || TIMED_SECONDS_MIN, TIMED_SECONDS_MIN, TIMED_SECONDS_MAX),
            }
          : { ...m, reps: clamp(Number(m.reps) || minReps, minReps, maxReps) }
      ),
    }
    const updated = schedule.filter(
      (e) => !(e.weekNumber === selectedWeek && e.dayOfWeek === assigningDay)
    )
    onChange([...updated, clean])
    closeEditor()
  }

  function removeAssignment(dayOfWeek) {
    onChange(
      schedule.filter((e) => !(e.weekNumber === selectedWeek && e.dayOfWeek === dayOfWeek))
    )
  }

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
          const block = entry ? CORE_WORK_BLOCKS.find((b) => b.id === entry.blockId) : null

          return (
            <div
              key={dow}
              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 w-10 flex-shrink-0">
                {name}
              </span>

              {entry ? (
                <div className="flex-1 mx-3 min-w-0">
                  <span className="text-xs text-gray-600 dark:text-gray-300 truncate block">
                    {block?.name || entry.blockId} · {entry.rounds}×
                  </span>
                </div>
              ) : (
                <div className="flex-1 mx-3 text-xs text-gray-300 dark:text-gray-600">—</div>
              )}

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEditor(dow)}
                  className="text-xs text-blue-500 dark:text-blue-400 font-medium"
                >
                  {entry ? 'Change' : '+ Assign'}
                </button>
                {entry && (
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

      {/* Assignment modal */}
      {assigningDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {DAY_NAMES[assigningDay]}, Week {selectedWeek}
              </h3>
              <button onClick={closeEditor} className="text-gray-400 text-lg">✕</button>
            </div>

            {!draft ? (
              /* Step 1: pick a block */
              <div className="space-y-1">
                {CORE_WORK_BLOCKS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => pickBlock(b.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="text-sm text-gray-800 dark:text-white">{b.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {b.fixedMovements.map((m) => m.name).join(', ')}
                      {b.choiceMovements.length > 0 &&
                        ` + ${b.choiceMovements.map((m) => m.name).join(' or ')}`}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* Step 2: configure the assignment */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {draftBlock.name}
                  </span>
                  <button
                    onClick={() => setDraft(null)}
                    className="text-xs text-blue-500 dark:text-blue-400 font-medium"
                  >
                    Change block
                  </button>
                </div>

                {/* Choice movement toggle (AB Triad) */}
                {draftBlock.choiceMovements.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Third movement
                    </label>
                    <div className="flex gap-1.5">
                      {draftBlock.choiceMovements.map((c) => {
                        const active = draft.movements.some((m) => m.name === c.name)
                        return (
                          <button
                            key={c.name}
                            onClick={() => pickChoice(c.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              active
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {c.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Rounds stepper */}
                <Stepper
                  label={`Rounds (${draftBlock.roundsRange[0]}-${draftBlock.roundsRange[1]})`}
                  value={draft.rounds}
                  min={draftBlock.roundsRange[0]}
                  max={draftBlock.roundsRange[1]}
                  onChange={(rounds) => setDraft({ ...draft, rounds })}
                />

                {/* Rest stepper */}
                <Stepper
                  label={`Rest between rounds (${REST_MINUTES_MIN}-${REST_MINUTES_MAX} min)`}
                  value={draft.restMinutes}
                  min={REST_MINUTES_MIN}
                  max={REST_MINUTES_MAX}
                  onChange={(restMinutes) => setDraft({ ...draft, restMinutes })}
                />

                {/* Per-movement prescriptions */}
                <div className="space-y-2">
                  {draft.movements.map((m, i) => (
                    <div key={m.name} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {m.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={m.mode === 'timed' ? m.seconds : m.reps}
                          min={m.mode === 'timed' ? TIMED_SECONDS_MIN : draftBlock.repsRange[0]}
                          max={m.mode === 'timed' ? TIMED_SECONDS_MAX : draftBlock.repsRange[1]}
                          onChange={(e) => updateMovement(i, e.target.value)}
                          className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-right"
                        />
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-10">
                          {m.mode === 'timed' ? 'sec' : 'reps'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {draft.movements.some((m) => m.mode === 'timed') && (
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Timed holds: {TIMED_SECONDS_MIN}s–{formatDuration(TIMED_SECONDS_MAX)}. Values outside the range are clamped on save.
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={save}
                    className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={closeEditor}
                    className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(value - 1, min))}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold"
        >
          −
        </button>
        <span className="text-sm font-semibold text-gray-800 dark:text-white w-6 text-center">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(value + 1, max))}
          className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold"
        >
          +
        </button>
      </div>
    </div>
  )
}
