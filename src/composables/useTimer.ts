import { computed, ref, type Ref } from "vue";
import type { Workout } from "@/types/workout";
import { useSound } from "./useSound";

export function useTimer(workout: Ref<Workout>) {
    const { playBeep, playChangeSound } = useSound();

    const currentSet = ref(1);
    const currentExerciseIndex = ref(0);
    const isRunning = ref(false);
    const currentPhase = ref<'work' | 'rest'>('work');

    const initialDuration = workout.value.exercises[0]?.workoutDuration || 0;
    const secondsLeft = ref(initialDuration);

    let timerInterval: ReturnType<typeof setInterval> | null = null;

    const currentExercise = computed(() => {
        return workout.value.exercises[currentExerciseIndex.value] || null;
    });

    const nextStep = () => {
        playChangeSound();

        if (currentPhase.value === 'rest' && currentExerciseIndex.value === -1) {
            currentSet.value++;
            currentExerciseIndex.value = 0;
            currentPhase.value = 'work';
            secondsLeft.value = workout.value.exercises[0]?.workoutDuration || 0;
            return;
        }

        const ex = currentExercise.value;
        if (!ex) {
            return;
        }

        if (currentPhase.value === 'work') {
            if (ex.restDuration > 0) {
                currentPhase.value = 'rest';
                secondsLeft.value = ex.restDuration;
            } else {
                moveToNextExerciseOrSet();
            }
        } else {
            moveToNextExerciseOrSet();
        }
    };

    const moveToNextExerciseOrSet = () => {
        if (currentExerciseIndex.value < workout.value.exercises.length - 1) {
            currentExerciseIndex.value++;
            currentPhase.value = 'work';
            secondsLeft.value = currentExercise.value?.workoutDuration || 0;
        } else {
            if (currentSet.value < workout.value.sets) {
                if (workout.value.restBetweenSets && workout.value.restBetweenSets > 0) {

                    currentExerciseIndex.value = -1;
                    currentPhase.value = 'rest';
                    secondsLeft.value = workout.value.restBetweenSets;
                } else {
                    currentSet.value++;
                    currentExerciseIndex.value = 0;
                    currentPhase.value = 'work';
                    secondsLeft.value = workout.value.exercises[0]?.workoutDuration || 0;
                }
            } else {
                pause();
            }
        }
    };

    const start = () => {
        if (isRunning.value) {
            return;
        }

        isRunning.value = true;

        timerInterval = window.setInterval(() => {
            if (secondsLeft.value > 1) {
                secondsLeft.value--;
                if(secondsLeft.value <= 3) {
                    playBeep(440, 0.1);
                }
            } else if(secondsLeft.value === 1) {
                secondsLeft.value--;
                playBeep(880, 0.15);
            } else {
                nextStep();
            }
        }, 1000);
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
        currentSet.value = 1;
        currentExerciseIndex.value = 0;
        currentPhase.value = 'work';
        secondsLeft.value = workout.value.exercises[0]?.workoutDuration || 30;
    };

    return { secondsLeft, currentSet, currentPhase, isRunning, currentExerciseIndex, start, pause, reset };
}

