import { computed, onScopeDispose, ref, type Ref } from "vue";
import type { Workout } from "@/types/workout";
import { useSound } from "./useSound";

export type TimerPhase = 'work' | 'rest';

const BETWEEN_SETS = -1;

export function useTimer(workout: Ref<Workout>) {
    const { playBeep, playChangeSound, playFinishSound, dispose: disposeSound } = useSound();

    const firstWorkDuration = () => workout.value.exercises[0]?.workoutDuration ?? 0;

    const currentSet = ref(1);
    const currentExerciseIndex = ref(0);
    const currentPhase = ref<TimerPhase>('work');
    const secondsLeft = ref(firstWorkDuration());
    const isRunning = ref(false);
    const isFinished = ref(false);

    let timerInterval: ReturnType<typeof setInterval> | null = null;

    const currentExercise = computed(() => {
        return workout.value.exercises[currentExerciseIndex.value] ?? null;
    });

    const isLastExercise = () => currentExerciseIndex.value >= workout.value.exercises.length - 1;
    const isLastSet = () => currentSet.value >= workout.value.sets;

    const enterPhase = (phase: TimerPhase, seconds: number) => {
        currentPhase.value = phase;
        secondsLeft.value = seconds;
        playChangeSound();
    };

    const startNextSet = () => {
        currentSet.value++;
        currentExerciseIndex.value = 0;
        enterPhase('work', firstWorkDuration());
    };

    const finish = () => {
        pause();
        isFinished.value = true;
        secondsLeft.value = 0;
        playFinishSound();
    };

    const moveToNextExerciseOrSet = () => {
        if (!isLastExercise()) {
            currentExerciseIndex.value++;
            enterPhase('work', currentExercise.value?.workoutDuration ?? 0);
        } else if (isLastSet()) {
            finish();
        } else if (workout.value.restBetweenSets > 0) {
            currentExerciseIndex.value = BETWEEN_SETS;
            enterPhase('rest', workout.value.restBetweenSets);
        } else {
            startNextSet();
        }
    };

    const nextStep = () => {
        if (currentExerciseIndex.value === BETWEEN_SETS) {
            startNextSet();
            return;
        }

        const ex = currentExercise.value;
        if (!ex) {
            finish();
            return;
        }

        const isLastExerciseOfWorkout = isLastExercise() && isLastSet();
        if (currentPhase.value === 'work' && ex.restDuration > 0 && !isLastExerciseOfWorkout) {
            enterPhase('rest', ex.restDuration);
        } else {
            moveToNextExerciseOrSet();
        }
    };

    const tick = () => {
        secondsLeft.value = Math.max(0, secondsLeft.value - 1);
        if (secondsLeft.value === 0) {
            nextStep();
        } else if (secondsLeft.value <= 3) {
            playBeep(440, 0.1);
        }
    };

    const start = () => {
        if (isRunning.value || isFinished.value || workout.value.exercises.length === 0) {
            return;
        }

        isRunning.value = true;
        timerInterval = setInterval(tick, 1000);
    };

    const pause = () => {
        isRunning.value = false;
        if (timerInterval !== null) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    };

    const reset = () => {
        pause();
        isFinished.value = false;
        currentSet.value = 1;
        currentExerciseIndex.value = 0;
        currentPhase.value = 'work';
        secondsLeft.value = firstWorkDuration();
    };

    onScopeDispose(() => {
        pause();
        disposeSound();
    });

    return {
        secondsLeft,
        currentSet,
        currentPhase,
        currentExercise,
        currentExerciseIndex,
        isRunning,
        isFinished,
        start,
        pause,
        reset,
    };
}
