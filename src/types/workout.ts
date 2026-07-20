import type { Exercise } from "./exercise";

export interface Workout {
    title: string;
    exercises: Exercise[];
    sets: number;
    restBetweenSets: number;
}