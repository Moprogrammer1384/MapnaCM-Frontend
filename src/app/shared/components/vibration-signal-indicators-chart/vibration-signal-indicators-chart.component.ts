import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, NgZone, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import type { EChartsOption } from 'echarts';
import { Subscription } from 'rxjs';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { SignalIndicatorAlarmRange, SignalIndicatorAlarmSetting, SignalIndicatorRecord, SignalIndicatorViewSettings } from 'src/app/core/models/vibration/signal-indicators.model';
import { VibrationSignalIndicatorApiService } from 'src/app/core/services/vibration/api/vibration-signal-indicator-api.service';
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
  @Input() viewSettings?: SignalIndicatorViewSettings;
  record?: SignalIndicatorRecord;
  options?: EChartsOption;
  empty = false;
  loading = true;
  error = '';
  alarmLimits?: SignalIndicatorAlarmRange;
  alarmLoading = false;
  alarmError = '';
  get mode() { return this.viewSettings?.mode ?? 'all'; }
  get showAlarms() { return this.viewSettings?.showAlarms !== false; }
  private subscription?: Subscription;
  private alarmSubscription?: Subscription;
  private alarmSettings: readonly SignalIndicatorAlarmSetting[] = [];
  private alarmFailure = '';
  private readonly data = inject(VibrationSignalIndicatorApiService);
  private readonly alarms = inject(VibrationSignalIndicatorSettingsApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly observer = new MutationObserver(() => this.zone.run(() => { this.draw(); this.cdr.markForCheck(); }));

  constructor() { this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] }); }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['measurementId'] || changes['from'] || changes['to']) { this.reload(); }
    else { this.draw(); }
  }
  reload(): void {
    this.subscription?.unsubscribe();
    this.record = undefined; this.options = undefined; this.empty = false; this.error = ''; this.loading = true;
    if (!this.alarmSubscription) { this.reloadAlarms(); }
    this.subscription = this.data.load(this.measurementId, this.from, this.to).subscribe({
      next: data => {
        this.record = data ?? undefined;
        this.empty = data === null;
        this.loading = false;
        this.draw(); this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.error = error instanceof Error ? error.message : 'Unable to load signal indicators.';
        this.cdr.markForCheck();
      },
    });
  }
  reloadAlarms(): void {
    this.alarmSubscription?.unsubscribe(); this.alarmSettings = []; this.alarmFailure = ''; this.alarmLoading = true;
    this.draw(); this.cdr.markForCheck();
    this.alarmSubscription = this.alarms.load().subscribe({
      next: settings => {
        this.alarmSettings = settings; this.alarmLoading = false; this.draw(); this.cdr.markForCheck();
      },
      error: error => {
        this.alarmFailure = error instanceof Error ? error.message : 'Unable to load alarm settings.';
        this.alarmLoading = false; this.draw(); this.cdr.markForCheck();
      },
    });
  }
  private draw(): void {
    const record = this.record;
    if (!record) { return; }
    this.alarmLimits = undefined; this.alarmError = '';
    if (this.showAlarms && this.mode !== 'all') {
      const scale = unitToSi(record.quantity, record.unit);
      const setting = this.alarmSettings.find(item => item.quantity === record.quantity && item.metric === this.mode);
      if (setting) { this.alarmLimits = scaleSignalIndicatorLimits(setting.limitsSi, 1 / scale); }
      else if (!this.alarmLoading) {
        this.alarmError = this.alarmFailure || 'No alarm settings are configured for this quantity and indicator.';
      }
    }
    this.options = signalIndicatorsChartOptions(record, this.mode, this.alarmLimits);
  }
  ngOnDestroy(): void {
    this.alarmSubscription?.unsubscribe(); this.subscription?.unsubscribe(); this.observer.disconnect();
  }
}
