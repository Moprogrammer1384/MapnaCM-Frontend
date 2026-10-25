import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AnalysisChartSettings } from 'src/app/core/models/analysis-chart-settings.model';
import { RawVibrationRecord } from 'src/app/core/models/vibration-data.model';
import { FrequencyDomainAnalysis } from 'src/app/core/models/frequency-domain.model';
import { prepareFrequencyDomainRecord } from 'src/app/core/services/vibration/frequency-domain/frequency-domain-analysis';
import { analyzeFrequencyDomain } from 'src/app/core/services/vibration/frequency-domain/frequency-domain-analysis';
import { FrequencyDomainAnalysisService } from 'src/app/core/services/vibration/frequency-domain/frequency-domain-analysis.service';
import { VIBRATION_DATA_SOURCE } from 'src/app/core/services/vibration/vibration-api.service';
import { VibrationFrequencyDomainChartComponent } from './vibration-frequency-domain-chart.component';
import { VibrationDisplayRecord } from 'src/app/core/models/vibration-api.model';

const raw: RawVibrationRecord = { id: 'component', label: 'Component raw record', quantity: 'velocity', unit: 'cm/s',
  timeUnit: 'ms', time: [0, 1, 2, 3], values: [1, -4, 2, 3] };
const initial: AnalysisChartSettings = { quantity: 'velocity', unit: 'cm/s', xAxis: 'hz', amplitude: '0p' };

describe('Raw frequency-domain chart request lifecycle', () => {
  let fixture: ComponentFixture<VibrationFrequencyDomainChartComponent>;
  let load: jasmine.Spy;
  const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); };
  const mount = () => {
    fixture = TestBed.createComponent(VibrationFrequencyDomainChartComponent);
    fixture.componentRef.setInput('measurementId', 42);
    fixture.componentRef.setInput('from', '2026-10-01T08:00');
    fixture.componentRef.setInput('to', '2026-10-02T09:30');
    fixture.componentRef.setInput('settings', initial);
  };

  beforeEach(() => {
    load = jasmine.createSpy('load').and.returnValue(of(raw));
    TestBed.configureTestingModule({ imports: [VibrationFrequencyDomainChartComponent],
      providers: [{ provide: VIBRATION_DATA_SOURCE, useValue: { load } }] });
  });
  afterEach(() => fixture?.destroy());

  it('shows load errors and retries, passing measurement/date parameters to the data adapter', async () => {
    load.and.returnValues(throwError(() => new Error('offline')), of(raw));
    mount(); await settle();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('offline');
    expect(load).toHaveBeenCalledWith({ measurementId: 42, from: '2026-10-01T08:00', to: '2026-10-02T09:30' });
    fixture.componentRef.setInput('settings', { ...initial, amplitude: 'rms' }); await settle();
    expect(fixture.componentInstance.loading).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    fixture.nativeElement.querySelector('button').click(); await settle();
    expect(load).toHaveBeenCalledTimes(2);
    // This case checks adapter retry; worker completion is independently covered by integration tests.
    expect(fixture.componentInstance.raw).toBe(raw);
    expect(fixture.componentInstance.error).toBe('');
  });

  it('coalesces parameter bursts, ignores old completions and releases the session on teardown', async () => {
    const pending: ((value: FrequencyDomainAnalysis) => void)[] = [];
    const release = jasmine.createSpy('release');
    const analyze = jasmine.createSpy('analyze').and.callFake(() => new Promise<FrequencyDomainAnalysis>(resolve => pending.push(resolve)));
    TestBed.overrideProvider(FrequencyDomainAnalysisService, { useValue: { acquire: () => ({ analyze, release }) } });
    mount(); await settle();
    expect(analyze).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('settings', { ...initial, unit: 'm/s' }); fixture.detectChanges();
    fixture.componentRef.setInput('settings', { ...initial, unit: 'in/s' }); await settle();
    expect(analyze).toHaveBeenCalledTimes(2);
    const latest = analyzeFrequencyDomain(prepareFrequencyDomainRecord(raw), { ...initial, unit: 'in/s' });
    pending[1](latest); await settle();
    expect(fixture.componentInstance.analysis).toBe(latest);
    pending[0](analyzeFrequencyDomain(prepareFrequencyDomainRecord(raw), initial)); await settle();
    expect(fixture.componentInstance.analysis).toBe(latest);
    fixture.destroy(); expect(release).toHaveBeenCalledTimes(1);
  });

  it('disposes the stale chart on numerical errors and recovers after retry', async () => {
    const result = analyzeFrequencyDomain(prepareFrequencyDomainRecord(raw), initial);
    const analyze = jasmine.createSpy('analyze');
    // Create rejected promises only when the corresponding request is actually made.
    analyze.and.callFake(() => analyze.calls.count() === 2 ? Promise.reject(new Error('Invalid sampling')) : Promise.resolve(result));
    TestBed.overrideProvider(FrequencyDomainAnalysisService, { useValue: { acquire: () => ({ analyze, release: () => undefined }) } });
    mount(); await settle();
    expect(fixture.nativeElement.querySelector('app-apache-echarts')).not.toBeNull();
    fixture.componentRef.setInput('settings', { ...initial, amplitude: 'rms' }); await settle();
    expect(fixture.componentInstance.error).toContain('Invalid sampling');
    expect(fixture.nativeElement.querySelector('app-apache-echarts')).toBeNull();
    fixture.nativeElement.querySelector('button').click(); await settle();
    expect(fixture.componentInstance.error).toBe('');
    expect(fixture.nativeElement.querySelector('app-apache-echarts')).not.toBeNull();
  });

  it('shows a frontend FFT error for summary data and never passes extrema to the worker', async () => {
    const summary: VibrationDisplayRecord = { kind: 'display', quantity: 'velocity', unit: 'mm/s', series: {
      measurementId: 42, sourceQuantity: 2, quantity: 2, unit: 5, representation: 'minmax-statistical-envelope',
      originalSampleCount: 9000000, returnedPointCount: 2, conversionApplied: false, hasGaps: false, isFftInput: false,
      points: [{ x: 0, y: -2, breakBefore: true }, { x: 100, y: 4, breakBefore: false }],
      statistics: { min: -2, max: 4, mean: 1, rms: 2, peak: 4, peakToPeak: 6 },
    } };
    load.and.returnValue(of(summary));
    const acquire = jasmine.createSpy('acquire');
    TestBed.overrideProvider(FrequencyDomainAnalysisService, { useValue: { acquire } });
    mount(); await settle();
    expect(fixture.componentInstance.loading).toBeFalse();
    expect(fixture.componentInstance.error).toContain('FFT cannot be calculated from summary');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Raw waveform samples are required');
    expect(fixture.nativeElement.querySelector('app-apache-echarts')).toBeNull();
    expect(acquire).not.toHaveBeenCalled();
    fixture.componentRef.setInput('settings', { ...initial, quantity: 'displacement' }); await settle();
    expect(load).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.loading).toBeFalse();
    expect(fixture.componentInstance.error).toContain('FFT cannot be calculated from summary');
  });
});
