import { useState } from 'react'
import { useActiveCycle } from '../hooks/useActiveCycle'
import { useLifts } from '../hooks/useLifts'
import LiftCard from '../components/LiftCard'
import LiftDetailView from './LiftDetailView'

export default function LiftsView() {
  const { cycle } = useActiveCycle()
  const lifts = useLifts(cycle?.liftIds || null)
  const [selectedLiftId, setSelectedLiftId] = useState(null)

  if (selectedLiftId) {
    const lift = lifts.find((l) => l.id === selectedLiftId)
    return (
      <LiftDetailView
        lift={lift}
        onBack={() => setSelectedLiftId(null)}
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h1 className="font-bold text-xl text-gray-800 dark:text-white">Lifts</h1>
        {cycle && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cycle.name}</div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24">
        {lifts.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-12">
            No lifts in this cycle. Add lifts in Settings.
          </div>
        ) : (
          lifts.map((lift) => (
            <LiftCard
              key={lift.id}
              lift={lift}
              onViewHistory={() => setSelectedLiftId(lift.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
