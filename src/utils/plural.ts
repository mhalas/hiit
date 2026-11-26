export function pluralPl(count: number, one: string, few: string, many: string): string {
  if (count === 1) {
    return one;
  }
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
}

export const countPl = (count: number, one: string, few: string, many: string): string =>
  `${count} ${pluralPl(count, one, few, many)}`;
