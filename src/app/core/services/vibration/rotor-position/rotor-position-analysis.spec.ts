import { DEFAULT_ROTOR_POSITION_SETTINGS as defaults } from 'src/app/core/models/rotor-position.model';
import { rotorPair, rotorRecord } from 'src/testing/rotor-position-fixture';
import { analyzeRotorPosition } from './rotor-position-analysis';
import { RotorPositionMockDataSource } from './rotor-position-mock-data-source.service';

describe('Rotor Position: calibrated DC means', () => {
  it('preserves a non-zero static position at standstill without any complete-cycle requirement', () => {
    const record = rotorRecord();
    const result = analyzeRotorPosition({ ...record, observations: record.observations.map(p => ({ ...p, meanProbeX: 12, meanProbeY: -44, speedRpm: 0 })) }, defaults);
    expect(result.points.length).toBe(4);
    result.points.forEach(point => { expect(point.x).toBeCloseTo(12, 12); expect(point.y).toBeCloseTo(-44, 12); });
  });
  it('resolves rotated probes and a non-zero calibrated reference without losing polarity', () => {
    const record = rotorRecord(), a = Math.PI / 4, b = 3 * Math.PI / 4;
    const result = analyzeRotorPosition({ ...record, probeAnglesDegrees: [45, 135],
      reference: { probeMean: [2, -3], position: [7, -9], bearingCentreKnown: true },
      observations: [{ timeSeconds: 0, meanProbeX: 2 + 12 * Math.cos(a) - 34 * Math.sin(a),
        meanProbeY: -3 + 12 * Math.cos(b) - 34 * Math.sin(b), speedRpm: null, quality: 'valid' }] }, defaults);
    expect(result.points[0].x).toBeCloseTo(19, 12); expect(result.points[0].y).toBeCloseTo(-43, 12);
    expect(result.points[0].speedRpm).toBeNull();
  });
  it('converts position and radial clearance exactly once, and offsets only on explicit first-point reference', () => {
    const record = rotorRecord(), mm = analyzeRotorPosition(record, { ...defaults, unit: 'mm' });
    expect(mm.points[0].x).toBeCloseTo(0.01, 12); expect(mm.clearance!.radialX).toBe(0.08);
    const relative = analyzeRotorPosition(record, { ...defaults, reference: 'first' });
    expect(relative.points[0].x).toBe(0); expect(relative.points[0].y).toBe(0);
    expect(relative.points[3].x).toBeCloseTo(3, 12); expect(relative.clearance).toBeUndefined();
    expect(relative.bearingCentreKnown).toBeFalse();
    expect(analyzeRotorPosition({ ...record, unit: 'mm', observations: record.observations.map(p => ({ ...p, meanProbeX: 0.01, meanProbeY: -0.04 })) }, defaults).points[0].x).toBeCloseTo(10, 12);
  });
  it('rejects AC-only, unsynchronized, parallel-probe and invalid clearance inputs', () => {
    const record = rotorRecord();
    for (const invalid of [{ ...record, dcPreserved: false }, { ...record, synchronized: false },
      { ...record, probeAnglesDegrees: [0, 180] as const }, { ...record, clearance: { radialX: -1, radialY: 80 } }]) {
      expect(() => analyzeRotorPosition(invalid, defaults)).toThrowError();
    }
  });
  it('does not invent a bearing centre or eccentricity when only relative movement is known', () => {
    const record = rotorRecord(), unknown = { ...record, reference: { ...record.reference, bearingCentreKnown: false } };
    expect(() => analyzeRotorPosition(unknown, defaults)).toThrowError(/bearing centre is unknown/);
    expect(analyzeRotorPosition(unknown, { ...defaults, reference: 'first' }).bearingCentreKnown).toBeFalse();
  });
  it('breaks traces after invalid observations and time gaps, without replacing missing speed with zero', () => {
    const record = rotorRecord();
    const result = analyzeRotorPosition({ ...record, observations: record.observations.map((p, i) =>
      i === 1 ? { ...p, meanProbeX: null } : i === 2 ? { ...p, speedRpm: NaN } : p) }, defaults);
    expect(result.omittedCount).toBe(1); expect(result.points.length).toBe(3);
    expect(result.points[1].breakBefore).toBeTrue(); expect(result.points[1].speedRpm).toBeNull();
    const gap = analyzeRotorPosition({ ...record, observations: [record.observations[0], record.observations[3]] }, defaults);
    expect(gap.points[1].breakBefore).toBeTrue();
  });
  it('rejects unsorted timestamps and returns an empty analysis for an empty acquisition', () => {
    const record = rotorRecord();
    expect(() => analyzeRotorPosition({ ...record, observations: [record.observations[1], record.observations[0]] }, defaults)).toThrowError(/increasing/);
    expect(analyzeRotorPosition({ ...record, observations: [] }, defaults).points).toEqual([]);
  });
});

describe('Separated Rotor Position demonstration source', () => {
  it('offers several exact events per day, only Startup/CoastDown/Trip, with independent valid position records', () => {
    const source = new RotorPositionMockDataSource(), pair = rotorPair();
    source.listEvents([pair]).subscribe(events => {
      expect(events.length).toBe(9); expect(events.filter(e => e.from.startsWith('2026-11-08')).length).toBe(3);
      for (const event of events) {
        expect(['Startup', 'CoastDown', 'Trip']).toContain(event.eventType);
        source.load(pair, event.id).subscribe(record => {
          expect(record!.provenance).toBe('simulated'); expect(record!.pairKey).toBe(pair.key);
          const result = analyzeRotorPosition(record!, defaults), points = result.points;
          expect(points.length).toBeGreaterThan(100);
          expect(points[points.length - 1].time).toBe((Date.parse(event.to) - Date.parse(event.from)) / 1000);
          expect(points[0].speedRpm).toBe(event.eventType === 'Startup' ? 0 : 3000);
          expect(points[points.length - 1].speedRpm).toBe(event.eventType === 'Startup' ? 3000 : 0);
          expect(Math.abs(points[0].y - points[points.length - 1].y)).toBeGreaterThan(35);
        });
      }
    });
    source.listEvents([]).subscribe(events => expect(events).toEqual([]));
    source.load(pair, 'not-a-record').subscribe(record => expect(record).toBeNull());
  });
});
