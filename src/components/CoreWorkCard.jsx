import { CORE_WORK_BLOCKS, formatDuration } from '../data/coreWorkBlocks'

export default function CoreWorkCard({ coreWork }) {
  const blockName =
    CORE_WORK_BLOCKS.find((b) => b.id === coreWork.blockId)?.name || coreWork.blockId

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
          Core
        </span>
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{blockName}</span>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        {coreWork.rounds} {coreWork.rounds === 1 ? 'round' : 'rounds'} · {coreWork.restMinutes} min rest
      </div>

      <div className="space-y-1">
        {coreWork.movements.map((m, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">{m.name}</span>
            <span className="text-gray-500 dark:text-gray-400">
              {m.mode === 'timed' ? formatDuration(m.seconds) : `${m.reps} reps`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
