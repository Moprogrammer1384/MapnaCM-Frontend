import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import type { EChartsOption, TooltipComponentOption } from 'echarts';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { AMPLITUDE_LABELS, AnalysisChartSettings, VIBRATION_QUANTITIES } from 'src/app/core/models/analysis-chart-settings.model';
import { RawVibrationRecord } from 'src/app/core/models/vibration-data.model';
import { FrequencyDomainAnalysis } from 'src/app/core/models/frequency-domain.model';
import { FrequencyDomainAnalysisService, FrequencyDomainAnalysisSession } from 'src/app/core/services/vibration/frequency-domain/frequency-domain-analysis.service';
import { RAW_VIBRATION_DATA_SOURCE } from 'src/app/core/services/vibration/raw-data-source.service';
import { formatAnalysisNumber } from '../analysis-workspace-panel/analysis-number-format';

/** Raw-record FFT rendering. Source/API integration and all signal math remain in core/services/vibration. */
@Component({
  selector: 'app-vibration-frequency-domain-chart',
  standalone: true,
  imports: [CommonModule, ApacheEchartsComponent],
  templateUrl: './vibration-frequency-domain-chart.component.html',
  host: { class: 'd-block mw-100', '[attr.aria-busy]': 'loading' },
})
export class VibrationFrequencyDomainChartComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) measurementId: number;
  @Input({ required: true }) from: string;
  @Input({ required: true }) to: string;
  @Input() settings?: AnalysisChartSettings;
  @Output() readonly sourceSettings = new EventEmitter<AnalysisChartSettings>(true);
  loading = true;
  error = '';
  raw?: RawVibrationRecord;
  analysis?: FrequencyDomainAnalysis;
  chartOptions?: EChartsOption;
  readonly formatNumber = formatAnalysisNumber;
  private readonly source = inject(RAW_VIBRATION_DATA_SOURCE);
  private readonly processor = inject(FrequencyDomainAnalysisService);
  private readonly zone = inject(NgZone);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private subscription?: Subscription;
  private session?: FrequencyDomainAnalysisSession;
  private observer?: MutationObserver;
  private version = 0;
  private points: [number, number][] = [];
  private destroyed = false;
  private analysisTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.observer = new MutationObserver(() => this.zone.run(() => {
      this.updateChartTheme();
      this.changeDetector.markForCheck();
    }));
    this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['measurementId'] || changes['from'] || changes['to']) { this.reload(); }
    else { this.scheduleAnalysis(); }
  }

  reload(): void {
    ++this.version;
    clearTimeout(this.analysisTimer);
    this.subscription?.unsubscribe();
    this.session?.release();
    this.session = undefined;
    this.raw = undefined;
    // Keep the existing chart/zoom while a new measurement range is loading.
    // Successful results merge into it; failures remove the stale visualization.
    this.loading = true;
    this.error = '';
    this.subscription = this.source.load({ measurementId: this.measurementId, from: this.from, to: this.to }).subscribe({
      next: raw => {
        this.session?.release();
        this.raw = raw;
        this.session = this.processor.acquire(raw);
        if (!this.settings) {
          this.sourceSettings.emit({ quantity: raw.quantity, unit: raw.unit, xAxis: 'hz', amplitude: '0p' });
        }
        this.scheduleAnalysis();
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load the raw vibration record.';
        this.analysis = undefined;
        this.chartOptions = undefined;
        this.changeDetector.markForCheck();
      },
    });
  }

  private scheduleAnalysis(): void {
    if (!this.session) { return; }
    ++this.version;
    clearTimeout(this.analysisTimer);
    this.loading = true;
    this.changeDetector.markForCheck();
    // Coalesce keyboard/Select2 bursts before posting work; stale replies are also ignored.
    this.analysisTimer = setTimeout(() => void this.analyze(), 16);
  }

  private async analyze(): Promise<void> {
    if (!this.session || !this.raw) { return; }
    const version = ++this.version;
    const settings = this.settings ?? { quantity: this.raw.quantity, unit: this.raw.unit, xAxis: 'hz', amplitude: '0p' };
    this.loading = true;
    this.error = '';
    try {
      const result = await this.session.analyze(settings);
      if (this.destroyed || version !== this.version) { return; }
      this.zone.run(() => {
        this.analysis = result;
        this.loading = false;
        this.points = Array.from(result.frequency, (hz, index) => [hz, result.values[index]]);
        this.updateChartTheme();
        // Entering NgZone alone does not mark the application's OnPush ancestors.
        // Publish every completion, including cached/amplitude-only results.
        this.changeDetector.markForCheck();
      });
    } catch (error) {
      if (this.destroyed || version !== this.version) { return; }
      this.zone.run(() => {
        this.loading = false;
        this.error = error instanceof Error ? error.message : 'Unable to analyze this record.';
        this.analysis = undefined;
        this.chartOptions = undefined;
        this.changeDetector.markForCheck();
      });
    }
  }

  private tooltipFormatter(result: FrequencyDomainAnalysis): TooltipComponentOption['formatter'] {
    return params => {
      const point = Array.isArray(params) ? params[0] : params;
      if (!Array.isArray(point.value)) { return ''; }
      const quantity = VIBRATION_QUANTITIES[result.quantity].label;
      return `${formatAnalysisNumber(Number(point.value[0]))} ${result.axisUnit}<br/>${quantity}: ${formatAnalysisNumber(Number(point.value[1]))} ${result.unit} ${AMPLITUDE_LABELS[result.amplitudeMode]}`;
    };
  }

  private updateChartTheme(): void {
    const result = this.analysis;
    if (!result) { return; }
    const styles = getComputedStyle(document.documentElement);
    const token = (name: string) => styles.getPropertyValue(`--bs-${name}`).trim();
    const quantity = VIBRATION_QUANTITIES[result.quantity].label;
    const label = `${quantity} (${result.unit} ${AMPLITUDE_LABELS[result.amplitudeMode]})`;
    this.chartOptions = {
      animation: false,
      color: [token('primary')],
      textStyle: { color: token('gray-600'), fontFamily: styles.fontFamily },
      tooltip: {
        trigger: 'axis',
        formatter: this.tooltipFormatter(result),
        backgroundColor: token('body-bg'), borderColor: token('border-color'), textStyle: { color: token('body-color') },
      },
      grid: { left: 20, right: 24, top: 45, bottom: 75, containLabel: true },
      xAxis: { type: 'value', name: `Frequency (${result.axisUnit})`, nameLocation: 'middle', nameGap: 30,
        min: 0, max: result.frequency[result.frequency.length - 1], splitLine: { show: false },
        axisLabel: { formatter: formatAnalysisNumber },
        axisPointer: { label: { formatter: params => formatAnalysisNumber(Number(params.value)) } },
        axisLine: { lineStyle: { color: token('gray-500') } } },
      yAxis: { type: 'value', name: label, min: 0, nameTextStyle: { align: 'left' },
        axisLabel: { formatter: formatAnalysisNumber },
        axisPointer: { label: { formatter: params => formatAnalysisNumber(Number(params.value)) } },
        splitLine: { lineStyle: { color: token('border-color') } } },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'slider', xAxisIndex: 0, height: 20, bottom: 10,
          labelFormatter: formatAnalysisNumber,
          borderColor: token('border-color'), backgroundColor: token('gray-100'), fillerColor: token('primary-light'),
          textStyle: { color: token('gray-600') }, handleStyle: { color: token('primary'), borderColor: token('primary') },
          moveHandleStyle: { color: token('primary') },
          dataBackground: { lineStyle: { color: token('gray-500') }, areaStyle: { color: token('gray-200') } },
          selectedDataBackground: { lineStyle: { color: token('primary') }, areaStyle: { color: token('primary-light') } } },
      ],
      series: [{ id: 'raw-frequency', name: quantity, type: 'line', showSymbol: false, lineStyle: { width: 1 },
        sampling: 'minmax', progressive: 5000, data: this.points }],
    };
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    ++this.version;
    this.subscription?.unsubscribe();
    clearTimeout(this.analysisTimer);
    this.session?.release();
    this.observer?.disconnect();
  }
}
