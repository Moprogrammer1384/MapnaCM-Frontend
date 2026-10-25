import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { availabilityFixture } from 'src/testing/time-availability-fixture';
import { TimeAvailabilityService } from './time-availability.service';

describe('Time availability HTTP contract', () => {
  let service: TimeAvailabilityService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TimeAvailabilityService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('discovers actual data history with repeated measurement IDs and no invented dates', () => {
    service.getAvailability([1, 4, 1]).subscribe(data => expect(data.commonRanges.length).toBe(1));
    const request = http.expectOne(req => req.url.endsWith('/TimeDomain/GetAvailability'));
    expect(request.request.params.getAll('MeasurementIds')).toEqual(['1', '4']);
    expect(request.request.params.has('From')).toBeFalse(); expect(request.request.params.has('To')).toBeFalse();
    request.flush({ success: true, data: availabilityFixture([1, 4]) });
  });

  it('sends calendar navigation dates verbatim, without UTC conversion', () => {
    service.getAvailability([4], { from: '2024-02-01', to: '2024-03-01' }).subscribe();
    const request = http.expectOne(req => req.url.endsWith('/GetAvailability'));
    expect(request.request.params.get('From')).toBe('2024-02-01');
    expect(request.request.params.get('To')).toBe('2024-03-01');
    request.flush({ success: true, data: availabilityFixture([4], { from: '2024-02-01', to: '2024-03-01' }) });
  });

  it('preserves successful no-data responses and reports business/network failures distinctly', () => {
    service.getAvailability([1]).subscribe(data => expect(data.window).toBeNull());
    http.expectOne(req => req.url.endsWith('/GetAvailability')).flush({ success: true,
      data: { ...availabilityFixture([1]), window: null, ranges: [], commonRanges: [], measurements: [{ measurementId: 1, dataBounds: null, ranges: [] }] } });
    service.getAvailability([1]).subscribe({ error: error => expect(error.message).toContain('prepare') });
    http.expectOne(req => req.url.endsWith('/GetAvailability')).flush({ success: false, message: 'Please prepare existing summaries' });
    service.getAvailability([1]).subscribe({ error: error => expect(error.message).toContain('HTTP 403') });
    http.expectOne(req => req.url.endsWith('/GetAvailability')).flush({}, { status: 403, statusText: 'Forbidden' });
  });

  it('rejects invalid IDs, malformed dates and windows beyond 366 days before HTTP', () => {
    for (const ids of [[], [0], Array.from({ length: 17 }, (_, index) => index + 1)]) {
      service.getAvailability(ids).subscribe({ next: () => fail('Expected failure'), error: error => expect(error.message).toContain('1–16') });
    }
    for (const window of [{ from: '2026-02-30', to: '2026-03-02' }, { from: '2026-01-01', to: '2028-01-01' }]) {
      service.getAvailability([1], window).subscribe({ error: error => expect(error.message).toContain('366') });
    }
    http.expectNone(() => true);
  });

  it('cancels stale reads and rejects unexpected time granularity', () => {
    const subscription = service.getAvailability([1]).subscribe();
    const request = http.expectOne(req => req.url.endsWith('/GetAvailability'));
    subscription.unsubscribe(); expect(request.cancelled).toBeTrue();
    service.getAvailability([1]).subscribe({ error: error => expect(error.message).toContain('incompatible') });
    http.expectOne(req => req.url.endsWith('/GetAvailability')).flush({ success: true, data: { ...availabilityFixture([1]), granularity: 'minute' } });
  });

  it('never treats metadata for another selection or unqueried days as proof', () => {
    for (const data of [{ ...availabilityFixture([9]) }, { ...availabilityFixture([1]),
      window: { from: '2026-10-01', to: '2026-11-01' }, commonRanges: [{ from: '2026-09-01', to: '2026-10-15' }] }]) {
      service.getAvailability([1]).subscribe({ next: () => fail('Expected invalid proof'), error: error => expect(error.message).toContain('incompatible') });
      http.expectOne(req => req.url.endsWith('/GetAvailability')).flush({ success: true, data });
    }
  });
});
