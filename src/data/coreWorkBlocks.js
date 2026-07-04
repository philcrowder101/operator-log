export const TIMED_SECONDS_MIN = 10
export const TIMED_SECONDS_MAX = 300
export const REST_MINUTES_MIN = 1
export const REST_MINUTES_MAX = 5

export const DEFAULT_TIMED_SECONDS = 60
export const DEFAULT_REST_MINUTES = 2
export const DEFAULT_ROUNDS = 3

export const CORE_WORK_BLOCKS = [
  {
    id: 'ab-triad',
    name: 'AB Triad',
    fixedMovements: [
      { name: 'Plank', mode: 'timed' },
      { name: 'Shank', mode: 'timed' },
    ],
    choiceMovements: [
      { name: 'Wheel Rollout', mode: 'reps' },
      { name: 'Hanging Toe-to-Bar', mode: 'reps' },
    ],
    roundsRange: [1, 3],
    repsRange: [1, 10],
    defaultReps: 5,
  },
  {
    id: 'ab-triad-2',
    name: 'AB Triad 2',
    fixedMovements: [
      { name: 'Hanging Leg Raises', mode: 'reps' },
      { name: 'Hanging Knee Raises', mode: 'reps' },
      { name: 'Hanging Toe-to-Bar Raises', mode: 'reps' },
    ],
    choiceMovements: [],
    roundsRange: [3, 5],
    repsRange: [5, 10],
    defaultReps: 5,
  },
  {
    id: 'bird-dogs-side-planks',
    name: 'Bird Dogs & Side Planks',
    fixedMovements: [
      { name: 'Bird Dogs', mode: 'timed' },
      { name: 'Side Planks', mode: 'timed' },
    ],
    choiceMovements: [],
    roundsRange: [1, 3],
    repsRange: [1, 10],
    defaultReps: 5,
  },
]

/**
 * Build a fully-populated assignment (rounds/rest/movement prescriptions)
 * for a block, using its defaults. choiceName selects among choiceMovements;
 * falls back to the first choice when omitted.
 */
export function buildDefaultAssignment(blockId, choiceName = null) {
  const block = CORE_WORK_BLOCKS.find((b) => b.id === blockId)
  if (!block) return null

  const movements = [...block.fixedMovements]
  if (block.choiceMovements.length > 0) {
    const chosen =
      block.choiceMovements.find((m) => m.name === choiceName) || block.choiceMovements[0]
    movements.push(chosen)
  }

  const [minRounds, maxRounds] = block.roundsRange
  return {
    blockId: block.id,
    rounds: Math.min(Math.max(DEFAULT_ROUNDS, minRounds), maxRounds),
    restMinutes: DEFAULT_REST_MINUTES,
    movements: movements.map((m) =>
      m.mode === 'timed'
        ? { name: m.name, mode: 'timed', seconds: DEFAULT_TIMED_SECONDS }
        : { name: m.name, mode: 'reps', reps: block.defaultReps }
    ),
  }
}

/** 90 → "1:30" */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
