import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useActiveCycle } from '../hooks/useActiveCycle'
import { TB_TEMPLATES } from '../data/tbTemplates'
import WaveEditor from '../components/WaveEditor'
import LiftClusterEditor from '../components/LiftClusterEditor'
import ConditioningDayEditor from '../components/ConditioningDayEditor'

export default function SettingsView() {
  const { cycle, cycleId } = useActiveCycle()
  const allCycles = useLiveQuery(() => db.cycles.toArray()) || []
  const [creating, setCreating] = useState(false)
  const [newCycleName, setNewCycleName] = useState('')
  const [newTemplateId, setNewTemplateId] = useState('operator')
  const [expandedSection, setExpandedSection] = useState(null)

  async function setActiveCycle(id) {
    await db.appState.put({ key: 'activeCycleId', value: id })
  }

  async function createCycle() {
    const name = newCycleName.trim() || `Cycle ${allCycles.length + 1}`
    const template = TB_TEMPLATES.find((t) => t.id === newTemplateId)
    const today = new Date().toISOString().split('T')[0]
    const id = await db.cycles.add({
      templateId: newTemplateId,
      name,
      startDate: today,
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
  }

  async function updateCycle(changes) {
    if (!cycleId) return
    await db.cycles.update(cycleId, changes)
  }

  function toggleSection(name) {
    setExpandedSection(expandedSection === name ? null : name)
  }

  const template = cycle ? TB_TEMPLATES.find((t) => t.id === cycle.templateId) : null

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h1 className="font-bold text-xl text-gray-800 dark:text-white">Settings</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-24">

        {/* Cycle selector */}
        <Section title="Active Cycle" onToggle={() => toggleSection('cycle')} expanded={expandedSection === 'cycle'}>
          <div className="space-y-2">
            {allCycles.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCycle(c.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  c.id === cycleId
                    ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="font-medium text-sm text-gray-800 dark:text-white">{c.name}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {TB_TEMPLATES.find((t) => t.id === c.templateId)?.name || c.templateId} · Started {c.startDate}
                </div>
              </button>
            ))}

            {creating ? (
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <input
                  type="text"
                  placeholder="Cycle name"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <select
                  value={newTemplateId}
                  onChange={(e) => setNewTemplateId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  {TB_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
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
        </Section>

        {cycle && (
          <>
            {/* Template / wave */}
            <Section title="Template & Wave" onToggle={() => toggleSection('wave')} expanded={expandedSection === 'wave'}>
              <div className="mb-3">
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Template</label>
                <select
                  value={cycle.templateId}
                  onChange={(e) => updateCycle({ templateId: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  {TB_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.sessionsPerWeek}x/week)</option>
                  ))}
                </select>
              </div>
              {template && (
                <WaveEditor waveWeeks={template.waveWeeks} onChange={() => {}} readOnly />
              )}
            </Section>

            {/* Week adjuster */}
            <Section title="Current Week" onToggle={() => toggleSection('week')} expanded={expandedSection === 'week'}>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Week offset: <span className="font-semibold">{cycle.currentWeekOffset || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateCycle({ currentWeekOffset: (cycle.currentWeekOffset || 0) - 1 })}
                    className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-lg font-bold"
                  >
                    −
                  </button>
                  <button
                    onClick={() => updateCycle({ currentWeekOffset: (cycle.currentWeekOffset || 0) + 1 })}
                    className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Adjusts which wave week is displayed relative to start date.
              </div>
            </Section>

            {/* Lift cluster */}
            <Section title="Lift Cluster" onToggle={() => toggleSection('lifts')} expanded={expandedSection === 'lifts'}>
              <LiftClusterEditor
                liftIds={cycle.liftIds || []}
                onChange={(liftIds) => updateCycle({ liftIds })}
              />
            </Section>

            {/* Conditioning */}
            <Section title="Conditioning Days" onToggle={() => toggleSection('conditioning')} expanded={expandedSection === 'conditioning'}>
              <ConditioningDayEditor
                conditioningDays={cycle.conditioningDays || []}
                onChange={(conditioningDays) => updateCycle({ conditioningDays })}
              />
            </Section>
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, children, onToggle, expanded }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <span className="font-semibold text-sm text-gray-800 dark:text-white">{title}</span>
        <span className="text-gray-400 dark:text-gray-500 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}
