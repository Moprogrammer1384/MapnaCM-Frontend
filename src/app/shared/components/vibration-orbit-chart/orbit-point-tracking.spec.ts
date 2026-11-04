import { nearestOrbitSample } from './orbit-point-tracking';

describe('Orbit polyline sample hit testing', () => {
  it('finds the nearest discrete sample even between distant endpoints', () => {
    expect(nearestOrbitSample([[0, 0], [100, 0]], [40, 2], null)).toBe(0);
    expect(nearestOrbitSample([[0, 0], [100, 0]], [70, 2], null)).toBe(1);
    expect(nearestOrbitSample([[0, 0], [100, 0]], [40, 20], null)).toBeNull();
  });
  it('retains the current chronological branch when repeated revolutions overlap', () => {
    const pixels = [[0, 0], [10, 0], [0, 0], [10, 0]] as const;
    expect(nearestOrbitSample(pixels, [10, 0], null)).toBe(1);
    expect(nearestOrbitSample(pixels, [10, 0], 3)).toBe(3);
  });
  it('handles coincident samples and ignores invalid or missing geometry', () => {
    expect(nearestOrbitSample([[5, 5], [5, 5]], [5, 5], null)).toBe(0);
    expect(nearestOrbitSample([[NaN, 0], [10, 0]], [5, 0], null)).toBeNull();
    expect(nearestOrbitSample([], [5, 0], null)).toBeNull();
  });
});
