import type { Workout } from '@/types/workout';
import { normalizeWorkout } from '@/utils/workout';
import LZString from 'lz-string';

export function useWorkoutParser() {
  const encodeWorkout = (workout: Workout): string => {
    const jsonString = JSON.stringify(workout);
    return LZString.compressToEncodedURIComponent(jsonString);
  };

  const decodeWorkout = (encodedWorkout: unknown): Workout | null => {
    if (typeof encodedWorkout !== 'string' || encodedWorkout === '') {
      return null;
    }
    try {
      const json = LZString.decompressFromEncodedURIComponent(encodedWorkout);
      if (!json) {
        return null;
      }
      return normalizeWorkout(JSON.parse(json));
    } catch (error) {
      console.error('Błąd podczas wczytywania treningu', error);
      return null;
    }
  };

  return { encodeWorkout, decodeWorkout };
}
