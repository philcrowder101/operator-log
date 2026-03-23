export const TYPE_COLORS = {
  SE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  HIC: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  Endurance: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
}

export const DEFAULT_SE = {
  exercises: [{ name: '', circuits: 3, reps: 10 }],
  restBetweenCircuits: '2 min',
}

export const DEFAULT_ENDURANCE = { activity: 'Run', duration: '30 min', distance: '' }

export const DEFAULT_HIC = { exercise: '', workInterval: '20s', restInterval: '40s', rounds: 8 }
