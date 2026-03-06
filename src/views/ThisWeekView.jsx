import { useState } from 'react'
import { useActiveCycle } from '../hooks/useActiveCycle'
import { useWeekPlan } from '../hooks/useWeekPlan'
import { TB_TEMPLATES } from '../data/tbTemplates'
import DayCard from '../components/DayCard'

export default function ThisWeekView() {
  const { cycle } = useActiveCycle()
  const [weekOffset, setWeekOffset] = useState(0)
  const plan = useWeekPlan(cycle, weekOffset)

  if (!cycle) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <div className="text-lg font-medium mb-2">No active cycle</div>
        <div className="text-sm">Set up a cycle in Settings.</div>
      </div>
    )
  }

  const template = TB_TEMPLATES.find((t) => t.id === cycle.templateId)

  // Current wave week for header display
  const waveWeekNumber = plan?.[0]?.waveWeek?.week ?? '—'

  // Week date range label
  const monday = plan?.[0]?.date
  const sunday = plan?.[6]?.date
  const dateRangeLabel = monday && sunday
    ? `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : ''

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ‹
          </button>
          <div className="text-center">
            <div className="font-bold text-gray-800 dark:text-white">
              Wave Week {waveWeekNumber} — {template?.name || cycle.templateId}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {dateRangeLabel}
              {weekOffset === 0 ? '' : weekOffset > 0 ? ` (+${weekOffset})` : ` (${weekOffset})`}
            </div>
          </div>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
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
