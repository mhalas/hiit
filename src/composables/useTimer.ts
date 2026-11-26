import { computed, onScopeDispose, ref, type Ref } from 'vue';
import type { Workout } from '@/types/workout';
import { useSound } from './useSound';
import { useWakeLock } from './useWakeLock';

export type TimerPhase = 'work' | 'rest';

const BETWEEN_SETS = -1;
const TICK_MS = 200;

export function useTimer(workout: Ref<Workout>) {
  const { unlock: unlockAudio, playBeep, playChangeSound, playFinishSound } = useSound();
  const wakeLock = useWakeLock();

  const firstWorkDuration = () => workout.value.exercises[0]?.workoutDuration ?? 0;

  const currentSet = ref(1);
  const currentExerciseIndex = ref(0);
  const currentPhase = ref<TimerPhase>('work');
  const secondsLeft = ref(firstWorkDuration());
  const isRunning = ref(false);
  const isFinished = ref(false);

  const phaseEndsAt = ref(0);
  const pausedRemainingMs = ref(firstWorkDuration() * 1000);

  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const currentExercise = computed(() => {
    return workout.value.exercises[currentExerciseIndex.value] ?? null;
  });

  const isLastExercise = () => currentExerciseIndex.value >= workout.value.exercises.length - 1;
  const isLastSet = () => currentSet.value >= workout.value.sets;

  const enterPhase = (phase: TimerPhase, seconds: number, startedAt: number) => {
    currentPhase.value = phase;
    secondsLeft.value = seconds;
    phaseEndsAt.value = startedAt + seconds * 1000;
    pausedRemainingMs.value = seconds * 1000;
  };

  const startNextSet = (startedAt: number) => {
    currentSet.value++;
    currentExerciseIndex.value = 0;
    enterPhase('work', firstWorkDuration(), startedAt);
  };

  const finish = () => {
    pause();
    isFinished.value = true;
    secondsLeft.value = 0;
    pausedRemainingMs.value = 0;
    playFinishSound();
  };

  const moveToNextExerciseOrSet = (startedAt: number) => {
    if (!isLastExercise()) {
      currentExerciseIndex.value++;
      enterPhase('work', currentExercise.value?.workoutDuration ?? 0, startedAt);
    } else if (isLastSet()) {
      finish();
    } else if (workout.value.restBetweenSets > 0) {
      currentExerciseIndex.value = BETWEEN_SETS;
      enterPhase('rest', workout.value.restBetweenSets, startedAt);
    } else {
      startNextSet(startedAt);
    }
  };

  const nextStep = (startedAt: number) => {
    if (currentExerciseIndex.value === BETWEEN_SETS) {
      startNextSet(startedAt);
      return;
    }

    const ex = currentExercise.value;
    if (!ex) {
      finish();
      return;
    }

    const isLastExerciseOfWorkout = isLastExercise() && isLastSet();
    if (currentPhase.value === 'work' && ex.restDuration > 0 && !isLastExerciseOfWorkout) {
      enterPhase('rest', ex.restDuration, startedAt);
    } else {
      moveToNextExerciseOrSet(startedAt);
    }
  };

  const tick = () => {
    if (!isRunning.value) {
      return;
    }

    const now = performance.now();
    let phaseChanged = false;
    while (isRunning.value && now >= phaseEndsAt.value) {
      nextStep(phaseEndsAt.value);
      phaseChanged = true;
    }

    if (!isRunning.value) {
      return;
    }

    if (phaseChanged) {
      playChangeSound();
    }

    const seconds = Math.ceil((phaseEndsAt.value - now) / 1000);
    if (seconds === secondsLeft.value) {
      return;
    }

    const isCountdown = !phaseChanged && seconds < secondsLeft.value && seconds <= 3;
    secondsLeft.value = seconds;
    if (isCountdown) {
      playBeep(440, 0.1);
    }
  };

  const remainingMsAt = (now: number) => {
    return isRunning.value ? Math.max(0, phaseEndsAt.value - now) : pausedRemainingMs.value;
  };

  const start = () => {
    if (isRunning.value || isFinished.value || workout.value.exercises.length === 0) {
      return;
    }

    unlockAudio();
    void wakeLock.acquire();

    phaseEndsAt.value = performance.now() + pausedRemainingMs.value;
    isRunning.value = true;
    timerInterval = setInterval(tick, TICK_MS);
  };

  const pause = () => {
    if (isRunning.value) {
      pausedRemainingMs.value = Math.max(0, phaseEndsAt.value - performance.now());
    }
    isRunning.value = false;
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    wakeLock.release();
  };

  const reset = () => {
    pause();
    isFinished.value = false;
    currentSet.value = 1;
    currentExerciseIndex.value = 0;
    currentPhase.value = 'work';
    secondsLeft.value = firstWorkDuration();
    pausedRemainingMs.value = firstWorkDuration() * 1000;
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      tick();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  onScopeDispose(() => {
    pause();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });

  return {
    secondsLeft,
    currentSet,
    currentPhase,
    currentExercise,
    currentExerciseIndex,
    isRunning,
    isFinished,
    remainingMsAt,
    start,
    pause,
    reset,
  };
}
