import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import type { EChartsOption } from 'echarts';
import { Subscription } from 'rxjs';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { AnalysisChartSettings, VibrationSourceProfile } from 'src/app/core/models/analysis-chart-settings.model';
import { SignalIndicatorAlarmChange, signalIndicatorAlarmKey, SignalIndicatorAlarmRange, SignalIndicatorAnalysis, SignalIndicatorViewSettings } from 'src/app/core/models/signal-indicators.model';
import { RawVibrationRecord } from 'src/app/core/models/vibration-data.model';
import { VibrationDisplayRecord } from 'src/app/core/models/vibration-api.model';
import { VIBRATION_DATA_SOURCE, isVibrationDisplay, vibrationError } from 'src/app/core/services/vibration/api/vibration-time-domain-api.service';
import { TimeDomainAnalysisService, TimeDomainAnalysisSession } from 'src/app/core/services/vibration/time-domain/time-domain-analysis.service';
import { signalIndicatorsFromSummary, signalIndicatorsFromTimeDomain } from 'src/app/core/services/vibration/signal-indicators/signal-indicators-analysis';
import { rawAcquisitionStart } from 'src/app/core/utils/vibration-acquisition-start';
import { initialSignalIndicatorLimits, signalIndicatorLimitError } from 'src/app/core/services/vibration/signal-indicators/signal-indicators-alarms';
import { unitToSi } from 'src/app/core/services/vibration/time-domain/time-domain-unit-conversion';
import { AcquisitionDatePipe } from '../../pipes/acquisition-date.pipe';
import { NumberFormatPipe } from '../../pipes/number-format.pipe';
import { signalIndicatorsChartOptions } from './signal-indicators-chart-options';

@Component({ selector: 'app-vibration-signal-indicators-chart', standalone: true,
  imports: [CommonModule, FormsModule, ApacheEchartsComponent, AcquisitionDatePipe, NumberFormatPipe],
  templateUrl: './vibration-signal-indicators-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'd-block mw-100', '[attr.aria-busy]': 'loading' } })
export class VibrationSignalIndicatorsChartComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) measurementId: number;
  @Input({ required: true }) from: string;
  @Input({ required: true }) to: string;
  @Input() settings?: AnalysisChartSettings;
  @Input() inputId = 'signal-indicator';
  @Input() viewSettings?: SignalIndicatorViewSettings;
  @Output() readonly alarmLimitsChange = new EventEmitter<SignalIndicatorAlarmChange>();
  @Output() readonly sourceProfile = new EventEmitter<VibrationSourceProfile | undefined>(true);
  @Output() readonly sourceSettings = new EventEmitter<AnalysisChartSettings>(true);
  analysis?: SignalIndicatorAnalysis;
  options?: EChartsOption;
  acquisitionStartedAt?: string;
  loading = true;
  error = '';
  lowerAlarm: number | null = null;
  upperAlarm: number | null = null;
  alarmError = '';
  get mode() { return this.viewSettings?.mode ?? 'all'; }
  private raw?: RawVibrationRecord;
  private display?: VibrationDisplayRecord;
  private subscription?: Subscription;
  private session?: TimeDomainAnalysisSession;
  private analysisTimer?: ReturnType<typeof setTimeout>;
  private version = 0;
  private requestVersion = 0;
  private destroyed = false;
  private readonly data = inject(VIBRATION_DATA_SOURCE);
  private readonly processor = inject(TimeDomainAnalysisService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly observer = new MutationObserver(() => this.zone.run(() => { this.draw(); this.cdr.markForCheck(); }));

  constructor() { this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] }); }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['measurementId'] || changes['from'] || changes['to']) { this.reload(); }
    else if (changes['settings']) { this.scheduleAnalysis(); }
    else { this.draw(); }
  }
  reload(): void {
    ++this.version; const requestVersion = ++this.requestVersion;
    clearTimeout(this.analysisTimer); this.subscription?.unsubscribe(); this.session?.release(); this.session = undefined;
    this.sourceProfile.emit(undefined);
    this.raw = undefined; this.display = undefined; this.analysis = undefined; this.options = undefined;
    this.acquisitionStartedAt = undefined; this.error = ''; this.loading = true;
    this.subscription = this.data.load({ measurementId: this.measurementId, from: this.from, to: this.to }).subscribe({
      next: record => {
        if (this.destroyed || requestVersion !== this.requestVersion) { return; }
        this.sourceProfile.emit({ quantity: record.quantity, unit: record.unit });
        if (isVibrationDisplay(record)) { this.display = record; }
        else { this.raw = record; this.session = this.processor.acquire(record); }
        if (!this.settings) { this.sourceSettings.emit({ quantity: record.quantity, unit: record.unit, xAxis: 'time', amplitude: 'rms' }); }
        this.scheduleAnalysis();
      },
      error: error => {
        if (this.destroyed || requestVersion !== this.requestVersion) { return; }
        this.loading = false; this.error = vibrationError(error); this.sourceProfile.emit(undefined); this.cdr.markForCheck();
      },
    });
  }
  private scheduleAnalysis(): void {
    if (!this.raw && !this.display) { return; }
    ++this.version; clearTimeout(this.analysisTimer); this.loading = true; this.cdr.markForCheck();
    this.analysisTimer = setTimeout(() => void this.analyze(), 16);
  }
  private async analyze(): Promise<void> {
    const source = this.raw ?? this.display;
    if (!source) { return; }
    const version = ++this.version;
    const settings = this.settings ?? { quantity: source.quantity, unit: source.unit, xAxis: 'time', amplitude: 'rms' };
    try {
      const analysis = this.display
        ? signalIndicatorsFromSummary(this.display, settings, `${this.measurementId}:${this.from}:${this.to}`)
        : signalIndicatorsFromTimeDomain(await this.session!.analyze({ ...settings, amplitude: 'rms' }), this.raw!.id, 60);
      if (this.destroyed || version !== this.version) { return; }
      this.zone.run(() => {
        this.analysis = analysis; this.loading = false; this.error = '';
        if (this.raw) { this.acquisitionStartedAt = rawAcquisitionStart(this.raw); }
        else if (this.display?.timeOriginUtc) {
          const origin = Date.parse(this.display.timeOriginUtc);
          this.acquisitionStartedAt = Number.isFinite(origin) ? new Date(origin + analysis.points[0].from * 1000).toISOString() : undefined;
        }
        this.draw(); this.cdr.markForCheck();
      });
    } catch (error) {
      if (this.destroyed || version !== this.version) { return; }
      this.zone.run(() => {
        this.analysis = undefined; this.options = undefined; this.loading = false;
        this.error = error instanceof Error ? error.message : 'Unable to calculate signal indicators.'; this.cdr.markForCheck();
      });
    }
  }
  private draw(): void {
    if (!this.analysis) { return; }
    let range: SignalIndicatorAlarmRange | undefined;
    this.alarmError = '';
    if (this.mode !== 'all') {
      const signal = this.analysis.signal, scale = unitToSi(signal.quantity, signal.unit);
      const key = signalIndicatorAlarmKey(this.measurementId, signal.quantity, this.mode);
      const limits = this.viewSettings?.limits[key] ?? initialSignalIndicatorLimits(this.analysis, this.mode);
      this.lowerAlarm = limits.lowerSi === null ? null : limits.lowerSi / scale;
      this.upperAlarm = limits.upperSi === null ? null : limits.upperSi / scale;
      this.alarmError = signalIndicatorLimitError(this.lowerAlarm, this.upperAlarm);
      if (!this.alarmError) { range = { lower: this.lowerAlarm!, upper: this.upperAlarm! }; }
    }
    this.options = signalIndicatorsChartOptions(this.analysis, this.mode, range);
  }
  updateAlarm(boundary: 'lower' | 'upper', value: number | null): void {
    if (!this.analysis || this.mode === 'all') { return; }
    if (boundary === 'lower') { this.lowerAlarm = value; } else { this.upperAlarm = value; }
    const signal = this.analysis.signal, scale = unitToSi(signal.quantity, signal.unit), metric = this.mode;
    const limits = { lowerSi: this.lowerAlarm === null ? null : this.lowerAlarm * scale,
      upperSi: this.upperAlarm === null ? null : this.upperAlarm * scale };
    const key = signalIndicatorAlarmKey(this.measurementId, signal.quantity, metric);
    this.viewSettings = { mode: metric, limits: { ...this.viewSettings?.limits, [key]: limits } };
    this.draw(); this.alarmLimitsChange.emit({ ...limits, quantity: signal.quantity, metric });
  }
  ngOnDestroy(): void {
    this.destroyed = true; ++this.version; ++this.requestVersion; clearTimeout(this.analysisTimer);
    this.subscription?.unsubscribe(); this.session?.release(); this.observer.disconnect();
  }
}
