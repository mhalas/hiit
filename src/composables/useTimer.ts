import { computed, onScopeDispose, ref, type Ref } from 'vue';
import type { TimerPhase } from '@/types/timer';
import type { Workout } from '@/types/workout';
import { buildTimeline } from '@/utils/timeline';
import { useSound } from './useSound';
import { useWakeLock } from './useWakeLock';

const TICK_MS = 200;

export function useTimer(workout: Ref<Workout>) {
  const { unlock: unlockAudio, playBeep, playChangeSound, playFinishSound } = useSound();
  const wakeLock = useWakeLock();

  const timeline = computed(() => buildTimeline(workout.value));
  const stepDurationMs = (index: number) => (timeline.value[index]?.duration ?? 0) * 1000;

  const stepIndex = ref(0);
  const secondsLeft = ref(stepDurationMs(0) / 1000);
  const isRunning = ref(false);
  const isFinished = ref(false);

  const phaseEndsAt = ref(0);
  const pausedRemainingMs = ref(stepDurationMs(0));

  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const currentStep = computed(() => timeline.value[stepIndex.value] ?? null);
  const currentSet = computed(() => currentStep.value?.set ?? 1);
  const currentExerciseIndex = computed(() => currentStep.value?.exerciseIndex ?? null);
  const currentPhase = computed<TimerPhase>(() =>
    currentStep.value === null || currentStep.value.kind === 'work' ? 'work' : 'rest',
  );
  const currentExercise = computed(() => {
    const index = currentExerciseIndex.value;
    return index === null ? null : (workout.value.exercises[index] ?? null);
  });

  const upcomingStep = computed(() =>
    isFinished.value ? null : (timeline.value[stepIndex.value + 1] ?? null),
  );

  const remainingAfterStepMs = computed(() => {
    const totals: number[] = [];
    let sum = 0;
    for (let i = timeline.value.length - 1; i >= 0; i--) {
      totals[i] = sum;
      sum += stepDurationMs(i);
    }
    return totals;
  });

  const canSkipBack = computed(
    () => timeline.value.length > 0 && (isFinished.value || stepIndex.value > 0),
  );
  const canSkipForward = computed(() => timeline.value.length > 0 && !isFinished.value);

  const enterStep = (index: number, startedAt: number) => {
    stepIndex.value = index;
    const durationMs = stepDurationMs(index);
    secondsLeft.value = durationMs / 1000;
    phaseEndsAt.value = startedAt + durationMs;
    pausedRemainingMs.value = durationMs;
  };

  const finish = () => {
    pause();
    isFinished.value = true;
    secondsLeft.value = 0;
    pausedRemainingMs.value = 0;
    playFinishSound();
  };

  const goToNextStep = (startedAt: number) => {
    if (stepIndex.value >= timeline.value.length - 1) {
      finish();
    } else {
      enterStep(stepIndex.value + 1, startedAt);
    }
  };

  const tick = () => {
    if (!isRunning.value) {
      return;
    }

    const now = performance.now();
    let phaseChanged = false;
    while (isRunning.value && now >= phaseEndsAt.value) {
      goToNextStep(phaseEndsAt.value);
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

  const totalRemainingMsAt = (now: number) => {
    if (isFinished.value) {
      return 0;
    }
    return remainingMsAt(now) + (remainingAfterStepMs.value[stepIndex.value] ?? 0);
  };

  const skipForward = () => {
    if (!canSkipForward.value) {
      return;
    }
    if (stepIndex.value >= timeline.value.length - 1) {
      finish();
      return;
    }
    enterStep(stepIndex.value + 1, performance.now());
    if (isRunning.value) {
      playChangeSound();
    }
  };

  const skipBack = () => {
    if (!canSkipBack.value) {
      return;
    }
    if (isFinished.value) {
      isFinished.value = false;
      enterStep(timeline.value.length - 1, performance.now());
      return;
    }
    enterStep(stepIndex.value - 1, performance.now());
    if (isRunning.value) {
      playChangeSound();
    }
  };

  const start = () => {
    if (isRunning.value || isFinished.value || timeline.value.length === 0) {
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
    enterStep(0, performance.now());
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
    currentStep,
    currentSet,
    currentPhase,
    currentExercise,
    currentExerciseIndex,
    upcomingStep,
    isRunning,
    isFinished,
    canSkipBack,
    canSkipForward,
    remainingMsAt,
    totalRemainingMsAt,
    start,
    pause,
    reset,
    skipForward,
    skipBack,
  };
}
