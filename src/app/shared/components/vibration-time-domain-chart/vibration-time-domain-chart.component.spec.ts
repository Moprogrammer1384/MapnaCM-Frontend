import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AnalysisChartSettings } from 'src/app/core/models/analysis-chart-settings.model';
import { RawVibrationRecord, TimeDomainAnalysis } from 'src/app/core/models/vibration-data.model';
import { prepareTimeDomainRecord } from 'src/app/core/services/vibration/time-domain/time-domain-preparation';
import { analyzeTimeDomain } from 'src/app/core/services/vibration/time-domain/time-domain-analysis';
import { TimeDomainAnalysisService } from 'src/app/core/services/vibration/time-domain/time-domain-analysis.service';
import { VIBRATION_DATA_SOURCE } from 'src/app/core/services/vibration/vibration-api.service';
import { VibrationTimeDomainChartComponent } from './vibration-time-domain-chart.component';
import { VibrationDisplayRecord } from 'src/app/core/models/vibration-api.model';

const raw: RawVibrationRecord = { id: 'component', label: 'Component raw record', quantity: 'velocity', unit: 'cm/s',
  timeUnit: 'ms', time: [0, 1, 2, 3], values: [1, -4, 2, 3] };
const initial: AnalysisChartSettings = { quantity: 'velocity', unit: 'cm/s', xAxis: 'time', amplitude: '0p' };

describe('Raw time-domain chart request lifecycle', () => {
  let fixture: ComponentFixture<VibrationTimeDomainChartComponent>;
  let load: jasmine.Spy;
  const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); };
  const mount = () => {
    fixture = TestBed.createComponent(VibrationTimeDomainChartComponent);
    fixture.componentRef.setInput('measurementId', 42);
    fixture.componentRef.setInput('from', '2026-10-01T08:00');
    fixture.componentRef.setInput('to', '2026-10-02T09:30');
    fixture.componentRef.setInput('settings', initial);
  };

  beforeEach(() => {
    load = jasmine.createSpy('load').and.returnValue(of(raw));
    TestBed.configureTestingModule({ imports: [VibrationTimeDomainChartComponent],
      providers: [{ provide: VIBRATION_DATA_SOURCE, useValue: { load } }] });
  });
  afterEach(() => fixture?.destroy());

  it('shows load errors and retries, passing measurement/date parameters to the data adapter', async () => {
    load.and.returnValues(throwError(() => new Error('offline')), of(raw));
    mount(); await settle();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('offline');
    expect(load).toHaveBeenCalledWith({ measurementId: 42, from: '2026-10-01T08:00', to: '2026-10-02T09:30' });
    fixture.nativeElement.querySelector('button').click(); await settle();
    expect(load).toHaveBeenCalledTimes(2);
    // This case checks adapter retry; worker completion is independently covered by integration tests.
    expect(fixture.componentInstance.raw).toBe(raw);
    expect(fixture.componentInstance.error).toBe('');
  });

  it('coalesces parameter bursts, ignores old completions and releases the session on teardown', async () => {
    const pending: ((value: TimeDomainAnalysis) => void)[] = [];
    const release = jasmine.createSpy('release');
    const analyze = jasmine.createSpy('analyze').and.callFake(() => new Promise<TimeDomainAnalysis>(resolve => pending.push(resolve)));
    TestBed.overrideProvider(TimeDomainAnalysisService, { useValue: { acquire: () => ({ analyze, release }) } });
    mount(); await settle();
    expect(analyze).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('settings', { ...initial, unit: 'm/s' }); fixture.detectChanges();
    fixture.componentRef.setInput('settings', { ...initial, unit: 'in/s' }); await settle();
    expect(analyze).toHaveBeenCalledTimes(2);
    const latest = analyzeTimeDomain(prepareTimeDomainRecord(raw), { ...initial, unit: 'in/s' });
    pending[1](latest); await settle();
    expect(fixture.componentInstance.analysis).toBe(latest);
    pending[0](analyzeTimeDomain(prepareTimeDomainRecord(raw), initial)); await settle();
    expect(fixture.componentInstance.analysis).toBe(latest);
    fixture.destroy(); expect(release).toHaveBeenCalledTimes(1);
  });

  it('disposes the stale chart on numerical errors and recovers after retry', async () => {
    const result = analyzeTimeDomain(prepareTimeDomainRecord(raw), initial);
    const analyze = jasmine.createSpy('analyze');
    // Create rejected promises only when the corresponding request is actually made.
    analyze.and.callFake(() => analyze.calls.count() === 2 ? Promise.reject(new Error('Invalid sampling')) : Promise.resolve(result));
    TestBed.overrideProvider(TimeDomainAnalysisService, { useValue: { acquire: () => ({ analyze, release: () => undefined }) } });
    mount(); await settle();
    expect(fixture.nativeElement.querySelector('app-apache-echarts')).not.toBeNull();
    fixture.componentRef.setInput('settings', { ...initial, amplitude: 'rms' }); await settle();
    expect(fixture.componentInstance.error).toContain('Invalid sampling');
    expect(fixture.nativeElement.querySelector('app-apache-echarts')).toBeNull();
    fixture.nativeElement.querySelector('button').click(); await settle();
    expect(fixture.componentInstance.error).toBe('');
    expect(fixture.nativeElement.querySelector('app-apache-echarts')).not.toBeNull();
  });

  it('displays a large summary on Time (s) with server statistics, pen lifts and no new requests on selector changes', async () => {
    const summary: VibrationDisplayRecord = { kind: 'display', quantity: 'velocity', unit: 'mm/s', series: {
      measurementId: 42, sourceQuantity: 2, quantity: 2, unit: 5, representation: 'minmax-statistical-envelope',
      originalSampleCount: 9000000, returnedPointCount: 4, conversionApplied: false, hasGaps: false, isFftInput: false,
      points: [{ x: 0, y: -2, breakBefore: true }, { x: 1, y: 4, breakBefore: false },
        { x: 100, y: -3, breakBefore: true }, { x: 101, y: 5, breakBefore: false }],
      statistics: { min: -20, max: 30, mean: 1, rms: 10, peak: 30, peakToPeak: 50 },
    } };
    load.and.returnValue(of(summary));
    const acquire = jasmine.createSpy('acquire');
    TestBed.overrideProvider(TimeDomainAnalysisService, { useValue: { acquire } });
    mount(); await settle();
    const component = fixture.componentInstance;
    expect(component.error).toBe('');
    expect(component.analysis!.sampleCount).toBe(9000000);
    expect(component.analysis!.statistics.min).toBe(-2); // mm/s to selected cm/s, from SERVER stats.
    const options = component.chartOptions as { xAxis: { name: string }; series: { data: [number, number | null][] }[] };
    expect(options.xAxis.name).toBe('Time (s)');
    expect(options.series[0].data[2][1]).toBeNull();
    fixture.componentRef.setInput('settings', { ...initial, quantity: 'displacement', unit: 'µm' }); await settle();
    expect(component.error).toBe('');
    expect(component.analysis!.quantity).toBe('velocity');
    expect(component.analysisNotice).toContain('Quantity conversion is unavailable');
    expect(load).toHaveBeenCalledTimes(1); expect(acquire).not.toHaveBeenCalled();
  });
});
