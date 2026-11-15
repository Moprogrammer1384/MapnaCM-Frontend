import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { VibrationSignalIndicatorSettingsApiService } from './vibration-signal-indicator-settings-api.service';

describe('Signal indicator settings HTTP adapter', () => {
  let api: VibrationSignalIndicatorSettingsApiService, http: HttpTestingController;
  const row = { id: 1, quantity: 1, unit: 1, metric: 1,
    upperNormal: 10, upperCaution: 12, upperDanger: 14 };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(VibrationSignalIndicatorSettingsApiService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('reads the independent endpoint and preserves all three upper physical limits in SI units', () => {
    api.load().subscribe(settings => {
      expect(settings[0].quantity).toBe('displacement'); expect(settings[0].metric).toBe('rms');
      expect(settings[0].limitsSi.upperNormal).toBeCloseTo(10e-6, 15); expect(settings[0].limitsSi.upperDanger).toBeCloseTo(14e-6, 15);
    });
    const request = http.expectOne(r => r.url.endsWith('/SignalIndicatorSettings/Get'));
    expect(request.request.method).toBe('GET'); expect(request.request.params.keys()).toEqual([]);
    request.flush({ success: true, data: [row] });
  });
  it('returns missing configuration as empty without inventing limits', () => {
    api.load().subscribe(settings => expect(settings).toEqual([]));
    http.expectOne(r => r.url.endsWith('/SignalIndicatorSettings/Get')).flush({ success: true, data: [] });
  });
  it('rejects duplicate metrics, invalid ordering and non-numeric limits', () => {
    for (const data of [[row, row], [{ ...row, upperCaution: 10 }],
      [{ ...row, upperDanger: null }], [{ ...row, quantity: 2, unit: 1 }], [{ ...row, metric: 4 }]]) {
      api.load().subscribe({ next: () => fail('Invalid settings accepted'), error: error => expect(error.message).toBeTruthy() });
      http.expectOne(r => r.url.endsWith('/SignalIndicatorSettings/Get')).flush({ success: true, data });
    }
  });
  it('retains errors and cancels in-flight requests', () => {
    api.load().subscribe({ error: error => expect(error.message).toContain('Unavailable settings') });
    http.expectOne(r => r.url.endsWith('/SignalIndicatorSettings/Get')).flush({ message: 'Unavailable settings' }, { status: 503, statusText: 'Unavailable' });
    const subscription = api.load().subscribe(); const pending = http.expectOne(r => r.url.endsWith('/SignalIndicatorSettings/Get'));
    subscription.unsubscribe(); expect(pending.cancelled).toBeTrue();
  });
});
