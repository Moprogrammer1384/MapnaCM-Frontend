import { zoomPositionRanges } from './rotor-position-zoom';

describe('Controlled Centerline zoom', () => {
  it('keeps the point under the cursor fixed on each axis and uses a small equal step', () => {
    const [x, y] = zoomPositionRanges({ start: 10, end: 90 }, { start: 5, end: 85 }, -0.06, 0.25, 0.8);
    expect(x.end - x.start).toBeCloseTo(y.end - y.start, 12);
    expect(80 / (x.end - x.start)).toBeLessThan(1.07);
    expect(x.start + (x.end - x.start) * 0.25).toBeCloseTo(30, 12);
    expect(y.start + (y.end - y.start) * 0.8).toBeCloseTo(69, 12);
  });
  it('limits extreme gestures and accumulated zoom, and reverses the same wheel step without drift', () => {
    let [x, y] = zoomPositionRanges({ start: 0, end: 100 }, { start: 0, end: 100 }, -1000, 0.5, 0.5);
    expect(x.end - x.start).toBeGreaterThan(92);
    const restored = zoomPositionRanges(x, y, 1000, 0.5, 0.5);
    expect(restored[0].start).toBeCloseTo(0, 12); expect(restored[0].end).toBeCloseTo(100, 12);
    for (let i = 0; i < 200; i++) { [x, y] = zoomPositionRanges(x, y, -0.08, 0.1, 0.9); }
    expect(x.end - x.start).toBeCloseTo(5, 12); expect(y.end - y.start).toBeCloseTo(5, 12);
    for (let i = 0; i < 200; i++) { [x, y] = zoomPositionRanges(x, y, 0.08, 0, 1); }
    expect(x).toEqual({ start: 0, end: 100 }); expect(y).toEqual({ start: 0, end: 100 });
  });
});
