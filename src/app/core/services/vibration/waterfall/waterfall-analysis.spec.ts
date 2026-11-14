import { fakeAsync, tick } from '@angular/core/testing';
import { DEFAULT_WATERFALL_SETTINGS as defaults, WaterfallEventType, WaterfallRequest } from '../../../models/waterfall.model';
import { analyzeWaterfall, prepareWaterfall } from './waterfall-analysis';
import { createMockWaterfall, mockWaterfallEvents, MockWaterfallDataSource } from './waterfall-data-source.service';

const requestFor = (type: WaterfallEventType): WaterfallRequest => ({
  measurementId: 6, eventId: mockWaterfallEvents().find(event => event.eventType === type)!.id,
});

describe('Waterfall daily acquisition catalogue and spectral analysis', () => {
  it('keeps one or two steady recordings every day and retains every distinct transient, including repeated startups', () => {
    const events = mockWaterfallEvents(), days = [...new Set(events.map(event => event.from.slice(0, 10)))];
    expect(days.length).toBe(14); expect(new Set(events.map(event => event.id)).size).toBe(events.length);
    for (const day of days) {
      const daily = events.filter(event => event.from.startsWith(day));
      const normal = daily.filter(event => event.eventType === 'SteadyState');
      expect(normal.length).withContext(day).toBeGreaterThanOrEqual(1);
      expect(normal.length).withContext(day).toBeLessThanOrEqual(2);
      expect(normal[0].from.slice(11, 16)).toBe('10:00');
      if (normal.length === 2) { expect(normal[1].from.slice(11, 16)).toBe('17:00'); }
    }
    const eventDay = events.filter(event => event.from.startsWith('2026-11-12'));
    expect(eventDay.filter(event => event.eventType === 'Startup').length).toBe(2);
    expect(eventDay.some(event => event.eventType === 'CoastDown')).toBeTrue();
    expect(eventDay.some(event => event.eventType === 'Trip')).toBeTrue();
    expect(events.filter(event => event.from.startsWith('2026-11-13')).map(event => event.eventType)).toEqual(['SteadyState']);
  });

  it('builds deterministic frames over the entire exact acquisition interval for all four types, including standstill', () => {
    for (const type of ['SteadyState', 'Startup', 'CoastDown', 'Trip'] as const) {
      const request = requestFor(type), capture = createMockWaterfall(request);
      expect(capture).toEqual(createMockWaterfall(request)); expect(capture.event.id).toBe(request.eventId);
      const duration = (Date.parse(capture.event.to + '+03:30') - Date.parse(capture.event.from + '+03:30')) / 1000;
      expect(capture.frames.length * 2).toBe(duration);
      expect(capture.frames[0].elapsedSeconds).toBe(0);
      expect(capture.frames[capture.frames.length - 1].elapsedSeconds + 2).toBe(duration);
      expect(capture.frames.every(frame => frame.raw.time.length === 1024 && frame.raw.values.length === 1024)).toBeTrue();
      if (type === 'SteadyState') { expect(capture.frames.every(frame => frame.rpm === 3000)).toBeTrue(); }
      else {
        expect(capture.frames[0].rpm).toBe(type === 'Startup' ? 0 : 3600);
        expect(capture.frames[capture.frames.length - 1].rpm).toBe(type === 'Startup' ? 3600 : 0);
      }
      expect(() => prepareWaterfall(capture)).not.toThrow();
    }
  });

  it('reuses calibrated FFT, 0.5 Hz bins, line amplitudes, CPM and physical quantity/unit conversion', () => {
    const prepared = prepareWaterfall(createMockWaterfall(requestFor('SteadyState')));
    const rms = analyzeWaterfall(prepared, defaults)[0];
    expect(rms.resolutionHz).toBeCloseTo(0.5, 10); expect(rms.nyquistHz).toBe(256);
    expect(rms.frequency.length).toBe(513); expect(rms.values[100]).toBeCloseTo(1 + 3 * Math.exp(-Math.pow(10 / 6, 2)), 8);
    expect(rms.values[200]).toBeCloseTo(0.6, 8); expect(rms.values[144]).toBeCloseTo(0.35, 8);
    const peak = analyzeWaterfall(prepared, { ...defaults, amplitude: '0p', xAxis: 'cpm' })[0];
    expect(peak.values[100] / rms.values[100]).toBeCloseTo(Math.SQRT2, 10); expect(peak.frequency[100]).toBe(3000);
    const pp = analyzeWaterfall(prepared, { ...defaults, amplitude: 'pp' })[0];
    expect(pp.values[100] / rms.values[100]).toBeCloseTo(2 * Math.SQRT2, 10);
    const um = analyzeWaterfall(prepared, { ...defaults, quantity: 'displacement', unit: 'µm' })[0];
    const mm = analyzeWaterfall(prepared, { ...defaults, quantity: 'displacement', unit: 'mm' })[0];
    expect(um.values[100]).toBeCloseTo(rms.values[100] * 1000 / (2 * Math.PI * 50), 8);
    expect(mm.values[100] * 1000).toBeCloseTo(um.values[100], 10); expect(um.values[0]).toBe(0);
  });

  it('rejects unknown acquisitions, invalid measurements and repeated frame times', () => {
    expect(() => createMockWaterfall({ measurementId: 6, eventId: 'unknown' })).toThrowError();
    expect(() => createMockWaterfall({ ...requestFor('Startup'), measurementId: 0 })).toThrowError();
    const capture = createMockWaterfall(requestFor('Startup'));
    expect(() => prepareWaterfall({ ...capture, frames: [capture.frames[0], capture.frames[0]] })).toThrowError();
  });

  it('cancels pending catalogue and acquisition work on unsubscribe', fakeAsync(() => {
    const received = jasmine.createSpy('received'), source = new MockWaterfallDataSource();
    const capture = source.load(requestFor('Trip')).subscribe(received), history = source.listEvents([6]).subscribe(received);
    capture.unsubscribe(); history.unsubscribe(); tick(200); expect(received).not.toHaveBeenCalled();
  }));
});
