import { compareNumericText } from './table-pagination-comparators';

describe('Explicit formatted numeric table comparators', () => {
  it('compares decimal, negative, scientific and comma-grouped numbers numerically', () => {
    expect(compareNumericText('2', '10')).toBeLessThan(0);
    expect(compareNumericText('-0.25', '0')).toBeLessThan(0);
    expect(compareNumericText('.25', '0.25')).toBe(0);
    expect(compareNumericText('1e2', '100')).toBe(0);
    expect(compareNumericText('995', '1,190')).toBeLessThan(0);
  });

  it('handles blanks and unparseable text consistently without accepting numeric prefixes', () => {
    expect(compareNumericText('', '2')).toBeLessThan(0);
    expect(compareNumericText('12oops', '2')).toBeLessThan(0);
    expect(compareNumericText('1,2', '2')).toBeLessThan(0);
    expect(compareNumericText('1e999', '2')).toBeLessThan(0);
    expect(compareNumericText('unknown', 'unknown')).toBe(0);
  });
});
