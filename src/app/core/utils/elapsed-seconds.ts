/** Subtract ISO instants without losing datetime2(7) fractions to Date's millisecond clock. */
export function elapsedSeconds(from: string, to: string): number {
  const instant = (value: string) => {
    const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,7}))?(Z|[+-]\d{2}:\d{2})?$/i);
    return match ? { whole: Date.parse(match[1] + (match[3] ?? '')) / 1000, fraction: Number(`0.${match[2] ?? '0'}`) }
      : { whole: NaN, fraction: NaN };
  };
  const start = instant(from), end = instant(to);
  return end.whole - start.whole + end.fraction - start.fraction;
}
