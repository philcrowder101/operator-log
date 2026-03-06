import { useState } from 'react'
import RestTimerModal from './RestTimerModal'

export default function StrengthSessionCard({ sessionLabel, exercises, waveWeek }) {
  const [timerOpen, setTimerOpen] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState(3)

  function openTimer(minutes) {
    setTimerMinutes(minutes)
    setTimerOpen(true)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Session {sessionLabel} — Strength
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Week {(waveWeek?.week) || '—'}
        </span>
      </div>

      {exercises.map((ex) => (
        <div
          key={ex.id}
          className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <div>
            <div className="font-medium text-gray-800 dark:text-white text-sm">{ex.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {ex.sets}×{ex.reps} @ {ex.loadPercent}%
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-800 dark:text-white">
              {ex.weightLbs} lbs
            </span>
            <button
              onClick={() => openTimer(ex.restMinutes)}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium"
              title="Start rest timer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {ex.restMinutes}m
            </button>
          </div>
        </div>
      ))}

      {timerOpen && (
        <RestTimerModal minutes={timerMinutes} onClose={() => setTimerOpen(false)} />
      )}
    </div>
  )
}
