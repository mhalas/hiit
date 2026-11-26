import { describe, expect, it } from 'vitest';
import { countPl, pluralPl } from '@/utils/plural';

describe('pluralPl', () => {
  it.each([
    [0, 'serii'],
    [1, 'seria'],
    [2, 'serie'],
    [4, 'serie'],
    [5, 'serii'],
    [11, 'serii'],
    [12, 'serii'],
    [14, 'serii'],
    [21, 'serii'],
    [22, 'serie'],
    [104, 'serie'],
    [112, 'serii'],
  ])('%i → %s', (count, expected) => {
    expect(pluralPl(count, 'seria', 'serie', 'serii')).toBe(expected);
  });

  it('prefixes the number with countPl', () => {
    expect(countPl(17, 'interwał', 'interwały', 'interwałów')).toBe('17 interwałów');
    expect(countPl(3, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')).toBe('3 ćwiczenia');
  });
});
