import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import type { EChartsOption, LineSeriesOption, TooltipComponentOption } from 'echarts';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { AMPLITUDE_LABELS, AnalysisChartSettings, VIBRATION_QUANTITIES } from 'src/app/core/models/analysis-chart-settings.model';
import { RawVibrationRecord, TimeDomainAnalysis } from 'src/app/core/models/vibration-data.model';
import { TimeDomainAnalysisService, TimeDomainAnalysisSession } from 'src/app/core/services/vibration/time-domain/time-domain-analysis.service';
import { VIBRATION_DATA_SOURCE, isVibrationDisplay, vibrationError } from 'src/app/core/services/vibration/vibration-api.service';
import { VibrationDisplayRecord } from 'src/app/core/models/vibration-api.model';
import { displayTimeDomain } from 'src/app/core/services/vibration/time-domain/time-domain-display';
import { formatAnalysisNumber } from '../analysis-workspace-panel/analysis-number-format';

/** Raw time-record rendering. Source/API integration and all signal math remain in core/services/vibration. */
@Component({
  selector: 'app-vibration-time-domain-chart',
  standalone: true,
  imports: [CommonModule, ApacheEchartsComponent],
  templateUrl: './vibration-time-domain-chart.component.html',
  host: { class: 'd-block mw-100', '[attr.aria-busy]': 'loading' },
})
export class VibrationTimeDomainChartComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) measurementId: number;
  @Input({ required: true }) from: string;
  @Input({ required: true }) to: string;
  @Input() settings?: AnalysisChartSettings;
  @Output() readonly sourceSettings = new EventEmitter<AnalysisChartSettings>(true);
  loading = true;
  error = '';
  raw?: RawVibrationRecord;
  display?: VibrationDisplayRecord;
  analysisNotice = '';
  analysis?: TimeDomainAnalysis;
  chartOptions?: EChartsOption;
  readonly formatNumber = formatAnalysisNumber;
  private readonly source = inject(VIBRATION_DATA_SOURCE);
  private readonly processor = inject(TimeDomainAnalysisService);
  private readonly zone = inject(NgZone);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private subscription?: Subscription;
  private session?: TimeDomainAnalysisSession;
  private observer?: MutationObserver;
  private version = 0;
  private points: [number, number | null][] = [];
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
    this.display = undefined;
    this.analysisNotice = '';
    this.analysis = undefined;
    this.chartOptions = undefined;
    this.loading = true;
    this.error = '';
    this.subscription = this.source.load({ measurementId: this.measurementId, from: this.from, to: this.to }).subscribe({
      next: raw => {
        this.session?.release();
        if (isVibrationDisplay(raw)) { this.display = raw; }
        else { this.raw = raw; this.session = this.processor.acquire(raw); }
        if (!this.settings) {
          this.sourceSettings.emit({ quantity: raw.quantity, unit: raw.unit, xAxis: 'time', amplitude: '0p' });
        }
        this.scheduleAnalysis();
      },
      error: error => {
        this.loading = false;
        this.error = vibrationError(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  private scheduleAnalysis(): void {
    if (!this.session && !this.display) { return; }
    ++this.version;
    clearTimeout(this.analysisTimer);
    this.loading = true;
    this.changeDetector.markForCheck();
    // Coalesce keyboard/Select2 bursts before posting work; stale replies are also ignored.
    this.analysisTimer = setTimeout(() => void this.analyze(), 16);
  }

  private async analyze(): Promise<void> {
    const raw = this.raw ?? this.display;
    if (!raw) { return; }
    const version = ++this.version;
    const settings = this.settings ?? { quantity: raw.quantity, unit: raw.unit, xAxis: 'time', amplitude: '0p' };
    this.loading = true;
    this.error = '';
    try {
      const result = this.display ? displayTimeDomain(this.display, settings) : await this.session!.analyze(settings);
      if (this.destroyed || version !== this.version) { return; }
      this.zone.run(() => {
        const waveformChanged = !this.analysis || this.analysis.quantity !== result.quantity || this.analysis.unit !== result.unit;
        this.analysis = result;
        this.analysisNotice = this.display && settings.quantity !== this.display.quantity
          ? `Showing ${VIBRATION_QUANTITIES[this.display.quantity].label} from the response. Quantity conversion is unavailable for summary or discontinuous data.` : '';
        this.loading = false;
        if (waveformChanged) {
          this.points = [];
          result.time.forEach((time, index) => {
            if (index && this.display?.series.points[index].breakBefore) { this.points.push([time, null]); }
            this.points.push([time, result.values[index]]);
          });
          this.updateChartTheme();
        } else {
          // Merge only reference/tooltip/axis updates; keep the full waveform and zoom.
          this.chartOptions = {
            tooltip: { formatter: this.tooltipFormatter(result) },
            yAxis: this.amplitudeAxisRange(result),
            series: [{ id: 'raw-time', type: 'line', markLine: this.amplitudeMarkLine(result) }],
          };
        }
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

  private amplitudeAxisRange(result: TimeDomainAnalysis): { min: number; max: number } {
    return { min: Math.min(result.statistics.min, result.amplitudeReference.lower),
      max: Math.max(result.statistics.max, result.amplitudeReference.upper) };
  }

  private amplitudeMarkLine(result: TimeDomainAnalysis): LineSeriesOption['markLine'] {
    const styles = getComputedStyle(document.documentElement);
    const token = (name: string) => styles.getPropertyValue(`--bs-${name}`).trim();
    return {
      silent: true, animation: false, symbol: ['none', 'none'],
      lineStyle: { color: token('warning'), type: 'dashed', width: 1 },
      label: { show: true, position: 'insideEndBottom', color: token('body-color'), backgroundColor: token('body-bg'),
        padding: [2, 4], formatter: `${AMPLITUDE_LABELS[result.amplitudeMode]}: ${formatAnalysisNumber(result.amplitude)} ${result.unit}` },
      data: [
        { yAxis: result.amplitudeReference.lower, label: { show: false } },
        { yAxis: result.amplitudeReference.upper },
      ],
    };
  }

  private tooltipFormatter(result: TimeDomainAnalysis): TooltipComponentOption['formatter'] {
    return params => {
      const point = Array.isArray(params) ? params[0] : params;
      if (!Array.isArray(point.value)) { return ''; }
      const quantity = VIBRATION_QUANTITIES[result.quantity].label;
      return `${formatAnalysisNumber(Number(point.value[0]))} s<br/>${quantity}: ${formatAnalysisNumber(Number(point.value[1]))} ${result.unit}`
        + `<br/>${AMPLITUDE_LABELS[result.amplitudeMode]}: ${formatAnalysisNumber(result.amplitude)} ${result.unit}`;
    };
  }

  private updateChartTheme(): void {
    const result = this.analysis;
    if (!result) { return; }
    const styles = getComputedStyle(document.documentElement);
    const token = (name: string) => styles.getPropertyValue(`--bs-${name}`).trim();
    const quantity = VIBRATION_QUANTITIES[result.quantity].label;
    const label = `${quantity} (${result.unit})`;
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
      xAxis: { type: 'value', name: 'Time (s)', nameLocation: 'middle', nameGap: 30,
        min: result.time[0], max: result.time[result.time.length - 1], splitLine: { show: false },
        axisLabel: { formatter: formatAnalysisNumber },
        axisPointer: { label: { formatter: params => formatAnalysisNumber(Number(params.value)) } },
        axisLine: { lineStyle: { color: token('gray-500') } } },
      yAxis: { type: 'value', name: label, scale: true, ...this.amplitudeAxisRange(result), nameTextStyle: { align: 'left' },
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
      series: [{ id: 'raw-time', name: quantity, type: 'line', showSymbol: !!this.display, symbolSize: 3, lineStyle: { width: 1 },
        connectNulls: false, sampling: this.display ? undefined : 'minmax', progressive: 5000,
        data: this.points, markLine: this.amplitudeMarkLine(result) }],
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
