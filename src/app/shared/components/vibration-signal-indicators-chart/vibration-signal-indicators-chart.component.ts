import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import type { EChartsOption } from 'echarts';
import { Subscription } from 'rxjs';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { AnalysisChartSettings, VibrationSourceProfile } from 'src/app/core/models/analysis-chart-settings.model';
import { SignalIndicatorAlarmRange, SignalIndicatorAlarmSetting, SignalIndicatorAnalysis, SignalIndicatorViewSettings } from 'src/app/core/models/signal-indicators.model';
import { RawVibrationRecord } from 'src/app/core/models/vibration-data.model';
import { VibrationDisplayRecord } from 'src/app/core/models/vibration-api.model';
import { VIBRATION_DATA_SOURCE, isVibrationDisplay, vibrationError } from 'src/app/core/services/vibration/api/vibration-time-domain-api.service';
import { TimeDomainAnalysisService, TimeDomainAnalysisSession } from 'src/app/core/services/vibration/time-domain/time-domain-analysis.service';
import { signalIndicatorsFromSummary, signalIndicatorsFromTimeDomain } from 'src/app/core/services/vibration/signal-indicators/signal-indicators-analysis';
import { rawAcquisitionStart } from 'src/app/core/utils/vibration-acquisition-start';
import { scaleSignalIndicatorLimits } from 'src/app/core/services/vibration/signal-indicators/signal-indicators-alarms';
import { VibrationSignalIndicatorSettingsApiService } from 'src/app/core/services/vibration/api/vibration-signal-indicator-settings-api.service';
import { unitToSi } from 'src/app/core/services/vibration/time-domain/time-domain-unit-conversion';
import { AcquisitionDatePipe } from '../../pipes/acquisition-date.pipe';
import { NumberFormatPipe } from '../../pipes/number-format.pipe';
import { signalIndicatorsChartOptions } from './signal-indicators-chart-options';

@Component({ selector: 'app-vibration-signal-indicators-chart', standalone: true,
  imports: [CommonModule, ApacheEchartsComponent, AcquisitionDatePipe, NumberFormatPipe],
  templateUrl: './vibration-signal-indicators-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'd-block mw-100', '[attr.aria-busy]': 'loading' } })
export class VibrationSignalIndicatorsChartComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) measurementId: number;
  @Input({ required: true }) from: string;
  @Input({ required: true }) to: string;
  @Input() settings?: AnalysisChartSettings;
  @Input() inputId = 'signal-indicator';
  @Input() viewSettings?: SignalIndicatorViewSettings;
  @Output() readonly sourceProfile = new EventEmitter<VibrationSourceProfile | undefined>(true);
  @Output() readonly sourceSettings = new EventEmitter<AnalysisChartSettings>(true);
  analysis?: SignalIndicatorAnalysis;
  options?: EChartsOption;
  acquisitionStartedAt?: string;
  loading = true;
  error = '';
  alarmLimits?: SignalIndicatorAlarmRange;
  alarmLoading = false;
  alarmError = '';
  get mode() { return this.viewSettings?.mode ?? 'all'; }
  get showAlarms() { return this.viewSettings?.showAlarms !== false; }
  private raw?: RawVibrationRecord;
  private display?: VibrationDisplayRecord;
  private subscription?: Subscription;
  private alarmSubscription?: Subscription;
  private alarmSettings: readonly SignalIndicatorAlarmSetting[] = [];
  private alarmFailure = '';
  private alarmVersion = 0;
  private session?: TimeDomainAnalysisSession;
  private analysisTimer?: ReturnType<typeof setTimeout>;
  private version = 0;
  private requestVersion = 0;
  private destroyed = false;
  private readonly data = inject(VIBRATION_DATA_SOURCE);
  private readonly alarms = inject(VibrationSignalIndicatorSettingsApiService);
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
    this.reloadAlarms();
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
  reloadAlarms(): void {
    const version = ++this.alarmVersion;
    this.alarmSubscription?.unsubscribe(); this.alarmSettings = []; this.alarmFailure = ''; this.alarmLoading = true;
    this.draw(); this.cdr.markForCheck();
    this.alarmSubscription = this.alarms.load().subscribe({
      next: settings => {
        if (this.destroyed || version !== this.alarmVersion) { return; }
        this.alarmSettings = settings; this.alarmLoading = false; this.draw(); this.cdr.markForCheck();
      },
      error: error => {
        if (this.destroyed || version !== this.alarmVersion) { return; }
        this.alarmFailure = error instanceof Error ? error.message : 'Unable to load alarm settings.';
        this.alarmLoading = false; this.draw(); this.cdr.markForCheck();
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
    this.alarmLimits = undefined; this.alarmError = '';
    if (this.showAlarms && this.mode !== 'all') {
      const signal = this.analysis.signal, scale = unitToSi(signal.quantity, signal.unit);
      const setting = this.alarmSettings.find(item => item.quantity === signal.quantity && item.metric === this.mode);
      if (setting) { this.alarmLimits = scaleSignalIndicatorLimits(setting.limitsSi, 1 / scale); }
      else if (!this.alarmLoading) {
        this.alarmError = this.alarmFailure || 'No alarm settings are configured for this quantity and indicator.';
      }
    }
    this.options = signalIndicatorsChartOptions(this.analysis, this.mode, this.alarmLimits);
  }
  ngOnDestroy(): void {
    this.destroyed = true; ++this.version; ++this.requestVersion; clearTimeout(this.analysisTimer);
    ++this.alarmVersion; this.alarmSubscription?.unsubscribe();
    this.subscription?.unsubscribe(); this.session?.release(); this.observer.disconnect();
  }
}
