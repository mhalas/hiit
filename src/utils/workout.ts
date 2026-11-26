import type { Exercise } from '@/types/exercise';
import type { Workout } from '@/types/workout';

const INT_FIELDS = {
    sets: { min: 1, fallback: 1 },
    restBetweenSets: { min: 0, fallback: 0 },
    workoutDuration: { min: 1, fallback: 30 },
    restDuration: { min: 0, fallback: 0 },
} as const;

type IntField = keyof typeof INT_FIELDS;

export function createEmptyWorkout(): Workout {
    return { title: '', exercises: [], sets: 1, restBetweenSets: 0 };
}

export function isValidInt(value: unknown, field: IntField): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value >= INT_FIELDS[field].min;
}

export function toValidInt(value: unknown, field: IntField): number {
    const { min, fallback } = INT_FIELDS[field];
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (typeof n !== 'number' || !Number.isFinite(n)) {
        return fallback;
    }
    return Math.max(min, Math.round(n));
}

export function sanitizeWorkout(workout: Workout): void {
    workout.sets = toValidInt(workout.sets, 'sets');
    workout.restBetweenSets = toValidInt(workout.restBetweenSets, 'restBetweenSets');
    for (const ex of workout.exercises) {
        ex.workoutDuration = toValidInt(ex.workoutDuration, 'workoutDuration');
        ex.restDuration = toValidInt(ex.restDuration, 'restDuration');
    }
}

export function isWorkoutValid(workout: Workout): boolean {
    return workout.exercises.length > 0
        && isValidInt(workout.sets, 'sets')
        && isValidInt(workout.restBetweenSets, 'restBetweenSets')
        && workout.exercises.every(ex =>
            isValidInt(ex.workoutDuration, 'workoutDuration') && isValidInt(ex.restDuration, 'restDuration'));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export function normalizeWorkout(value: unknown): Workout | null {
    if (!isRecord(value) || !Array.isArray(value.exercises)) {
        return null;
    }

    const exercises: Exercise[] = [];
    for (const item of value.exercises) {
        if (!isRecord(item)) {
            return null;
        }
        exercises.push({
            name: typeof item.name === 'string' ? item.name : '',
            workoutDuration: toValidInt(item.workoutDuration, 'workoutDuration'),
            restDuration: toValidInt(item.restDuration, 'restDuration'),
        });
    }

    return {
        title: typeof value.title === 'string' ? value.title : '',
        exercises,
        sets: toValidInt(value.sets, 'sets'),
        restBetweenSets: toValidInt(value.restBetweenSets, 'restBetweenSets'),
    };
}
