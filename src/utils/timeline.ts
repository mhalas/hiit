import type { TimerStep } from '@/types/timer';
import type { Workout } from '@/types/workout';

export function buildTimeline(workout: Workout): TimerStep[] {
  const { exercises, sets, restBetweenSets } = workout;
  const steps: TimerStep[] = [];

  if (exercises.length === 0) {
    return steps;
  }

  for (let set = 1; set <= sets; set++) {
    const isLastSet = set === sets;

    exercises.forEach((exercise, exerciseIndex) => {
      steps.push({ kind: 'work', exerciseIndex, set, duration: exercise.workoutDuration });

      const isLastExerciseOfWorkout = isLastSet && exerciseIndex === exercises.length - 1;
      if (!isLastExerciseOfWorkout) {
        steps.push({ kind: 'rest', exerciseIndex, set, duration: exercise.restDuration });
      }
    });

    if (!isLastSet) {
      steps.push({ kind: 'setBreak', exerciseIndex: null, set, duration: restBetweenSets });
    }
  }

  return steps.filter((step) => step.duration > 0);
}
