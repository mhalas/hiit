import { describe, expect, it } from 'vitest';
import {
    createEmptyWorkout, isValidInt, isWorkoutValid, normalizeWorkout, sanitizeWorkout, toValidInt,
} from '@/utils/workout';
import type { Workout } from '@/types/workout';

describe('toValidInt', () => {
    it.each([
        [5, 'sets', 5],
        [2.6, 'workoutDuration', 3],
        [0, 'sets', 1],
        [-5, 'restBetweenSets', 0],
        ['15', 'restDuration', 15],
        ['', 'sets', 1],
        ['', 'workoutDuration', 30],
        ['abc', 'restDuration', 0],
        [Number.NaN, 'sets', 1],
        [Number.POSITIVE_INFINITY, 'sets', 1],
        [null, 'restBetweenSets', 0],
        [undefined, 'workoutDuration', 30],
    ] as const)('toValidInt(%j, %s) = %i', (value, field, expected) => {
        expect(toValidInt(value, field)).toBe(expected);
    });
});

describe('isValidInt', () => {
    it('accepts whole numbers at or above the minimum', () => {
        expect(isValidInt(1, 'sets')).toBe(true);
        expect(isValidInt(0, 'restDuration')).toBe(true);
    });

    it.each([
        [0, 'sets'],
        [0, 'workoutDuration'],
        [-1, 'restDuration'],
        [2.5, 'sets'],
        ['', 'sets'],
        ['3', 'sets'],
    ] as const)('rejects %j for %s', (value, field) => {
        expect(isValidInt(value, field)).toBe(false);
    });
});

describe('sanitizeWorkout', () => {
    it('fixes every number in place and leaves names alone', () => {
        const workout = {
            title: 'T',
            sets: '' as unknown as number,
            restBetweenSets: -3,
            exercises: [{ name: 'Pompki', workoutDuration: 2.4, restDuration: '' as unknown as number }],
        };

        sanitizeWorkout(workout);

        expect(workout).toEqual({
            title: 'T',
            sets: 1,
            restBetweenSets: 0,
            exercises: [{ name: 'Pompki', workoutDuration: 2, restDuration: 0 }],
        });
    });
});

describe('isWorkoutValid', () => {
    const valid: Workout = {
        title: '',
        sets: 2,
        restBetweenSets: 30,
        exercises: [{ name: 'x', workoutDuration: 20, restDuration: 10 }],
    };

    it('accepts a complete workout', () => {
        expect(isWorkoutValid(valid)).toBe(true);
    });

    it('rejects a workout without exercises', () => {
        expect(isWorkoutValid(createEmptyWorkout())).toBe(false);
    });

    it('rejects a workout with an invalid number', () => {
        expect(isWorkoutValid({ ...valid, sets: 0 })).toBe(false);
        expect(isWorkoutValid({ ...valid, exercises: [{ name: 'x', workoutDuration: 1.5, restDuration: 0 }] })).toBe(false);
    });
});

describe('normalizeWorkout', () => {
    it.each([
        ['null', null],
        ['a number', 42],
        ['a string', 'workout'],
        ['an array', []],
        ['an object without exercises', { title: 'x' }],
        ['exercises that are not an array', { exercises: {} }],
        ['an exercise that is not an object', { exercises: [5] }],
    ])('returns null for %s', (_, value) => {
        expect(normalizeWorkout(value)).toBeNull();
    });

    it('fills in missing or wrong-typed fields', () => {
        expect(normalizeWorkout({
            title: 123,
            sets: '',
            restBetweenSets: -5,
            exercises: [{ name: 'p', workoutDuration: 2.6, restDuration: '' }, { workoutDuration: 0, restDuration: '15' }],
        })).toEqual({
            title: '',
            sets: 1,
            restBetweenSets: 0,
            exercises: [
                { name: 'p', workoutDuration: 3, restDuration: 0 },
                { name: '', workoutDuration: 1, restDuration: 15 },
            ],
        });
    });

    it('drops unknown fields', () => {
        expect(normalizeWorkout({ exercises: [], extra: true, sets: 1, restBetweenSets: 0, title: '' }))
            .toEqual(createEmptyWorkout());
    });
});
