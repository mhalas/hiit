import { describe, expect, it, vi } from 'vitest';
import LZString from 'lz-string';
import { decodeWorkout, encodeWorkout, LINK_FORMAT_VERSION } from '@/utils/encoding';
import type { Workout } from '@/types/workout';

const oldJsonLink = (value: unknown) =>
  LZString.compressToEncodedURIComponent(JSON.stringify(value));
const linkLength = (encoded: string) => encodeURIComponent(encoded).length;

const workout: Workout = {
  title: 'Poranne HIIT – ąęłóźż',
  sets: 3,
  restBetweenSets: 60,
  exercises: [
    { name: 'Pompki', workoutDuration: 30, restDuration: 10 },
    { name: 'Burpees / przysiady', workoutDuration: 45, restDuration: 0 },
  ],
};

const typical: Workout = {
  title: 'Poranne HIIT',
  sets: 3,
  restBetweenSets: 30,
  exercises: [
    { name: 'Pompki', workoutDuration: 20, restDuration: 10 },
    { name: 'Przysiady', workoutDuration: 20, restDuration: 10 },
    { name: 'Burpees', workoutDuration: 20, restDuration: 0 },
  ],
};

describe('encodeWorkout / decodeWorkout', () => {
  it('round-trips a workout through the URL format', () => {
    expect(decodeWorkout(encodeWorkout(workout))).toEqual(workout);
    expect(decodeWorkout(encodeWorkout(typical))).toEqual(typical);
  });

  it('writes the compact version 2 format: values only, in a fixed order', () => {
    expect(LINK_FORMAT_VERSION).toBe(2);
    expect(encodeWorkout(typical)).toBe(
      '2~Poranne HIIT~3~30~Pompki.20.10~Przysiady.20.10~Burpees.20.0',
    );
  });

  it('keeps a typical link short', () => {
    expect(linkLength(encodeWorkout(typical))).toBeLessThanOrEqual(70);
  });

  it('compresses only when that makes the link shorter', () => {
    const repetitive: Workout = {
      title: 'Obwód',
      sets: 2,
      restBetweenSets: 30,
      exercises: Array.from({ length: 12 }, () => ({
        name: 'Przysiady z wyskokiem',
        workoutDuration: 30,
        restDuration: 15,
      })),
    };
    const encoded = encodeWorkout(repetitive);

    expect(encoded.startsWith('z')).toBe(true);
    expect(decodeWorkout(encoded)).toEqual(repetitive);
    expect(encodeWorkout(typical).startsWith('z')).toBe(false);
  });

  it('keeps names that contain the separator characters intact', () => {
    const tricky: Workout = {
      title: 'Plan 2.0 ~ wersja \\ testowa',
      sets: 2,
      restBetweenSets: 15,
      exercises: [
        { name: 'Wiosłowanie 1.5 kg', workoutDuration: 25, restDuration: 5 },
        { name: 'A~B.C\\D', workoutDuration: 10, restDuration: 0 },
        { name: '', workoutDuration: 30, restDuration: 10 },
      ],
    };

    expect(decodeWorkout(encodeWorkout(tricky))).toEqual(tricky);
  });

  it('handles a workout without exercises', () => {
    const empty: Workout = { title: '', sets: 1, restBetweenSets: 0, exercises: [] };

    expect(encodeWorkout(empty)).toBe('2~~1~0');
    expect(decodeWorkout(encodeWorkout(empty))).toEqual(empty);
  });

  it('turns numbers that were being typed into valid values', () => {
    const typing = {
      ...typical,
      sets: '' as unknown as number,
      exercises: [{ name: 'Pompki', workoutDuration: 2.6, restDuration: '' as unknown as number }],
    };

    expect(decodeWorkout(encodeWorkout(typing))).toMatchObject({
      sets: 1,
      exercises: [{ name: 'Pompki', workoutDuration: 3, restDuration: 0 }],
    });
  });
});

describe('decodeWorkout – old links are not supported', () => {
  it.each([
    ['version 1 links', { v: 1, ...workout }],
    ['links from before versioning', workout],
  ])('rejects %s', (_, payload) => {
    expect(decodeWorkout(oldJsonLink(payload))).toBeNull();
  });

  it('rejects a link with another version number', () => {
    expect(decodeWorkout('1~Poranne HIIT~3~30~Pompki.20.10')).toBeNull();
    expect(decodeWorkout('3~Poranne HIIT~3~30~Pompki.20.10')).toBeNull();
  });
});

describe('decodeWorkout – broken input', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['a repeated query parameter', ['a', 'b']],
    ['a number', 5],
  ])('returns null for %s', (_, value) => {
    expect(decodeWorkout(value)).toBeNull();
  });

  it.each([
    ['missing fields', '2~Tytuł~3'],
    ['an exercise with too few parts', '2~Tytuł~3~30~Pompki.20'],
    ['an exercise with too many parts', '2~Tytuł~3~30~Pompki.20.10.5'],
  ])('returns null for a compact link with %s', (_, value) => {
    expect(decodeWorkout(value)).toBeNull();
  });

  it('returns null for text that is not a workout link', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(decodeWorkout('%%%garbage')).toBeNull();
    expect(decodeWorkout('zzzz')).toBeNull();
    expect(decodeWorkout(`z${LZString.compressToEncodedURIComponent('not a workout')}`)).toBeNull();
  });
});
