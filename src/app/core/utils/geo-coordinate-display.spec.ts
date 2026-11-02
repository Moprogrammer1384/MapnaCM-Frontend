import { formatGeoCoordinate, formatLatitude, formatLongitude } from './geo-coordinate-display';

describe('Coordinate presentation', () => {
  it('adds cardinal directions from the sign without rounding the magnitude', () => {
    expect(formatLatitude(35.68923456789123)).toBe('35.68923456789123° N');
    expect(formatLatitude(-35.68923456789123)).toBe('35.68923456789123° S');
    expect(formatLongitude(51.3890987654321)).toBe('51.3890987654321° E');
    expect(formatLongitude(-51.3890987654321)).toBe('51.3890987654321° W');
    expect(formatGeoCoordinate(-35.7, -51.4)).toBe('35.7° S, 51.4° W');
  });

  it('handles zero, boundaries and unavailable values', () => {
    expect(formatGeoCoordinate(0, 0)).toBe('0° N, 0° E');
    expect(formatGeoCoordinate(-90, -180)).toBe('90° S, 180° W');
    for (const value of [null, undefined, NaN, Infinity, -Infinity, 91]) {
      expect(formatLatitude(value)).toBe('\u2014');
    }
    expect(formatLongitude(181)).toBe('\u2014');
  });
});
