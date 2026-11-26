import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  advance,
  audio,
  countSounds,
  createTimer,
  exercise,
  flushMicrotasks,
  installTestEnvironment,
  jumpClock,
  now,
  setVisibility,
  sounds,
  uninstallTestEnvironment,
  wakeLock,
  workoutOf,
} from '@/__tests__/helpers';

type Timer = ReturnType<typeof createTimer>['timer'];

const state = (t: Timer) => ({
  phase: t.currentPhase.value,
  index: t.currentExerciseIndex.value,
  set: t.currentSet.value,
  secondsLeft: t.secondsLeft.value,
});

const runUntilFinished = (t: Timer) => {
  const startedAt = now();
  while (!t.isFinished.value && now() - startedAt < 1_000_000) {
    advance(200);
  }
  return now() - startedAt;
};

const twoExercisesTwoSets = workoutOf({
  sets: 2,
  restBetweenSets: 4,
  exercises: [exercise('a', 3, 2), exercise('b', 2, 0)],
});

beforeEach(installTestEnvironment);
afterEach(uninstallTestEnvironment);

describe('useTimer – timeline', () => {
  it('starts on the first exercise, not running', () => {
    const { timer } = createTimer(twoExercisesTwoSets);

    expect(state(timer)).toEqual({ phase: 'work', index: 0, set: 1, secondsLeft: 3 });
    expect(timer.isRunning.value).toBe(false);
    expect(timer.isFinished.value).toBe(false);
  });

  it('switches phases exactly when each configured duration has passed', () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    timer.start();

    advance(2800);
    expect(state(timer)).toEqual({ phase: 'work', index: 0, set: 1, secondsLeft: 1 });

    advance(200);
    expect(state(timer)).toEqual({ phase: 'rest', index: 0, set: 1, secondsLeft: 2 });

    advance(2000);
    expect(state(timer)).toEqual({ phase: 'work', index: 1, set: 1, secondsLeft: 2 });

    advance(2000);
    expect(state(timer)).toEqual({ phase: 'rest', index: null, set: 1, secondsLeft: 4 });
    expect(timer.currentStep.value?.kind).toBe('setBreak');
    expect(timer.currentExercise.value).toBeNull();

    advance(4000);
    expect(state(timer)).toEqual({ phase: 'work', index: 0, set: 2, secondsLeft: 3 });

    advance(5000);
    expect(state(timer)).toEqual({ phase: 'work', index: 1, set: 2, secondsLeft: 2 });

    advance(1800);
    expect(timer.isFinished.value).toBe(false);

    advance(200);
    expect(timer.isFinished.value).toBe(true);
    expect(timer.isRunning.value).toBe(false);
    expect(timer.secondsLeft.value).toBe(0);
  });

  it('runs a Tabata 8 × 20/10 in 230 s, without a rest after the last interval', () => {
    const { timer } = createTimer(workoutOf({ sets: 8, exercises: [exercise('x', 20, 10)] }));
    timer.start();

    expect(runUntilFinished(timer)).toBe(230_000);
  });

  it('skips rests of 0 s and goes straight to the next set when there is no set break', () => {
    const { timer } = createTimer(
      workoutOf({ sets: 2, restBetweenSets: 0, exercises: [exercise('x', 2, 0)] }),
    );
    timer.start();

    advance(2000);
    expect(state(timer)).toEqual({ phase: 'work', index: 0, set: 2, secondsLeft: 2 });

    advance(2000);
    expect(timer.isFinished.value).toBe(true);
  });

  it('does not start without exercises', () => {
    const { timer } = createTimer(workoutOf({ exercises: [] }));
    timer.start();

    expect(timer.isRunning.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('useTimer – finishing and reset', () => {
  it('ignores Start after the workout has finished', () => {
    const { timer } = createTimer(workoutOf({ exercises: [exercise('x', 2, 5)] }));
    timer.start();
    runUntilFinished(timer);

    timer.start();

    expect(timer.isRunning.value).toBe(false);
    expect(timer.isFinished.value).toBe(true);
  });

  it('reset returns to the beginning', () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    timer.start();
    runUntilFinished(timer);

    timer.reset();

    expect(state(timer)).toEqual({ phase: 'work', index: 0, set: 1, secondsLeft: 3 });
    expect(timer.isFinished.value).toBe(false);
    expect(timer.remainingMsAt(now())).toBe(3000);
  });
});

describe('useTimer – pause and clock', () => {
  it('keeps the partial second when paused and resumed', () => {
    const { timer } = createTimer(workoutOf({ exercises: [exercise('x', 10, 0)] }));
    timer.start();
    advance(2500);

    timer.pause();
    expect(timer.secondsLeft.value).toBe(8);
    expect(timer.remainingMsAt(now())).toBe(7500);

    advance(5000);
    expect(timer.remainingMsAt(now())).toBe(7500);

    timer.start();
    advance(7400);
    expect(timer.isFinished.value).toBe(false);

    advance(200);
    expect(timer.isFinished.value).toBe(true);
  });

  it('reports the exact remaining time between ticks', () => {
    const { timer } = createTimer(workoutOf({ exercises: [exercise('x', 3, 0)] }));
    timer.start();
    advance(1000);

    expect(timer.remainingMsAt(now())).toBe(2000);
    expect(timer.remainingMsAt(now() + 500)).toBe(1500);
  });

  it('catches up when the tab becomes visible after timers were throttled', () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    timer.start();
    advance(1000);
    sounds.length = 0;

    jumpClock(9000);
    setVisibility('visible');

    expect(state(timer)).toEqual({ phase: 'rest', index: null, set: 1, secondsLeft: 1 });
    expect(countSounds('change')).toBe(1);
  });

  it('finishes the workout if the phone slept through the end', () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    timer.start();
    advance(1000);

    jumpClock(60_000);
    advance(200);

    expect(timer.isFinished.value).toBe(true);
    expect(countSounds('finish')).toBe(3);
  });
});

describe('useTimer – sounds', () => {
  it('beeps on 3, 2, 1 and plays the finish sound at the end', () => {
    const { timer } = createTimer(workoutOf({ exercises: [exercise('x', 5, 0)] }));
    timer.start();
    runUntilFinished(timer);

    expect(countSounds('beep')).toBe(3);
    expect(countSounds('change')).toBe(0);
    expect(countSounds('finish')).toBe(3);
  });

  it('plays the change sound once per phase switch', () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    timer.start();
    runUntilFinished(timer);

    expect(countSounds('change')).toBe(6);
  });

  it('uses one shared AudioContext and unlocks it once, on Start', () => {
    const first = createTimer(twoExercisesTwoSets);
    first.timer.start();
    first.scope.stop();

    const second = createTimer(twoExercisesTwoSets);
    second.timer.start();

    expect(audio.contexts).toBe(1);
    expect(audio.unlocks).toBe(1);
  });
});

describe('useTimer – screen wake lock', () => {
  it('keeps the screen on only while running', async () => {
    const { timer } = createTimer(twoExercisesTwoSets);

    timer.start();
    await flushMicrotasks();
    expect(wakeLock.active.size).toBe(1);

    timer.pause();
    await flushMicrotasks();
    expect(wakeLock.active.size).toBe(0);
  });

  it('requests the lock again when the tab comes back', async () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    timer.start();
    await flushMicrotasks();

    setVisibility('hidden');
    await wakeLock.releaseAllByBrowser();
    expect(wakeLock.active.size).toBe(0);

    setVisibility('visible');
    await flushMicrotasks();
    expect(wakeLock.active.size).toBe(1);
    expect(wakeLock.requests).toBe(2);
  });

  it('releases the lock when the workout finishes', async () => {
    const { timer } = createTimer(workoutOf({ exercises: [exercise('x', 2, 0)] }));
    timer.start();
    await flushMicrotasks();

    runUntilFinished(timer);
    await flushMicrotasks();

    expect(wakeLock.active.size).toBe(0);
  });

  it('still works when the browser has no Wake Lock API', () => {
    Reflect.deleteProperty(navigator, 'wakeLock');
    const { timer } = createTimer(workoutOf({ exercises: [exercise('x', 2, 0)] }));

    timer.start();
    runUntilFinished(timer);

    expect(timer.isFinished.value).toBe(true);
  });
});

describe('useTimer – cleanup', () => {
  it('stops the interval, the wake lock and the listeners when the view is closed', async () => {
    const { timer, scope } = createTimer(twoExercisesTwoSets);
    timer.start();
    await flushMicrotasks();

    scope.stop();
    await flushMicrotasks();

    expect(timer.isRunning.value).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(wakeLock.active.size).toBe(0);

    const before = state(timer);
    jumpClock(10_000);
    setVisibility('visible');
    expect(state(timer)).toEqual(before);
  });
});

describe('useTimer – upcoming step and total time', () => {
  it('knows the next step, and has none on the last one', () => {
    const { timer } = createTimer(twoExercisesTwoSets);

    expect(timer.upcomingStep.value).toMatchObject({ kind: 'rest', exerciseIndex: 0 });

    timer.start();
    advance(5000);
    expect(timer.upcomingStep.value).toMatchObject({ kind: 'setBreak' });

    advance(2000);
    expect(timer.upcomingStep.value).toMatchObject({ kind: 'work', exerciseIndex: 0, set: 2 });

    advance(9000);
    expect(timer.currentStep.value).toMatchObject({ kind: 'work', exerciseIndex: 1, set: 2 });
    expect(timer.upcomingStep.value).toBeNull();
  });

  it('counts down the time left for the whole workout', () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    expect(timer.totalRemainingMsAt(now())).toBe(18_000);

    timer.start();
    advance(4000);
    expect(timer.totalRemainingMsAt(now())).toBe(14_000);
    expect(timer.totalRemainingMsAt(now() + 500)).toBe(13_500);

    timer.pause();
    advance(3000);
    expect(timer.totalRemainingMsAt(now())).toBe(14_000);
  });

  it('reports no time left once finished', () => {
    const { timer } = createTimer(workoutOf({ exercises: [exercise('x', 2, 0)] }));
    timer.start();
    runUntilFinished(timer);

    expect(timer.totalRemainingMsAt(now())).toBe(0);
  });
});

describe('useTimer – skip forward and back', () => {
  it('jumps to the next step with its full duration, while paused', () => {
    const { timer } = createTimer(twoExercisesTwoSets);

    timer.skipForward();

    expect(state(timer)).toEqual({ phase: 'rest', index: 0, set: 1, secondsLeft: 2 });
    expect(timer.remainingMsAt(now())).toBe(2000);
    expect(timer.isRunning.value).toBe(false);
    expect(countSounds('change')).toBe(0);
  });

  it('keeps running after a skip and plays the change sound', () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    timer.start();
    advance(1000);

    timer.skipForward();
    expect(state(timer)).toEqual({ phase: 'rest', index: 0, set: 1, secondsLeft: 2 });
    expect(countSounds('change')).toBe(1);

    advance(2000);
    expect(state(timer)).toEqual({ phase: 'work', index: 1, set: 1, secondsLeft: 2 });
  });

  it('finishes the workout when skipping past the last step', () => {
    const { timer } = createTimer(workoutOf({ exercises: [exercise('x', 30, 0)] }));
    timer.start();

    timer.skipForward();

    expect(timer.isFinished.value).toBe(true);
    expect(timer.isRunning.value).toBe(false);
    expect(timer.canSkipForward.value).toBe(false);
  });

  it('goes back to the start of the previous step', () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    timer.start();
    advance(4000);

    timer.skipBack();

    expect(state(timer)).toEqual({ phase: 'work', index: 0, set: 1, secondsLeft: 3 });
    expect(timer.isRunning.value).toBe(true);

    advance(3000);
    expect(state(timer)).toEqual({ phase: 'rest', index: 0, set: 1, secondsLeft: 2 });
  });

  it('cannot go back from the first step', () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    expect(timer.canSkipBack.value).toBe(false);

    timer.skipBack();

    expect(state(timer)).toEqual({ phase: 'work', index: 0, set: 1, secondsLeft: 3 });
  });

  it('returns from the finish screen to the last step, paused', () => {
    const { timer } = createTimer(twoExercisesTwoSets);
    timer.start();
    runUntilFinished(timer);

    timer.skipBack();

    expect(timer.isFinished.value).toBe(false);
    expect(timer.isRunning.value).toBe(false);
    expect(state(timer)).toEqual({ phase: 'work', index: 1, set: 2, secondsLeft: 2 });

    timer.start();
    advance(2000);
    expect(timer.isFinished.value).toBe(true);
  });

  it('does nothing without exercises', () => {
    const { timer } = createTimer(workoutOf({ exercises: [] }));

    timer.skipForward();
    timer.skipBack();

    expect(timer.canSkipForward.value).toBe(false);
    expect(timer.canSkipBack.value).toBe(false);
    expect(timer.isFinished.value).toBe(false);
  });
});
