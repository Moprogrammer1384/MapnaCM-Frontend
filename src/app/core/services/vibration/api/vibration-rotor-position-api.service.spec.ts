import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { RotorPositionRecordDto } from '../../../models/rotor-position-api.model';
import { RotorPositionPair } from '../../../models/rotor-position.model';
import { rotorPair } from 'src/testing/rotor-position-fixture';
import { ROTOR_POSITION_DATA_SOURCE, RotorPositionDataSource } from '../rotor-position/rotor-position-data-source.service';
import { VibrationRotorPositionApiService } from './vibration-rotor-position-api.service';

describe('Rotor Position recorded API source', () => {
  let source: RotorPositionDataSource;
  let http: HttpTestingController;
  let pair: RotorPositionPair;
  const event = { operatingRunId: 42, eventType: 'Startup' as const,
    startedAtUtc: '2026-11-08T06:30:00Z', endedAtUtc: '2026-11-08T06:30:01Z' };
  function record(): RotorPositionRecordDto {
    return { ...event, id: 81, xMeasurementId: 11, yMeasurementId: 12, unit: 1,
      originalSampleCount: 2, dcPreserved: true, synchronized: true, meanWindowSeconds: .25,
      probeAnglesDegrees: [45, 135], reference: { probeMean: [0, 0], position: [0, 0], bearingCentreKnown: true },
      clearance: { radialX: 80, radialY: 80 }, observations: [
        { timeSeconds: 0, meanProbeX: -40.123456789, meanProbeY: -38, speedRpm: 0, quality: 'valid', breakBefore: false },
        { timeSeconds: .5, meanProbeX: null, meanProbeY: null, speedRpm: null, quality: 'invalid', breakBefore: true },
      ] };
  }
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    source = TestBed.inject(ROTOR_POSITION_DATA_SOURCE); http = TestBed.inject(HttpTestingController);
    const original = rotorPair();
    pair = { ...original, x: { ...original.x, measurement: { ...original.x.measurement, id: 11 } },
      y: { ...original.y, measurement: { ...original.y.measurement, id: 12 } } };
  });
  afterEach(() => http.verify());
  it('uses the API by default and selects a shared operating-event identity', () => {
    expect(source).toBe(TestBed.inject(VibrationRotorPositionApiService));
    source.listEvents([pair]).subscribe(events => {
      expect(events[0].id).toBe('42'); expect(events[0].from).toBe('2026-11-08T10:00:00');
      expect(events[0].label).toBe('2026-11-08 10:00:00 AM · Startup');
      expect(events[1].label).toBe('2026-11-08 10:00:00 AM · CoastDown');
    });
    const request = http.expectOne(req => req.url === `${environment.apiUrl}/RotorPosition/GetAvailability`);
    expect(request.request.params.getAll('XMeasurementIds')).toEqual(['11']);
    expect(request.request.params.getAll('YMeasurementIds')).toEqual(['12']);
    request.flush({ success: true, data: { timeZone: 'Asia/Tehran', events: [event, { ...event, operatingRunId: 43, eventType: 'CoastDown' }] } });
  });
  it('keeps recorded DC, standstill, unknown RPM and quality gaps without generated replacements', () => {
    source.load(pair, '42').subscribe(value => {
      expect(value!.id).toBe('81'); expect(value!.event.id).toBe('42');
      expect(value!.observations[0].meanProbeX).toBe(-40.123456789);
      expect(value!.observations[0].speedRpm).toBe(0);
      expect(value!.observations[1].meanProbeX).toBeNull(); expect(value!.observations[1].speedRpm).toBeNull();
      expect(value!.observations[1].breakBefore).toBeTrue();
    });
    const request = http.expectOne(req => req.url.endsWith('/RotorPosition/Get'));
    expect(request.request.params.get('OperatingRunId')).toBe('42'); request.flush({ success: true, data: record() });
  });
  it('retains sub-millisecond event intervals', () => {
    source.load(pair, '42').subscribe(value => {
      expect(value!.observations[1].timeSeconds).toBe(.0000001);
      expect(value!.event.from).toBe('2026-11-08T10:00:00.0000001');
      expect(value!.event.to).toBe('2026-11-08T10:00:00.0000003');
      expect(value!.event.label).toBe('2026-11-08 10:00:00 AM · Startup');
    });
    const data = record();
    http.expectOne(req => req.url.endsWith('/RotorPosition/Get')).flush({ success: true, data: {
      ...data, startedAtUtc: '2026-11-08T06:30:00.0000001Z', endedAtUtc: '2026-11-08T06:30:00.0000003Z',
      observations: data.observations.map((point, i) => ({ ...point, timeSeconds: i * .0000001 })),
    } });
  });
  it('returns an empty recorded history and a missing capture without a fallback', () => {
    source.listEvents([pair]).subscribe(events => expect(events).toEqual([]));
    http.expectOne(req => req.url.endsWith('/GetAvailability')).flush({ success: true, data: { timeZone: 'Asia/Tehran', events: [] } });
    source.load(pair, '42').subscribe(value => expect(value).toBeNull());
    http.expectOne(req => req.url.endsWith('/RotorPosition/Get')).flush({ success: true, data: null });
  });
  for (const [name, change] of [
    ['another event', { operatingRunId: 43 }], ['another probe', { xMeasurementId: 13 }],
    ['missing DC preservation', { dcPreserved: false }], ['incomplete data', { originalSampleCount: 3 }],
  ] as const) {
    it(`rejects ${name}`, () => {
      let failure = '';
      source.load(pair, '42').subscribe({ next: () => fail('Invalid capture accepted'), error: (error: Error) => failure = error.message });
      http.expectOne(req => req.url.endsWith('/RotorPosition/Get')).flush({ success: true, data: { ...record(), ...change } });
      expect(failure).toContain('incomplete or mismatched');
    });
  }
  it('rejects duplicate probe roles before requesting data', () => {
    source.listEvents([pair, pair]).subscribe({ next: () => fail('Duplicate pair accepted'), error: (error: Error) => expect(error.message).toContain('unambiguous') });
    http.expectNone(req => req.url.endsWith('/GetAvailability'));
  });
  it('preserves an API failure without replacing it with local data', () => {
    source.load(pair, '42').subscribe({ next: () => fail('Failed request returned data'), error: error => expect(error.status).toBe(503) });
    http.expectOne(req => req.url.endsWith('/RotorPosition/Get')).flush({ success: false, message: 'Unavailable' }, { status: 503, statusText: 'Unavailable' });
  });
});
