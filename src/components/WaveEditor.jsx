export default function WaveEditor({ waveWeeks, onChange, readOnly = false }) {
  function update(weekIdx, field, value) {
    const updated = waveWeeks.map((w, i) =>
      i === weekIdx ? { ...w, [field]: Number(value) } : w
    )
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {waveWeeks.map((w, i) => (
        <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Week {w.week}
          </div>
          {w.strengthOff ? (
            <div className="text-sm text-gray-400 dark:text-gray-500 italic">Conditioning only — no strength</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {['sets', 'reps', 'loadPercent', 'restMinutes'].map((field) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 dark:text-gray-500 block mb-1 capitalize">
                    {field === 'loadPercent' ? 'Load %' : field === 'restMinutes' ? 'Rest (min)' : field}
                  </label>
                  {readOnly ? (
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {w[field]}{field === 'loadPercent' ? '%' : ''}
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={w[field]}
                      onChange={(e) => update(i, field, e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
