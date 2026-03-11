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
  {
    id: 'fighter-6wk',
    name: 'Fighter (6-Week)',
    isCustom: false,
    sessionsPerWeek: 2,
    sessionLabels: ['A', 'B'],
    waveWeeks: [
      { week: 1, sets: 3, reps: 5, loadPercent: 70, restMinutes: 2 },
      { week: 2, sets: 3, reps: 5, loadPercent: 80, restMinutes: 3 },
      { week: 3, sets: 3, reps: 3, loadPercent: 90, restMinutes: 4 },
      { week: 4, sets: 3, reps: 5, loadPercent: 75, restMinutes: 2 },
      { week: 5, sets: 3, reps: 4, loadPercent: 85, restMinutes: 3 },
      { week: 6, sets: 3, reps: 2, loadPercent: 95, restMinutes: 5 },
    ],
    sessionLiftMap: { A: 'all', B: 'all' },
    defaultDays: [1, 4], // Mon, Thu
  },
  {
    id: 'zulu-6wk',
    name: 'Zulu (6-Week)',
    isCustom: false,
    sessionsPerWeek: 4,
    sessionLabels: ['A', 'B'],
    waveWeeks: [
      { week: 1, sets: 4, reps: 5, loadPercent: 70, restMinutes: 2 },
      { week: 2, sets: 4, reps: 5, loadPercent: 80, restMinutes: 3 },
      { week: 3, sets: 4, reps: 3, loadPercent: 90, restMinutes: 4 },
      { week: 4, sets: 4, reps: 5, loadPercent: 75, restMinutes: 2 },
      { week: 5, sets: 4, reps: 4, loadPercent: 85, restMinutes: 3 },
      { week: 6, sets: 4, reps: 2, loadPercent: 95, restMinutes: 5 },
    ],
    sessionLiftMap: { A: 'push-squat', B: 'pull-hinge' },
    defaultDays: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
  },
  // TB II Base Build: 8-week block, Fighter 2x/week
  // Weeks 1-5: conditioning only (no strength). Fighter wave weeks 6-8.
  {
    id: 'bb-fighter-finish',
    name: 'Base Build / Fighter Finish',
    isCustom: false,
    sessionsPerWeek: 2,
    sessionLabels: ['A', 'B'],
    waveWeeks: [
      { week: 1, strengthOff: true },
      { week: 2, strengthOff: true },
      { week: 3, strengthOff: true },
      { week: 4, strengthOff: true },
      { week: 5, strengthOff: true },
      { week: 6, sets: 3, reps: 5, loadPercent: 80, restMinutes: 3 }, // Fighter wk 1
      { week: 7, sets: 3, reps: 4, loadPercent: 87, restMinutes: 4 }, // Fighter wk 2
      { week: 8, sets: 3, reps: 3, loadPercent: 92, restMinutes: 5 }, // Fighter wk 3
    ],
    sessionLiftMap: { A: 'all', B: 'all' },
    defaultDays: [1, 4], // Mon, Thu
  },
  // TB II Base Build: 8-week block, Fighter 2x/week
  // Fighter wave weeks 1-5. Weeks 6-8: conditioning only (no strength).
  {
    id: 'bb-fighter-first',
    name: 'Base Build / Fighter First',
    isCustom: false,
    sessionsPerWeek: 2,
    sessionLabels: ['A', 'B'],
    waveWeeks: [
      { week: 1, sets: 3, reps: 5, loadPercent: 70, restMinutes: 2 }, // Fighter 6-wk wk1
      { week: 2, sets: 3, reps: 5, loadPercent: 80, restMinutes: 3 }, // Fighter 6-wk wk2
      { week: 3, sets: 3, reps: 3, loadPercent: 90, restMinutes: 4 }, // Fighter 6-wk wk3
      { week: 4, sets: 3, reps: 5, loadPercent: 75, restMinutes: 2 }, // Fighter 6-wk wk4
      { week: 5, sets: 3, reps: 4, loadPercent: 85, restMinutes: 3 }, // Fighter 6-wk wk5
      { week: 6, strengthOff: true },
      { week: 7, strengthOff: true },
      { week: 8, strengthOff: true },
    ],
    sessionLiftMap: { A: 'all', B: 'all' },
    defaultDays: [1, 4], // Mon, Thu
  },
]
