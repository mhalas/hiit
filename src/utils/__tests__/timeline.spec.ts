import { describe, expect, it } from 'vitest';
import { buildTimeline } from '@/utils/timeline';
import type { TimerStep } from '@/types/timer';
import type { Workout } from '@/types/workout';

const workout = (partial: Partial<Workout>): Workout => ({
  title: '',
  sets: 1,
  restBetweenSets: 0,
  exercises: [],
  ...partial,
});

const brief = (steps: TimerStep[]) =>
  steps.map((s) => `${s.kind}:${s.exerciseIndex ?? '-'}:s${s.set}:${s.duration}`);

describe('buildTimeline', () => {
  it('is empty without exercises', () => {
    expect(buildTimeline(workout({ sets: 3, restBetweenSets: 30 }))).toEqual([]);
  });

  it('lists work, rest and set breaks in order, without a rest after the last exercise', () => {
    const steps = buildTimeline(
      workout({
        sets: 2,
        restBetweenSets: 60,
        exercises: [
          { name: 'a', workoutDuration: 30, restDuration: 10 },
          { name: 'b', workoutDuration: 20, restDuration: 5 },
        ],
      }),
    );

    expect(brief(steps)).toEqual([
      'work:0:s1:30',
      'rest:0:s1:10',
      'work:1:s1:20',
      'rest:1:s1:5',
      'setBreak:-:s1:60',
      'work:0:s2:30',
      'rest:0:s2:10',
      'work:1:s2:20',
    ]);
  });

  it('leaves out rests and set breaks of 0 s', () => {
    const steps = buildTimeline(
      workout({
        sets: 2,
        restBetweenSets: 0,
        exercises: [{ name: 'a', workoutDuration: 15, restDuration: 0 }],
      }),
    );

    expect(brief(steps)).toEqual(['work:0:s1:15', 'work:0:s2:15']);
  });

  it('has no set break after the last set', () => {
    const steps = buildTimeline(
      workout({
        sets: 3,
        restBetweenSets: 45,
        exercises: [{ name: 'a', workoutDuration: 10, restDuration: 0 }],
      }),
    );

    expect(steps.filter((s) => s.kind === 'setBreak').map((s) => s.set)).toEqual([1, 2]);
    expect(steps[steps.length - 1]).toMatchObject({ kind: 'work', set: 3 });
  });

  it('adds up to the full workout length', () => {
    const tabata = buildTimeline(
      workout({ sets: 8, exercises: [{ name: 'x', workoutDuration: 20, restDuration: 10 }] }),
    );

    expect(tabata).toHaveLength(15);
    expect(tabata.reduce((total, s) => total + s.duration, 0)).toBe(230);
  });
});
