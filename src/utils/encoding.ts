import LZString from 'lz-string';
import type { Workout } from '@/types/workout';
import { normalizeWorkout } from '@/utils/workout';

export const LINK_FORMAT_VERSION = 2;

const FIELD_SEPARATOR = '~';
const PART_SEPARATOR = '.';
const ESCAPE = '\\';
const V2_PREFIX = `${LINK_FORMAT_VERSION}${FIELD_SEPARATOR}`;
const COMPRESSED_PREFIX = 'z';

const escapeValue = (value: unknown): string =>
  String(value).replace(/[\\~.]/g, (char) => ESCAPE + char);

const unescapeValue = (value: string): string => value.replace(/\\(.)/g, '$1');

function splitUnescaped(text: string, separator: string): string[] {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    if (char === ESCAPE && i + 1 < text.length) {
      current += char + text.charAt(i + 1);
      i++;
    } else if (char === separator) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function toCompactText(workout: Workout): string {
  return [
    String(LINK_FORMAT_VERSION),
    escapeValue(workout.title),
    escapeValue(workout.sets),
    escapeValue(workout.restBetweenSets),
    ...workout.exercises.map((exercise) =>
      [exercise.name, exercise.workoutDuration, exercise.restDuration]
        .map(escapeValue)
        .join(PART_SEPARATOR),
    ),
  ].join(FIELD_SEPARATOR);
}

function fromCompactText(text: string): Workout | null {
  if (!text.startsWith(V2_PREFIX)) {
    return null;
  }
  const [, title, sets, restBetweenSets, ...exerciseFields] = splitUnescaped(text, FIELD_SEPARATOR);
  if (title === undefined || sets === undefined || restBetweenSets === undefined) {
    return null;
  }

  const exercises = [];
  for (const field of exerciseFields) {
    const parts = splitUnescaped(field, PART_SEPARATOR).map(unescapeValue);
    if (parts.length !== 3) {
      return null;
    }
    const [name, workoutDuration, restDuration] = parts;
    exercises.push({ name, workoutDuration, restDuration });
  }

  return normalizeWorkout({
    title: unescapeValue(title),
    sets: unescapeValue(sets),
    restBetweenSets: unescapeValue(restBetweenSets),
    exercises,
  });
}

export function encodeWorkout(workout: Workout): string {
  const text = toCompactText(workout);
  const compressed = COMPRESSED_PREFIX + LZString.compressToEncodedURIComponent(text);
  return encodeURIComponent(compressed).length < encodeURIComponent(text).length
    ? compressed
    : text;
}

export function decodeWorkout(encodedWorkout: unknown): Workout | null {
  if (typeof encodedWorkout !== 'string' || encodedWorkout === '') {
    return null;
  }
  try {
    if (encodedWorkout.startsWith(V2_PREFIX)) {
      return fromCompactText(encodedWorkout);
    }
    if (encodedWorkout.startsWith(COMPRESSED_PREFIX)) {
      const text = LZString.decompressFromEncodedURIComponent(encodedWorkout.slice(1));
      return text ? fromCompactText(text) : null;
    }
    return null;
  } catch (error) {
    console.error('Błąd podczas wczytywania treningu', error);
    return null;
  }
}
