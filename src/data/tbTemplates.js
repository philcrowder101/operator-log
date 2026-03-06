export const TB_TEMPLATES = [
  {
    id: 'operator',
    name: 'Operator',
    isCustom: false,
    sessionsPerWeek: 3,
    sessionLabels: ['A', 'B', 'C'],
    waveWeeks: [
      { week: 1, sets: 5, reps: 5, loadPercent: 80, restMinutes: 3 },
      { week: 2, sets: 5, reps: 4, loadPercent: 85, restMinutes: 3 },
      { week: 3, sets: 5, reps: 3, loadPercent: 90, restMinutes: 4 },
    ],
    // Operator: all lifts every session
    sessionLiftMap: { A: 'all', B: 'all', C: 'all' },
    defaultDays: [1, 3, 5], // Mon, Wed, Fri (0=Sun)
  },
  {
    id: 'zulu',
    name: 'Zulu',
    isCustom: false,
    sessionsPerWeek: 4,
    sessionLabels: ['A', 'B'],
    waveWeeks: [
      { week: 1, sets: 4, reps: 6, loadPercent: 75, restMinutes: 3 },
      { week: 2, sets: 4, reps: 5, loadPercent: 82, restMinutes: 3 },
      { week: 3, sets: 4, reps: 4, loadPercent: 87, restMinutes: 4 },
    ],
    // Zulu A/B alternating — user assigns lifts to A/B in settings
    sessionLiftMap: { A: 'push-squat', B: 'pull-hinge' },
    defaultDays: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
  },
  {
    id: 'operator-6wk',
    name: 'Operator (6-Week)',
    isCustom: false,
    sessionsPerWeek: 3,
    sessionLabels: ['A', 'B', 'C'],
    waveWeeks: [
      { week: 1, sets: 5, reps: 5, loadPercent: 70, restMinutes: 2 },
      { week: 2, sets: 5, reps: 5, loadPercent: 80, restMinutes: 3 },
      { week: 3, sets: 5, reps: 3, loadPercent: 90, restMinutes: 4 },
      { week: 4, sets: 5, reps: 5, loadPercent: 75, restMinutes: 2 },
      { week: 5, sets: 5, reps: 4, loadPercent: 85, restMinutes: 3 },
      { week: 6, sets: 5, reps: 2, loadPercent: 95, restMinutes: 5 },
    ],
    sessionLiftMap: { A: 'all', B: 'all', C: 'all' },
    defaultDays: [1, 3, 5], // Mon, Wed, Fri
  },
  {
    id: 'fighter',
    name: 'Fighter',
    isCustom: false,
    sessionsPerWeek: 2,
    sessionLabels: ['A', 'B'],
    waveWeeks: [
      { week: 1, sets: 3, reps: 5, loadPercent: 80, restMinutes: 3 },
      { week: 2, sets: 3, reps: 4, loadPercent: 87, restMinutes: 4 },
      { week: 3, sets: 3, reps: 3, loadPercent: 92, restMinutes: 5 },
    ],
    sessionLiftMap: { A: 'all', B: 'all' },
    defaultDays: [1, 4], // Mon, Thu
  },
]
