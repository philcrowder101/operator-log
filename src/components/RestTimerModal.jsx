import { useState, useEffect, useRef } from 'react'

export default function RestTimerModal({ minutes, onClose }) {
  const totalSeconds = minutes * 60
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [running, setRunning] = useState(true)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => s - 1)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, secondsLeft])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const display = `${mins}:${secs.toString().padStart(2, '0')}`
  const progress = secondsLeft / totalSeconds

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-72 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Rest Timer
        </div>

        {/* Circular progress */}
        <div className="relative mx-auto w-40 h-40 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor"
              className="text-gray-200 dark:text-gray-700" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor"
              className={secondsLeft === 0 ? 'text-green-500' : 'text-blue-500'}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-4xl font-mono font-bold ${secondsLeft === 0 ? 'text-green-500' : 'text-gray-800 dark:text-white'}`}>
              {secondsLeft === 0 ? 'GO!' : display}
            </span>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setRunning((r) => !r)}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium text-sm"
          >
            {running ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => { setSecondsLeft(totalSeconds); setRunning(true) }}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
