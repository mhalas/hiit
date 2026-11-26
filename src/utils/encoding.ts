import LZString from 'lz-string';
import type { Workout } from '@/types/workout';
import { normalizeWorkout } from '@/utils/workout';

export const LINK_FORMAT_VERSION = 1;

export function encodeWorkout(workout: Workout): string {
  const payload = { v: LINK_FORMAT_VERSION, ...workout };
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeWorkout(encodedWorkout: unknown): Workout | null {
  if (typeof encodedWorkout !== 'string' || encodedWorkout === '') {
    return null;
  }
  try {
    const json = LZString.decompressFromEncodedURIComponent(encodedWorkout);
    if (!json) {
      return null;
    }
    const data: unknown = JSON.parse(json);
    const version = typeof data === 'object' && data !== null && 'v' in data ? data.v : 1;
    if (version !== LINK_FORMAT_VERSION) {
      return null;
    }
    return normalizeWorkout(data);
  } catch (error) {
    console.error('Błąd podczas wczytywania treningu', error);
    return null;
  }
}
