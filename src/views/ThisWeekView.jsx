import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useWeekPlan } from '../hooks/useWeekPlan'
import { TB_TEMPLATES } from '../data/tbTemplates'
import DayCard from '../components/DayCard'

const todayStr = new Date().toISOString().split('T')[0]

function cycleHasStarted(cycle) {
  return cycle.startDate <= todayStr
}

/** How many calendar weeks from now until the cycle's start week */
function weeksUntilCycle(cycle) {
  const getMonday = (d) => {
    const dt = new Date(d + 'T00:00:00')
    const day = dt.getDay()
    dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1))
    return dt
  }
  const nowMonday = getMonday(todayStr)
  const startMonday = getMonday(cycle.startDate)
  return Math.round((startMonday - nowMonday) / (7 * 24 * 60 * 60 * 1000))
}

export default function ThisWeekView() {
  const allCycles = useLiveQuery(() => db.cycles.toArray()) || []
  const [weekOffset, setWeekOffset] = useState(0)
  const [manualCycleId, setManualCycleId] = useState(null)

  function selectCycle(id) {
    const c = allCycles.find((x) => x.id === id)
    setManualCycleId(id)
    setWeekOffset(c && !cycleHasStarted(c) ? weeksUntilCycle(c) : 0)
  }

  // Auto-pick the most recently started cycle for this week
  const startedCycles = allCycles.filter(cycleHasStarted)
  const upcomingCycles = allCycles.filter((c) => !cycleHasStarted(c))

  const autoCycle = startedCycles.length > 0
    ? startedCycles.reduce((a, b) => (a.startDate >= b.startDate ? a : b))
    : null

  const selectedCycleId = manualCycleId ?? autoCycle?.id ?? null
  const cycle = allCycles.find((c) => c.id === selectedCycleId) ?? null

  const plan = useWeekPlan(cycle, weekOffset)
  const template = cycle ? TB_TEMPLATES.find((t) => t.id === cycle.templateId) : null
  const waveWeekNumber = plan?.[0]?.waveWeek?.week ?? '—'

  const monday = plan?.[0]?.date
  const sunday = plan?.[6]?.date
  const dateRangeLabel = monday && sunday
    ? `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : ''

  // No cycles at all
  if (allCycles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-gray-400 dark:text-gray-500">
        <div className="text-lg font-medium text-gray-600 dark:text-gray-300">No cycles yet</div>
        <div className="text-sm">Create a cycle in Settings to get started.</div>
      </div>
    )
  }

  // No started cycles — show upcoming list
  if (!cycle) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <h1 className="font-bold text-xl text-gray-800 dark:text-white">This Week</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
          {upcomingCycles.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Upcoming
              </div>
              <div className="space-y-2">
                {upcomingCycles
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((c) => (
                    <CycleRow key={c.id} cycle={c} onSelect={() => selectCycle(c.id)} />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">

        {/* Cycle selector — shown when multiple cycles exist */}
        {allCycles.length > 1 && (
          <div className="mb-3">
            <select
              value={selectedCycleId ?? ''}
              onChange={(e) => selectCycle(Number(e.target.value))}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              {startedCycles.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {upcomingCycles.length > 0 && (
                <optgroup label="Upcoming">
                  {upcomingCycles
                    .sort((a, b) => a.startDate.localeCompare(b.startDate))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name} (starts {c.startDate})</option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xl"
          >
            ‹
          </button>
          <div className="text-center">
            <div className="font-bold text-gray-800 dark:text-white">
              Wave Week {waveWeekNumber} — {template?.name || cycle.templateId}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {dateRangeLabel}
            </div>
            {!cycleHasStarted(cycle) && (
              <div className="text-xs text-orange-500 dark:text-orange-400 mt-0.5 font-medium">
                Starts {cycle.startDate}
              </div>
            )}
          </div>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xl"
          >
            ›
          </button>
        </div>

        {weekOffset !== 0 && (
          <div className="text-center mt-2">
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-blue-500 dark:text-blue-400 font-medium"
            >
              Back to current week
            </button>
          </div>
        )}
      </div>

      {/* Day cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24">
        {plan ? (
          plan.map((day, i) => <DayCard key={i} day={day} />)
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">Loading...</div>
        )}
      </div>
    </div>
  )
}

function CycleRow({ cycle, onSelect }) {
  const template = TB_TEMPLATES.find((t) => t.id === cycle.templateId)
  return (
    <button
      onClick={onSelect}
      className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      <div className="font-medium text-sm text-gray-800 dark:text-white">{cycle.name}</div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {template?.name || cycle.templateId} · Starts {cycle.startDate}
      </div>
    </button>
  )
}
