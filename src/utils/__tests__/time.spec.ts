import { describe, expect, it } from 'vitest';
import { formatDuration } from '@/utils/time';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [59, '0:59'],
    [60, '1:00'],
    [230, '3:50'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
    [9.2, '0:10'],
    [-4, '0:00'],
  ])('formatDuration(%d) = %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
