import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { WaterfallRecordDto } from '../../../models/waterfall-api.model';
import { DEFAULT_WATERFALL_SETTINGS } from '../../../models/waterfall.model';
import { WATERFALL_DATA_SOURCE } from '../waterfall/waterfall-data-source.service';
import { analyzeWaterfall, prepareWaterfall } from '../waterfall/waterfall-analysis';
import { VibrationWaterfallApiService } from './vibration-waterfall-api.service';

function record(): WaterfallRecordDto {
  return { id: 7, acquisitionEventId: 42, measurementId: 6, eventType: 'Startup',
    startedAtUtc: '2026-11-02T04:30:00.0000001Z', endedAtUtc: '2026-11-02T04:30:05.0000001Z',
    quantity: 2, unit: 5, sampleRateHz: 64, samplesPerFrame: 64, frameCount: 2, originalSampleCount: 128,
    frames: [{ acquisitionSampleIndex: 0, sampledAtUtc: '2026-11-02T04:30:00.0000001Z', speedRpm: 0,
      values: Array.from({ length: 64 }, (_, i) => 2 * Math.SQRT2 * Math.sin(2 * Math.PI * 4 * i / 64)) },
    { acquisitionSampleIndex: 3, sampledAtUtc: '2026-11-02T04:30:03.0000002Z', speedRpm: null,
      values: Array.from({ length: 64 }, (_, i) => Math.sin(2 * Math.PI * 8 * i / 64)) }] };
}
describe('Waterfall recorded-frame HTTP integration', () => {
  let source: VibrationWaterfallApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    source = TestBed.inject(VibrationWaterfallApiService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('defaults to HTTP and discovers exact shared event identities with source state/speed metadata', () => {
    expect(TestBed.inject(WATERFALL_DATA_SOURCE)).toBe(source);
    source.listEvents([6, 9]).subscribe(events => {
      expect(events.map(event => event.id)).toEqual(['42', '43']);
      expect(events[0].from).toBe('2026-11-02T08:00:00.0000001');
      expect(events[0].eventType).toBe('Startup'); expect(events[1].hasSpeed).toBeFalse();
    });
    const request = http.expectOne(req => req.url === environment.apiUrl + '/Waterfall/GetAvailability');
    expect(request.request.method).toBe('GET'); expect(request.request.params.getAll('MeasurementIds')).toEqual(['6', '9']);
    const event = record();
    request.flush({ success: true, data: { timeZone: 'Asia/Tehran', events: [
      { ...event, hasSpeed: true }, { ...event, acquisitionEventId: 43, eventType: 'SteadyState', hasSpeed: false }] } });
  });
  it('keeps native precision, missing RPM, 100ns offsets and independent frames through the existing FFT', () => {
    const native = record();
    source.load({ measurementId: 6, eventId: '42' }).subscribe(capture => {
      expect(capture).not.toBeNull(); expect(capture!.event.id).toBe('42'); expect(capture!.event.hasSpeed).toBeFalse();
      expect(capture!.frames[1].elapsedSeconds).toBeCloseTo(3.0000001, 9);
      expect(capture!.frames[0].rpm).toBe(0); expect(capture!.frames[1].rpm).toBeNull();
      expect(capture!.frames[0].raw.values).toEqual(native.frames[0].values);
      const spectra = analyzeWaterfall(prepareWaterfall(capture!), { ...DEFAULT_WATERFALL_SETTINGS, window: 'rectangular' });
      expect(spectra[0].peakFrequency).toBe(4); expect(spectra[0].max).toBeCloseTo(2, 10);
      expect(spectra[1].peakFrequency).toBe(8);
      expect(analyzeWaterfall(prepareWaterfall(capture!), { ...DEFAULT_WATERFALL_SETTINGS, window: 'rectangular', quantity: 'displacement', unit: 'µm' })[0].max)
        .toBeCloseTo(2 * 1000 / (2 * Math.PI * 4), 8);
    });
    const request = http.expectOne(req => req.url.endsWith('/Waterfall/Get'));
    expect(request.request.params.get('AcquisitionEventId')).toBe('42'); expect(request.request.params.get('MeasurementId')).toBe('6');
    request.flush({ success: true, data: native });
  });
  it('returns empty history/null acquisitions and propagates HTTP failures without generated replacements', () => {
    source.listEvents([6]).subscribe(events => expect(events).toEqual([]));
    http.expectOne(req => req.url.endsWith('/GetAvailability')).flush({ success: true, data: { timeZone: 'Asia/Tehran', events: [] } });
    source.load({ measurementId: 6, eventId: '42' }).subscribe(value => expect(value).toBeNull());
    http.expectOne(req => req.url.endsWith('/Waterfall/Get')).flush({ success: true, data: null });
    const failed = jasmine.createSpy('failed'); source.load({ measurementId: 6, eventId: '42' }).subscribe({ error: failed });
    http.expectOne(req => req.url.endsWith('/Waterfall/Get')).flush({ success: false }, { status: 500, statusText: 'Error' });
    expect(failed).toHaveBeenCalledTimes(1);
  });
  for (const [name, change] of [
    ['event identity', (data: WaterfallRecordDto) => ({ ...data, acquisitionEventId: 43 })],
    ['channel identity', (data: WaterfallRecordDto) => ({ ...data, measurementId: 9 })],
    ['total count', (data: WaterfallRecordDto) => ({ ...data, originalSampleCount: 127 })],
    ['quantity/unit', (data: WaterfallRecordDto) => ({ ...data, unit: 1 })],
    ['clock membership', (data: WaterfallRecordDto) => ({ ...data, frames: [data.frames[0], { ...data.frames[1], acquisitionSampleIndex: 0 }] })],
    ['frame boundary', (data: WaterfallRecordDto) => ({ ...data, frames: [data.frames[0], { ...data.frames[1], sampledAtUtc: data.endedAtUtc }] })],
    ['sample count', (data: WaterfallRecordDto) => ({ ...data, frames: [{ ...data.frames[0], values: [1, 2, 3] }, data.frames[1]] })],
    ['nonfinite values', (data: WaterfallRecordDto) => ({ ...data, frames: [{ ...data.frames[0], values: data.frames[0].values.map((v, i) => i === 0 ? NaN : v) }, data.frames[1]] })],
    ['negative speed', (data: WaterfallRecordDto) => ({ ...data, frames: [{ ...data.frames[0], speedRpm: -1 }, data.frames[1]] })],
  ] as const) {
    it('rejects incompatible ' + name, () => {
      const fail = jasmine.createSpy('fail'); source.load({ measurementId: 6, eventId: '42' }).subscribe({ error: fail });
      http.expectOne(req => req.url.endsWith('/Waterfall/Get')).flush({ success: true, data: change(record()) });
      expect(fail).toHaveBeenCalledTimes(1);
    });
  }
  it('cancels native reads when the consumer changes event or is destroyed', () => {
    const subscription = source.load({ measurementId: 6, eventId: '42' }).subscribe();
    const request = http.expectOne(req => req.url.endsWith('/Waterfall/Get'));
    subscription.unsubscribe(); expect(request.cancelled).toBeTrue();
  });
  it('shows actionable backend validation and connection failures through the page error contract', () => {
    source.load({ measurementId: 6, eventId: '42' }).subscribe({ error: error => {
      expect(error instanceof Error).toBeTrue(); expect(error.message).toBe('Measurement not found.');
    } });
    http.expectOne(req => req.url.endsWith('/Waterfall/Get')).flush({ success: false, message: 'Measurement not found.' }, { status: 400, statusText: 'Bad Request' });
    source.listEvents([6]).subscribe({ error: error => expect(error.message).toBe('Unable to reach the Waterfall API.') });
    http.expectOne(req => req.url.endsWith('/GetAvailability')).error(new ProgressEvent('error'));
  });
});
