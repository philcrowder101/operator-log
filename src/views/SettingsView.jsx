import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useActiveCycle } from '../hooks/useActiveCycle'
import { TB_TEMPLATES } from '../data/tbTemplates'
import WaveEditor from '../components/WaveEditor'
import LiftClusterEditor from '../components/LiftClusterEditor'
import ConditioningDayEditor from '../components/ConditioningDayEditor'

export default function SettingsView() {
  const { cycleId } = useActiveCycle()
  const allCycles = useLiveQuery(() => db.cycles.toArray()) || []
  const [creating, setCreating] = useState(false)
  const [newCycleName, setNewCycleName] = useState('')
  const [newTemplateId, setNewTemplateId] = useState('operator')
  const [newStartDate, setNewStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [expandedCycleId, setExpandedCycleId] = useState(null)
  const [expandedSubSection, setExpandedSubSection] = useState(null)

  async function setActiveCycle(id) {
    await db.appState.put({ key: 'activeCycleId', value: id })
  }

  async function createCycle() {
    const name = newCycleName.trim() || `Cycle ${allCycles.length + 1}`
    const id = await db.cycles.add({
      templateId: newTemplateId,
      name,
      startDate: newStartDate,
      currentWeekOffset: 0,
      totalWeeks: 12,
      liftIds: [],
      liftSessionMap: {},
      conditioningDays: [],
      status: 'active',
    })
    await setActiveCycle(id)
    setCreating(false)
    setNewCycleName('')
    setNewStartDate(new Date().toISOString().split('T')[0])
    setExpandedCycleId(id)
    setExpandedSubSection('lifts')
  }

  async function deleteCycle(id) {
    await db.cycles.delete(id)
    if (id === cycleId) {
      const remaining = await db.cycles.toArray()
      await db.appState.put({ key: 'activeCycleId', value: remaining[0]?.id ?? null })
    }
    if (id === expandedCycleId) setExpandedCycleId(null)
  }

  async function updateCycle(id, changes) {
    await db.cycles.update(id, changes)
  }

  function toggleCycle(id) {
    if (expandedCycleId === id) {
      setExpandedCycleId(null)
      setExpandedSubSection(null)
    } else {
      setExpandedCycleId(id)
      setExpandedSubSection(null)
    }
  }

  function toggleSub(name) {
    setExpandedSubSection(expandedSubSection === name ? null : name)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h1 className="font-bold text-xl text-gray-800 dark:text-white">Settings</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-24">

        {allCycles.length === 0 && !creating && (
          <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
            No cycles yet. Create one below.
          </div>
        )}

        {allCycles.map((cycle) => {
          const template = TB_TEMPLATES.find((t) => t.id === cycle.templateId)
          const isActive = cycle.id === cycleId
          const isExpanded = expandedCycleId === cycle.id
          const totalWaveWeeks = template?.waveWeeks.length || 3
          const weeksSinceStart = Math.floor(
            (Date.now() - new Date(cycle.startDate).setHours(0, 0, 0, 0)) / (7 * 24 * 60 * 60 * 1000)
          )
          const currentWaveWeek =
            ((weeksSinceStart + (cycle.currentWeekOffset || 0)) % totalWaveWeeks + totalWaveWeeks) %
              totalWaveWeeks + 1

          return (
            <div
              key={cycle.id}
              className={`rounded-xl border overflow-hidden transition-colors ${
                isActive
                  ? 'border-blue-400 dark:border-blue-500'
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-800`}
            >
              {/* Cycle header row */}
              <div className="flex items-center">
                <button
                  onClick={() => toggleCycle(cycle.id)}
                  className="flex-1 text-left px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-800 dark:text-white">
                      {cycle.name}
                    </span>
                    {isActive && (
                      <span className="text-xs font-medium bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {template?.name || cycle.templateId} · Starts {cycle.startDate}
                  </div>
                </button>
                <div className="flex items-center pr-2 gap-1">
                  {!isActive && (
                    <button
                      onClick={() => setActiveCycle(cycle.id)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm(`Delete "${cycle.name}"?`)) deleteCycle(cycle.id) }}
                    className="px-3 py-1.5 text-red-400 hover:text-red-600 text-base"
                    title="Delete cycle"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Expanded cycle settings */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">

                  {/* Start Date */}
                  <SubSection title="Start Date" expanded={expandedSubSection === 'startDate'} onToggle={() => toggleSub('startDate')}>
                    <input
                      type="date"
                      value={cycle.startDate}
                      onChange={(e) => updateCycle(cycle.id, { startDate: e.target.value, currentWeekOffset: 0 })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    />
                  </SubSection>

                  {/* Template & Wave */}
                  <SubSection title="Template & Wave" expanded={expandedSubSection === 'wave'} onToggle={() => toggleSub('wave')}>
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Template</label>
                      <select
                        value={cycle.templateId}
                        onChange={(e) => updateCycle(cycle.id, { templateId: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      >
                        {TB_TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.sessionsPerWeek}x/week)</option>
                        ))}
                      </select>
                    </div>
                    {template && <WaveEditor waveWeeks={template.waveWeeks} onChange={() => {}} readOnly />}
                  </SubSection>

                  {/* Wave Week */}
                  <SubSection title="Wave Week" expanded={expandedSubSection === 'waveWeek'} onToggle={() => toggleSub('waveWeek')}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Currently on{' '}
                        <span className="font-bold text-gray-800 dark:text-white text-base">
                          Wave Week {currentWaveWeek}
                        </span>{' '}
                        of {totalWaveWeeks}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateCycle(cycle.id, { currentWeekOffset: (cycle.currentWeekOffset || 0) - 1 })}
                          className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xl font-bold"
                        >
                          −
                        </button>
                        <button
                          onClick={() => updateCycle(cycle.id, { currentWeekOffset: (cycle.currentWeekOffset || 0) + 1 })}
                          className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xl font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Use + / − to correct which wave week is shown if the auto-calculated week is off.
                    </div>
                  </SubSection>

                  {/* Lift Cluster */}
                  <SubSection title="Lift Cluster" expanded={expandedSubSection === 'lifts'} onToggle={() => toggleSub('lifts')}>
                    <LiftClusterEditor
                      liftIds={cycle.liftIds || []}
                      onChange={(liftIds) => updateCycle(cycle.id, { liftIds })}
                    />
                  </SubSection>

                  {/* Conditioning Days */}
                  <SubSection title="Conditioning Days" expanded={expandedSubSection === 'conditioning'} onToggle={() => toggleSub('conditioning')}>
                    <ConditioningDayEditor
                      conditioningDays={cycle.conditioningDays || []}
                      onChange={(conditioningDays) => updateCycle(cycle.id, { conditioningDays })}
                    />
                  </SubSection>

                </div>
              )}
            </div>
          )
        })}

        {/* New cycle form */}
        {creating ? (
          <div className="space-y-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="font-semibold text-sm text-gray-800 dark:text-white mb-3">New Cycle</div>
            <input
              type="text"
              placeholder="Cycle name"
              value={newCycleName}
              onChange={(e) => setNewCycleName(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              autoFocus
            />
            <select
              value={newTemplateId}
              onChange={(e) => setNewTemplateId(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {TB_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.sessionsPerWeek}x/week)</option>
              ))}
            </select>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Start date</label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={createCycle} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
                Create
              </button>
              <button onClick={() => setCreating(false)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium"
          >
            + New Cycle
          </button>
        )}
      </div>
    </div>
  )
}

function SubSection({ title, children, onToggle, expanded }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</span>
        <span className="text-gray-400 dark:text-gray-500 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}
