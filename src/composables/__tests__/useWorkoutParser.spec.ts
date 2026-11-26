import { describe, expect, it, vi } from 'vitest';
import LZString from 'lz-string';
import { useWorkoutParser } from '@/composables/useWorkoutParser';
import type { Workout } from '@/types/workout';

const { encodeWorkout, decodeWorkout } = useWorkoutParser();

const encodeRaw = (value: unknown) => LZString.compressToEncodedURIComponent(JSON.stringify(value));

const workout: Workout = {
    title: 'Poranne HIIT – ąęłóźż',
    sets: 3,
    restBetweenSets: 60,
    exercises: [
        { name: 'Pompki', workoutDuration: 30, restDuration: 10 },
        { name: 'Burpees / przysiady', workoutDuration: 45, restDuration: 0 },
    ],
};

describe('useWorkoutParser', () => {
    it('round-trips a workout through the URL format', () => {
        expect(decodeWorkout(encodeWorkout(workout))).toEqual(workout);
    });

    it('produces a URL-safe string', () => {
        expect(encodeWorkout(workout)).toMatch(/^[A-Za-z0-9+\-$]+$/);
    });

    it.each([
        ['undefined', undefined],
        ['null', null],
        ['an empty string', ''],
        ['a repeated query parameter', ['a', 'b']],
        ['a number', 5],
    ])('returns null for %s', (_, value) => {
        expect(decodeWorkout(value)).toBeNull();
    });

    it('returns null for text that is not a compressed workout', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(decodeWorkout('%%%garbage')).toBeNull();
        expect(decodeWorkout(LZString.compressToEncodedURIComponent('not json'))).toBeNull();
    });

    it('returns null for valid JSON with the wrong shape', () => {
        expect(decodeWorkout(encodeRaw({ title: 'x' }))).toBeNull();
    });

    it('cleans up bad numbers from older or edited links', () => {
        const decoded = decodeWorkout(encodeRaw({
            title: 'Old link',
            sets: '',
            restBetweenSets: 0,
            exercises: [{ name: 'x', workoutDuration: 20, restDuration: '' }],
        }));

        expect(decoded).toEqual({
            title: 'Old link',
            sets: 1,
            restBetweenSets: 0,
            exercises: [{ name: 'x', workoutDuration: 20, restDuration: 0 }],
        });
    });
});
