import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { VibrationChartDto } from '../../models/vibration-api.model';
import { environment } from 'src/environments/environment';
import { VibrationApiService, isVibrationDisplay, vibrationUtc } from './vibration-api.service';

describe('Native vibration API source', () => {
  let service: VibrationApiService;
  let http: HttpTestingController;
  const range = { measurementId: 42, from: '2026-10-01T08:00+03:30', to: '2026-10-01T08:01+03:30' };
  const data: VibrationChartDto = { timeOriginUtc: '2026-10-01T04:30:00Z', timeUnit: 's', series: [{
    measurementId: 42, sourceQuantity: 2, quantity: 2, unit: 5, originalSampleCount: 4, returnedPointCount: 4,
    representation: 'raw', conversionApplied: false, hasGaps: false, isFftInput: false,
    points: [1.123456789123, -2, 3, -4].map((y, x) => ({ x, y, breakBefore: x === 0 })),
    statistics: { min: -4, max: 3, rms: 2, peak: 4, mean: 0, peakToPeak: 7 },
  }] };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(VibrationApiService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses the automatic raw/summary endpoint with the real measurement and UTC range, preserving seconds and values', () => {
    service.load(range).subscribe(raw => {
      if (isVibrationDisplay(raw)) { fail('Expected raw record'); return; }
      expect(raw.timeUnit).toBe('s'); expect(raw.time).toEqual([0, 1, 2, 3]);
      expect(raw.values).toEqual(data.series[0].points.map(point => point.y)); expect(raw.values[0]).toBe(1.123456789123);
      expect(raw.quantity).toBe('velocity'); expect(raw.unit).toBe('mm/s');
      expect(raw.timeOriginUtc).toBe(data.timeOriginUtc); expect(Object.isFrozen(raw)).toBeTrue();
    });
    const req = http.expectOne(request => request.url === `${environment.apiUrl}/TimeDomain/Get`);
    expect(req.request.params.get('MeasurementId')).toBe('42');
    expect(req.request.params.get('From')).toBe('2026-10-01T04:30:00.000Z');
    expect(req.request.params.get('To')).toBe('2026-10-01T04:31:00.000Z');
    expect(req.request.params.keys().sort()).toEqual(['From', 'MeasurementId', 'To']);
    expect(req.request.params.has('Quantity')).toBeFalse();
    req.flush({ success: true, data });
    http.expectNone(() => true);
  });

  it('loads each measurement in one request with only user filters and backend-owned limits', () => {
    for (const measurementId of [1, 4, 1004]) {
      service.load({ ...range, measurementId }).subscribe();
      const req = http.expectOne(request => request.url.endsWith('/Get'));
      expect(req.request.params.keys().sort()).toEqual(['From', 'MeasurementId', 'To']);
      req.flush({ success: true, data: { ...data, series: [{ ...data.series[0], measurementId }] } });
      http.expectNone(() => true);
    }
  });

  it('accepts a server-selected raw size above the former local 100000-point limit without trimming it', () => {
    const count = 100001;
    const time = Array.from({ length: count }, (_, index) => index);
    const values = time.map(value => value / 1003);
    const points = time.map((x, index) => ({ x, y: values[index], breakBefore: index === 0 }));
    service.load(range).subscribe(record => {
      if (isVibrationDisplay(record)) { fail('Expected native raw data'); return; }
      expect(record.time.length).toBe(count); expect(record.values.length).toBe(count);
      expect(record.values[count - 1]).toBe(values[count - 1]);
    });
    http.expectOne(req => req.url.endsWith('/Get')).flush({ success: true, data: {
      ...data, series: [{ ...data.series[0], points, originalSampleCount: count, returnedPointCount: count }],
    } });
    http.expectNone(() => true);
  });

  it('accepts the backend summary decision without raw re-downloads or client chunking', () => {
    const summary = { ...data, series: [{ ...data.series[0], originalSampleCount: 9000000, representation: 'minmax-statistical-envelope' }] };
    service.load(range).subscribe(record => {
      expect(isVibrationDisplay(record)).toBeTrue();
      if (isVibrationDisplay(record)) { expect(record.series.originalSampleCount).toBe(9000000); }
    });
    http.expectOne(req => req.url.endsWith('/Get')).flush({ success: true, data: summary });
    http.expectNone(() => true);
  });

  it('preserves HTTP validation details and permits an explicit retry', () => {
    service.load(range).subscribe({ error: error => expect(error.message).toContain('contiguous') });
    http.expectOne(req => req.url.endsWith('/Get')).flush({ errors: { From: ['Select a contiguous interval'] } }, { status: 400, statusText: 'Bad Request' });
    service.load(range).subscribe(raw => { if (!isVibrationDisplay(raw)) { expect(raw.values.length).toBe(4); } else { fail('Expected raw'); } });
    http.expectOne(req => req.url.endsWith('/Get')).flush({ success: true, data });
    http.expectNone(() => true);
  });

  it('cancels HTTP when the selected range or chart is disposed', () => {
    const subscription = service.load(range).subscribe();
    const req = http.expectOne(request => request.url.endsWith('/Get'));
    subscription.unsubscribe(); expect(req.cancelled).toBeTrue();
  });

  it('preserves the explicit raw profile and full-precision values provided by Get', () => {
    service.load(range).subscribe(record => {
      if (isVibrationDisplay(record)) { fail('Expected raw'); return; }
      expect(record.unit).toBe('cm/s'); expect(record.values[0]).toBe(0.123456789123);
    });
    http.expectOne(req => req.url.endsWith('/Get')).flush({ success: true, data: {
      ...data, series: [{ ...data.series[0], unit: 6, points: [0.123456789123, -0.2, 0.3, -0.4]
        .map((y, x) => ({ x, y, breakBefore: x === 0 })) }],
    } });
    http.expectNone(() => true);
  });

  it('keeps raw selections with gaps or incomplete sample counts out of the numerical pipeline', () => {
    service.load(range).subscribe(record => expect(isVibrationDisplay(record)).toBeTrue());
    http.expectOne(req => req.url.endsWith('/Get')).flush({ success: true, data: { ...data, series: [{ ...data.series[0],
      points: data.series[0].points.map((point, index) => ({ ...point, breakBefore: index === 0 || index === 2 })),
    }] } });
    service.load(range).subscribe({ next: () => fail('Expected incomplete raw record'), error: error => expect(error.message).toContain('incomplete raw') });
    http.expectOne(req => req.url.endsWith('/Get')).flush({ success: true, data: { ...data,
      series: [{ ...data.series[0], originalSampleCount: 10 }],
    } });
    http.expectNone(() => true);
  });

  it('rejects inconsistent time units and source profiles', () => {
    for (const invalid of [{ ...data, timeUnit: 'ms' }, { ...data, series: [{ ...data.series[0], quantity: 1, unit: 5 }] },
      { ...data, series: [] }]) {
      service.load(range).subscribe({ next: () => fail('Expected error'), error: error => expect(error.message).toBeTruthy() });
      http.expectOne(req => req.url.endsWith('/Get')).flush({ success: true, data: invalid });
    }
  });

  it('validates the picker range before HTTP and respects local wall-clock time', () => {
    service.load({ ...range, to: range.from }).subscribe({ error: error => expect(error.message).toContain('end time') });
    expect(vibrationUtc('2026-10-24T12:30')).toBe(new Date(2026, 9, 24, 12, 30).toISOString());
    http.expectNone(() => true);
  });
});
