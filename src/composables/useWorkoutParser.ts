import type { Workout } from '@/types/workout';
import LZString from 'lz-string';

export function useWorkoutParser() {
    const encodeWorkout = (workout: Workout): string => {
        const jsonString = JSON.stringify(workout);
        return LZString.compressToEncodedURIComponent(jsonString);
    }

    const decodeWorkout = (encodedWorkout: string): Workout | null => {
        try {
            return JSON.parse(LZString.decompressFromEncodedURIComponent(encodedWorkout)) as Workout;
        } catch(error) {
            console.error('Błąd podczas wczytywania treningu', error);
            return null;
        }
    };

    return { encodeWorkout, decodeWorkout };
}