import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function OneRMHistoryChart({ liftId, liftName }) {
  const history = useLiveQuery(
    () => db.liftHistory.where('liftId').equals(liftId).sortBy('date'),
    [liftId]
  )

  if (!history || history.length === 0) {
    return (
      <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
        No history yet. Update your 1RM to start tracking.
      </div>
    )
  }

  const data = history.map((h) => ({
    date: h.date.split('T')[0],
    oneRM: h.oneRepMax,
    tm: h.trainingMax,
  }))

  return (
    <div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        {liftName} — 1RM History
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={(v) => v.slice(5)} // MM-DD
          />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#d1d5db', fontSize: 11 }}
            itemStyle={{ color: '#60a5fa', fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="oneRM"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3b82f6' }}
            name="1RM"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
