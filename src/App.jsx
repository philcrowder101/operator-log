import { useState, useEffect } from 'react'
import { seedIfEmpty } from './db/db'
import ThisWeekView from './views/ThisWeekView'
import LiftsView from './views/LiftsView'
import SettingsView from './views/SettingsView'

const TABS = [
  {
    id: 'week',
    label: 'This Week',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'lifts',
    label: 'Actions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h2m0 0V4m0 2v2M19 6h2m-2 0V4m0 2v2M7 6h10M7 18h10m-8-6h6M5 18H3m0 0v2m0-2v-2m18 2v2m0-2v-2" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('week')
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    seedIfEmpty().then(() => setSeeded(true))
  }, [])

  if (!seeded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-400 dark:text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'week' && <ThisWeekView />}
        {activeTab === 'lifts' && <LiftsView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>

      {/* Bottom tab bar */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center pt-2 pb-safe-or-3 gap-0.5 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {tab.icon}
              <span className="text-xs font-medium pb-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
