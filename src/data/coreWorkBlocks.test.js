import { describe, it, expect } from 'vitest'
import {
  CORE_WORK_BLOCKS,
  buildDefaultAssignment,
  formatDuration,
  TIMED_SECONDS_MIN,
  TIMED_SECONDS_MAX,
  REST_MINUTES_MIN,
  REST_MINUTES_MAX,
} from './coreWorkBlocks'

describe('CORE_WORK_BLOCKS', () => {
  it('defines the three blocks', () => {
    expect(CORE_WORK_BLOCKS.map((b) => b.id)).toEqual([
      'ab-triad',
      'ab-triad-2',
      'bird-dogs-side-planks',
    ])
  })

  it('AB Triad has two timed fixed movements and two rep-based choices', () => {
    const abTriad = CORE_WORK_BLOCKS.find((b) => b.id === 'ab-triad')
    expect(abTriad.fixedMovements).toEqual([
      { name: 'Plank', mode: 'timed' },
      { name: 'Shank', mode: 'timed' },
    ])
    expect(abTriad.choiceMovements).toEqual([
      { name: 'Wheel Rollout', mode: 'reps' },
      { name: 'Hanging Toe-to-Bar', mode: 'reps' },
    ])
    expect(abTriad.roundsRange).toEqual([1, 3])
    expect(abTriad.repsRange).toEqual([1, 10])
  })

  it('AB Triad 2 has three rep-based movements with 3-5 rounds and 5-10 reps', () => {
    const abTriad2 = CORE_WORK_BLOCKS.find((b) => b.id === 'ab-triad-2')
    expect(abTriad2.fixedMovements).toEqual([
      { name: 'Hanging Leg Raises', mode: 'reps' },
      { name: 'Hanging Knee Raises', mode: 'reps' },
      { name: 'Hanging Toe-to-Bar Raises', mode: 'reps' },
    ])
    expect(abTriad2.choiceMovements).toEqual([])
    expect(abTriad2.roundsRange).toEqual([3, 5])
    expect(abTriad2.repsRange).toEqual([5, 10])
  })

  it('exports shared limits', () => {
    expect(TIMED_SECONDS_MIN).toBe(10)
    expect(TIMED_SECONDS_MAX).toBe(300)
    expect(REST_MINUTES_MIN).toBe(1)
    expect(REST_MINUTES_MAX).toBe(5)
  })
})

describe('buildDefaultAssignment', () => {
  it('builds AB Triad defaults with first choice movement when none given', () => {
    expect(buildDefaultAssignment('ab-triad')).toEqual({
      blockId: 'ab-triad',
      rounds: 3,
      restMinutes: 2,
      movements: [
        { name: 'Plank', mode: 'timed', seconds: 60 },
        { name: 'Shank', mode: 'timed', seconds: 60 },
        { name: 'Wheel Rollout', mode: 'reps', reps: 5 },
      ],
    })
  })

  it('uses the requested choice movement', () => {
    const a = buildDefaultAssignment('ab-triad', 'Hanging Toe-to-Bar')
    expect(a.movements[2]).toEqual({ name: 'Hanging Toe-to-Bar', mode: 'reps', reps: 5 })
  })

  it('builds AB Triad 2 defaults: 3 rounds, 5 reps each', () => {
    expect(buildDefaultAssignment('ab-triad-2')).toEqual({
      blockId: 'ab-triad-2',
      rounds: 3,
      restMinutes: 2,
      movements: [
        { name: 'Hanging Leg Raises', mode: 'reps', reps: 5 },
        { name: 'Hanging Knee Raises', mode: 'reps', reps: 5 },
        { name: 'Hanging Toe-to-Bar Raises', mode: 'reps', reps: 5 },
      ],
    })
  })

  it('builds Bird Dogs & Side Planks defaults: 3 rounds, 60s each', () => {
    expect(buildDefaultAssignment('bird-dogs-side-planks')).toEqual({
      blockId: 'bird-dogs-side-planks',
      rounds: 3,
      restMinutes: 2,
      movements: [
        { name: 'Bird Dogs', mode: 'timed', seconds: 60 },
        { name: 'Side Planks', mode: 'timed', seconds: 60 },
      ],
    })
  })

  it('returns null for an unknown block id', () => {
    expect(buildDefaultAssignment('nope')).toBeNull()
  })
})

describe('formatDuration', () => {
  it('formats sub-minute durations', () => {
    expect(formatDuration(10)).toBe('0:10')
    expect(formatDuration(45)).toBe('0:45')
  })

  it('formats whole minutes', () => {
    expect(formatDuration(60)).toBe('1:00')
    expect(formatDuration(300)).toBe('5:00')
  })

  it('formats minutes with seconds', () => {
    expect(formatDuration(90)).toBe('1:30')
    expect(formatDuration(125)).toBe('2:05')
  })
})
