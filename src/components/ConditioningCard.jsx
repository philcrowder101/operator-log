export default function ConditioningCard({ conditioning }) {
  const { sessionType, details } = conditioning

  const typeBadgeClass = {
    SE: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    Endurance: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    HIC: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  }[sessionType] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeBadgeClass}`}>
          {sessionType}
        </span>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Conditioning</span>
      </div>

      {sessionType === 'SE' && (
        <div className="space-y-1">
          {(details.exercises || []).map((ex, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">{ex.name}</span>
              <span className="text-gray-500 dark:text-gray-400">{ex.circuits} × {ex.reps} reps</span>
            </div>
          ))}
          {details.restBetweenCircuits && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Rest: {details.restBetweenCircuits}
            </div>
          )}
        </div>
      )}

      {sessionType === 'Endurance' && (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-300">{details.activity}</span>
            <span className="text-gray-500 dark:text-gray-400">{details.duration}</span>
          </div>
          {details.distance && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{details.distance}</div>
          )}
        </div>
      )}

      {sessionType === 'HIC' && (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-300">Work / Rest</span>
            <span className="text-gray-500 dark:text-gray-400">
              {details.workInterval} / {details.restInterval}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 dark:text-gray-300">Rounds</span>
            <span className="text-gray-500 dark:text-gray-400">{details.rounds}</span>
          </div>
          {details.exercise && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{details.exercise}</div>
          )}
        </div>
      )}
    </div>
  )
}
