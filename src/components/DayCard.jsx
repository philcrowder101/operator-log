import StrengthSessionCard from './StrengthSessionCard'
import ConditioningCard from './ConditioningCard'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function DayCard({ day }) {
  const { date, dayLabel, sessionLabel, exercises, conditioning, waveWeek } = day

  const isToday = new Date().toDateString() === date.toDateString()
  const hasStrength = sessionLabel !== null && exercises.length > 0
  const hasConditioning = conditioning !== null
  const isRest = !hasStrength && !hasConditioning

  return (
    <div className={`rounded-xl border p-4 ${
      isToday
        ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-base ${
            isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white'
          }`}>
            {dayLabel}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {MONTH_NAMES[date.getMonth()]} {date.getDate()}
          </span>
          {isToday && (
            <span className="text-xs font-medium bg-blue-500 text-white px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>
        {isRest && (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Rest Day</span>
        )}
      </div>

      {hasStrength && (
        <StrengthSessionCard
          sessionLabel={sessionLabel}
          exercises={exercises}
          waveWeek={waveWeek}
        />
      )}

      {hasConditioning && (
        <div className={hasStrength ? 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-700' : ''}>
          <ConditioningCard conditioning={conditioning} />
        </div>
      )}
    </div>
  )
}
