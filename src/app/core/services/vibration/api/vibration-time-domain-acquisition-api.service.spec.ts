import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { VibrationTimeDomainAcquisitionApiService } from './vibration-time-domain-acquisition-api.service';

describe('Time Domain acquisition API', () => {
  let api: VibrationTimeDomainAcquisitionApiService;
  let http: HttpTestingController;
  const from = '2026-08-16T20:30:00Z';
  const to = '2026-08-16T20:30:00.8Z';
  const raw = (measurementId: number) => ({ measurementId, sourceQuantity: 2, quantity: 1, unit: 1,
    originalSampleCount: 3, returnedPointCount: 3, conversionApplied: true, hasGaps: false, representation: 'raw',
    points: [0, 1, 2].map(index => ({ x: index / 2560, y: index + measurementId, breakBefore: false })),
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), VibrationTimeDomainAcquisitionApiService] });
    api = TestBed.inject(VibrationTimeDomainAcquisitionApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('maps an exact UTC event to Tehran and uses the online duration provided by the API', () => {
    const onlineWindow = { from: '2026-08-16T20:30:00.0000001Z', to: '2026-08-20T20:30:15Z', maximumSeconds: 390 };
    api.availability([1, 4]).subscribe(result => {
      expect(result.events[0].from).toBe('2026-08-17T00:00:00');
      expect(result.events[0].label).toBe('2026-08-17 12:00:00 AM · 0.80 s');
      expect(result.maximumRecentSeconds).toBe(390);
      expect(result.onlineWindow).toEqual({ fromUtc: onlineWindow.from, toUtc: onlineWindow.to });
    });
    const request = http.expectOne(req => req.url.endsWith('/GetCaptureAvailability'));
    expect(request.request.params.getAll('MeasurementIds')).toEqual(['1', '4']);
    request.flush({ success: true, data: { timeZone: 'Asia/Tehran', events: [{ id: 'key', from, to,
      sampleCount: 2048, sampleRateHz: 2560 }], onlineWindow } });
  });

  it('shares one exact capture request for multiple channels and accepts normalized complete samples', () => {
    const selection = { from, to, measurementIds: [1, 4], sourceKey: 'exact-key' };
    for (const measurementId of [1, 4]) {
      api.load({ ...selection, measurementId }).subscribe(result => {
        expect(result.quantity).toBe('displacement');
        expect('values' in result && result.values[0]).toBe(measurementId);
      });
    }
    const request = http.expectOne(req => req.url.endsWith('/GetCaptures'));
    expect(request.request.params.get('SourceKey')).toBe('exact-key');
    expect(request.request.params.getAll('MeasurementIds')).toEqual(['1', '4']);
    request.flush({ success: true, data: { timeOriginUtc: from, timeUnit: 's', series: [raw(1), raw(4)] } });
  });

  it('requests the latest seconds on every submit and accepts complete raw points', () => {
    for (let revision = 1; revision <= 2; revision++) {
      api.load({ measurementId: 1, from: '', to: '', recentSeconds: 1, recentRevision: revision, quantity: 'velocity' })
        .subscribe(result => expect('values' in result && result.values[2]).toBe(3));
      const request = http.expectOne(req => req.url.endsWith('/GetRecent'));
      expect(request.request.params.get('Seconds')).toBe('1');
      expect(request.request.params.get('Quantity')).toBe('2');
      expect(request.request.params.has('EndedAtUtc')).toBeFalse();
      request.flush({ success: true, data: { timeOriginUtc: from, timeUnit: 's', series: [{
        ...raw(1), quantity: 2, unit: 5,
      }] } });
    }
  });

  it('shares one anchored online request and sends the exclusive end after the selected start', () => {
    const onlineStartUtc = '2026-08-18T20:29:00.000Z';
    for (const measurementId of [1, 4]) {
      api.load({ measurementId, measurementIds: [1, 4], from: '', to: '', recentSeconds: 65, onlineStartUtc })
        .subscribe(result => expect(result.timeOriginUtc).toBe(onlineStartUtc));
    }
    const request = http.expectOne(req => req.url.endsWith('/GetRecent'));
    expect(request.request.params.getAll('MeasurementIds')).toEqual(['1', '4']);
    expect(request.request.params.get('Seconds')).toBe('65');
    expect(request.request.params.get('EndedAtUtc')).toBe('2026-08-18T20:30:05.000Z');
    request.flush({ success: true, data: { timeOriginUtc: onlineStartUtc, timeUnit: 's', series: [raw(1), raw(4)] } });
  });

  it('forwards the requested duration and exposes the server rejection without emitting data', () => {
    const error = jasmine.createSpy('error');
    const next = jasmine.createSpy('next');
    api.load({ measurementId: 1, measurementIds: [1, 4], from: '', to: '', recentSeconds: 391 }).subscribe({ next, error });
    const request = http.expectOne(req => req.url.endsWith('/GetRecent'));
    expect(request.request.params.get('Seconds')).toBe('391');
    const message = 'The selected range exceeds the limit of 1,000,000 samples per measurement. Select a shorter range.';
    request.flush({ success: false, message }, { status: 400, statusText: 'Bad Request' });
    expect(next).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(jasmine.objectContaining({ error: { success: false, message } }));
  });

  it('shares an offline rejection across selected channels without emitting any points', () => {
    const request = { measurementId: 1, measurementIds: [1, 4], from, to, sourceKey: 'oversized' };
    const error = jasmine.createSpy('error');
    const next = jasmine.createSpy('next');
    api.load(request).subscribe({ next, error });
    api.load({ ...request, measurementId: 4 }).subscribe({ next, error });
    const message = 'Select fewer measurements to load this capture.';
    http.expectOne(req => req.url.endsWith('/GetCaptures'))
      .flush({ success: false, message }, { status: 400, statusText: 'Bad Request' });
    expect(next).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledWith(jasmine.objectContaining({ error: { success: false, message } }));
  });
});
