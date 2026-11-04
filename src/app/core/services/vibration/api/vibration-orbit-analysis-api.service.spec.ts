import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { analyticalOrbit, orbitPair } from 'src/testing/orbit-fixture';
import { environment } from 'src/environments/environment';
import { OrbitPeriod } from '../../../models/orbit-analysis.model';
import { ORBIT_DATA_SOURCE } from '../orbit-analysis/orbit-data-source.service';
import { VibrationOrbitAnalysisApiService } from './vibration-orbit-analysis-api.service';
import { VibrationOrbitAnalysisAvailabilityApiService } from './vibration-orbit-analysis-availability-api.service';

describe('Orbit discrete acquisition HTTP contract', () => {
  let source: VibrationOrbitAnalysisApiService, http: HttpTestingController;
  const pair = () => {
    const original = orbitPair();
    return { ...original, x: { ...original.x, measurement: { ...original.x.measurement, id: 1 } },
      y: { ...original.y, measurement: { ...original.y.measurement, id: 4 } } };
  };
  const input = () => ({ pair: pair(), selection: { period: 'Daily' as OrbitPeriod, periodStart: '2026-11-04' } });
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    source = TestBed.inject(VibrationOrbitAnalysisApiService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  const pending = () => http.expectOne(request => request.url === environment.apiUrl + '/OrbitAnalysis/Get');
  const response = (record: ReturnType<typeof analyticalOrbit> | null = analyticalOrbit()) => ({ success: true,
    data: { xMeasurementId: 1, yMeasurementId: 4, period: 'Daily', periodStart: '2026-11-04', record } });

  it('requests one stored period identity with no From or To query', () => {
    expect(TestBed.inject(ORBIT_DATA_SOURCE)).toBe(source);
    source.load(input()).subscribe(record => expect(record).toEqual(analyticalOrbit()));
    const read = pending(); expect(read.request.params.get('XMeasurementId')).toBe('1');
    expect(read.request.params.get('YMeasurementId')).toBe('4'); expect(read.request.params.get('Period')).toBe('Daily');
    expect(read.request.params.get('PeriodStart')).toBe('2026-11-04'); expect(read.request.params.has('From')).toBeFalse();
    expect(read.request.params.has('To')).toBeFalse(); read.flush(response());
  });
  it('retains full one-second data without inventing missing Keyphasor or speed', () => {
    const record = { ...analyticalOrbit(), keyphasor: undefined, shaftSpeedRpm: null };
    source.load(input()).subscribe(data => { expect(data!.keyphasor).toBeUndefined(); expect(data!.shaftSpeedRpm).toBeNull(); expect(data!.time.length).toBe(6400); });
    pending().flush(response(record));
    source.load(input()).subscribe(data => expect(data!.keyphasor).toBeNull());
    pending().flush(response({ ...record, keyphasor: null } as unknown as ReturnType<typeof analyticalOrbit>));
  });
  it('accepts an absent acquisition and rejects mismatched periods or truncated captures', () => {
    source.load(input()).subscribe(data => expect(data).toBeNull()); pending().flush(response(null));
    const invalid = [
      { ...response(), data: { ...response().data, xMeasurementId: 7 } },
      response({ ...analyticalOrbit(), period: 'Weekly' }),
      response({ ...analyticalOrbit(), x: [] }),
      response({ ...analyticalOrbit(), finishedAtUtc: '2026-11-04T00:00:00.161Z' }),
    ];
    for (const payload of invalid) {
      source.load(input()).subscribe({ next: () => fail('Invalid acquisition accepted'), error: error => expect(error.message).toBeTruthy() });
      pending().flush(payload);
    }
  });
  it('preserves server errors and cancels obsolete HTTP reads', () => {
    source.load(input()).subscribe({ error: error => expect(error.error.message).toBe('Orbit unavailable') });
    pending().flush({ success: false, message: 'Orbit unavailable' }, { status: 503, statusText: 'Unavailable' });
    const subscription = source.load(input()).subscribe(); const read = pending(); subscription.unsubscribe(); expect(read.cancelled).toBeTrue();
  });
  it('discovers every cadence without asking for a date range', () => {
    for (const period of ['Daily', 'Weekly', 'Monthly', 'Quarterly'] as const) {
      TestBed.inject(VibrationOrbitAnalysisAvailabilityApiService).load([pair()], period).subscribe(data => expect(data.length).toBe(1));
      const read = http.expectOne(request => request.url.endsWith('/OrbitAnalysis/GetAvailability'));
      expect(read.request.params.getAll('MeasurementIds')).toEqual(['1', '4']); expect(read.request.params.get('Period')).toBe(period);
      expect(read.request.params.has('From')).toBeFalse(); expect(read.request.params.has('To')).toBeFalse();
      read.flush({ success: true, data: { timeZone: 'Asia/Tehran', period, acquisitions: [
        { id: '12', xMeasurementId: 1, yMeasurementId: 4, periodStart: '2026-11-04', capturedAtUtc: '2026-11-04T00:00:00Z',
          finishedAtUtc: '2026-11-04T00:00:01Z', sampleCount: 6400, sampleRateHz: 6400 },
      ] } });
    }
  });
  it('intersects exact pairs and period keys, retaining only actually common acquisitions', () => {
    const first = pair(), second = { ...first, key: 'second', x: { ...first.x, measurement: { ...first.x.measurement, id: 8 } },
      y: { ...first.y, measurement: { ...first.y.measurement, id: 9 } } };
    TestBed.inject(VibrationOrbitAnalysisAvailabilityApiService).load([first, second], 'Daily').subscribe(data => expect(data.map(row => row.periodStart)).toEqual(['2026-11-01']));
    const rows = [[1, 4, '2026-11-01'], [8, 9, '2026-11-01'], [1, 4, '2026-11-02']].map(([xMeasurementId, yMeasurementId, periodStart], i) => ({
      id: String(i), xMeasurementId, yMeasurementId, periodStart, capturedAtUtc: periodStart + 'T00:00:00Z', finishedAtUtc: periodStart + 'T00:00:01Z', sampleCount: 6400, sampleRateHz: 6400,
    }));
    http.expectOne(request => request.url.endsWith('/OrbitAnalysis/GetAvailability')).flush({ success: true, data: { timeZone: 'Asia/Tehran', period: 'Daily', acquisitions: rows } });
  });
});
