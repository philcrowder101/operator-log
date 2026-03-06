import LiftCard from '../components/LiftCard'
import OneRMHistoryChart from '../components/OneRMHistoryChart'

export default function LiftDetailView({ lift, onBack }) {
  if (!lift) return null

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ←
          </button>
          <h1 className="font-bold text-xl text-gray-800 dark:text-white">{lift.name}</h1>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-24">
        <LiftCard lift={lift} />
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <OneRMHistoryChart liftId={lift.id} liftName={lift.name} />
        </div>
      </div>
    </div>
  )
}
