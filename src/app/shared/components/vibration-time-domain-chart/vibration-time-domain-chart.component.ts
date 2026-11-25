import { VIBRATION_PEAK_TO_PEAK_COLOR, vibrationChartColor } from '../vibration-chart-presentation/vibration-chart-colors';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import type { EChartsOption, LineSeriesOption, TooltipComponentOption } from 'echarts';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { AMPLITUDE_LABELS, AnalysisChartSettings, VibrationSourceProfile, VIBRATION_QUANTITIES } from 'src/app/core/models/vibration/analysis-chart-settings.model';
import { RawVibrationRecord, TimeDomainAmplitudeWindow, TimeDomainAnalysis } from 'src/app/core/models/vibration/vibration-data.model';
import { TimeDomainAnalysisService, TimeDomainAnalysisSession } from 'src/app/core/services/vibration/time-domain/time-domain-analysis.service';
import { VIBRATION_DATA_SOURCE, isVibrationDisplay, vibrationError } from 'src/app/core/services/vibration/api/vibration-time-domain-api.service';
import { formatNumber, NumberFormatPipe } from '../../pipes/number-format.pipe';
import { AcquisitionDatePipe } from '../../pipes/acquisition-date.pipe';
import { rawAcquisitionStart } from 'src/app/core/utils/vibration-acquisition-start';
import { selectTimeDomainAmplitude } from 'src/app/core/services/vibration/time-domain/time-domain-statistics';
import { vibrationChartAppearance, vibrationLinearZoom, vibrationStackedGrids } from '../vibration-chart-presentation/vibration-chart-presentation';

const amplitudeModes = ['rms', '0p', 'pp'] as const;
const amplitudeSeriesPrefix = 'time-domain-window-';

/** Raw time-record rendering. Source/API integration and all signal math remain in core/services/vibration. */
@Component({
  selector: 'app-vibration-time-domain-chart',
  standalone: true,
  imports: [CommonModule, ApacheEchartsComponent, NumberFormatPipe, AcquisitionDatePipe],
  templateUrl: './vibration-time-domain-chart.component.html',
  host: { class: 'd-block mw-100', '[attr.aria-busy]': 'loading' },
})
export class VibrationTimeDomainChartComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) measurementId: number;
  @Input({ required: true }) from: string;
  @Input({ required: true }) to: string;
  @Input() settings?: AnalysisChartSettings;
  @Input() measurementIds?: readonly number[];
  @Input() sourceKey?: string;
  @Input() recentSeconds?: number;
  @Input() recentRevision?: number;
  @Input() onlineStartUtc?: string;
  @Output() readonly sourceProfile = new EventEmitter<VibrationSourceProfile | undefined>(true);
  @Output() readonly sourceSettings = new EventEmitter<AnalysisChartSettings>(true);
  loading = true;
  error = '';
  raw?: RawVibrationRecord;
  acquisitionStartedAt?: string;
  analysis?: TimeDomainAnalysis;
  chartOptions?: EChartsOption;
  private readonly source = inject(VIBRATION_DATA_SOURCE);
  private readonly processor = inject(TimeDomainAnalysisService);
  private readonly zone = inject(NgZone);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private subscription?: Subscription;
  private session?: TimeDomainAnalysisSession;
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
    const quantityChanged = this.recentSeconds !== undefined && changes['settings'] &&
      (changes['settings'].previousValue?.quantity ?? 'displacement') !== (this.settings?.quantity ?? 'displacement');
    if (changes['measurementId'] || changes['from'] || changes['to'] || changes['measurementIds'] ||
        changes['sourceKey'] || changes['recentSeconds'] || changes['recentRevision'] || changes['onlineStartUtc'] || quantityChanged) { this.reload(); }
    else if (changes['settings']) { this.scheduleAnalysis(); }
    else { this.updateChartTheme(); }
  }

  reload(): void {
    if (this.subscription) { this.sourceProfile.emit(undefined); }
    ++this.version;
    clearTimeout(this.analysisTimer);
    this.subscription?.unsubscribe();
    this.session?.release();
    this.session = undefined;
    this.raw = undefined;
    this.analysis = undefined;
    this.chartOptions = undefined;
    this.loading = true;
    this.error = '';
    this.subscription = this.source.load({ measurementId: this.measurementId, from: this.from, to: this.to,
      ...(this.measurementIds ? { measurementIds: this.measurementIds, sourceKey: this.sourceKey, recentSeconds: this.recentSeconds,
        recentRevision: this.recentRevision, onlineStartUtc: this.onlineStartUtc,
        quantity: this.recentSeconds === undefined ? undefined : this.settings?.quantity } : {}),
    }).subscribe({
      next: raw => {
        if (isVibrationDisplay(raw)) {
          this.showLoadError('The vibration API returned an incomplete raw record.');
          return;
        }
        this.sourceProfile.emit({ quantity: raw.quantity, unit: raw.unit });
        this.session?.release();
        this.raw = raw;
        this.session = this.processor.acquire(raw);
        if (!this.settings) {
          this.sourceSettings.emit({ quantity: raw.quantity, unit: raw.unit, xAxis: 'time', amplitude: '0p' });
        }
        this.scheduleAnalysis();
      },
      error: error => this.showLoadError(vibrationError(error)),
    });
  }

  private showLoadError(message: string): void {
    this.sourceProfile.emit(undefined);
    this.loading = false;
    this.error = message;
    this.changeDetector.markForCheck();
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
    const raw = this.raw;
    if (!raw) { return; }
    const version = ++this.version;
    const settings = this.settings ?? { quantity: raw.quantity, unit: raw.unit, xAxis: 'time', amplitude: '0p' };
    this.loading = true;
    this.error = '';
    try {
      const result = await this.session!.analyze(settings, this.recentSeconds === undefined);
      if (this.destroyed || version !== this.version) { return; }
      this.zone.run(() => {
        const waveformChanged = !this.analysis || this.analysis.quantity !== result.quantity || this.analysis.unit !== result.unit;
        this.analysis = result;
        this.acquisitionStartedAt = rawAcquisitionStart(raw);
        this.loading = false;
        if (waveformChanged) {
          this.points = [];
          result.time.forEach((seconds, index) => {
            this.points.push([seconds * 1000, result.values[index]]);
          });
          this.updateChartTheme();
        } else {
          // Merge tooltip and axis updates without replacing the waveform or zoom.
          this.chartOptions = {
            tooltip: { formatter: this.tooltipFormatter(result) },
            yAxis: this.amplitudeAxisRange(result),
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

  private tooltipFormatter(result: TimeDomainAnalysis): TooltipComponentOption['formatter'] {
    return params => {
      const entries = Array.isArray(params) ? params : [params];
      const point = entries[0];
      if (!point) { return ''; }
      if (!Array.isArray(point.value)) { return ''; }
      if (point.seriesId?.startsWith(amplitudeSeriesPrefix)) {
        const window = result.amplitudeTrend?.[Number(point.value[2])];
        if (!window) { return ''; }
        const from = formatNumber(window.from * 1000);
        const to = formatNumber(window.to * 1000);
        return [`${from}–${to} ms`, ...entries
          .filter(entry => entry.seriesId?.startsWith(amplitudeSeriesPrefix) && Array.isArray(entry.value))
          .map(entry => `${entry.marker ?? ''}${entry.seriesName}: ${formatNumber(Number((entry.value as number[])[1]))} ${result.unit}`)]
          .join('<br/>');
      }
      const quantity = VIBRATION_QUANTITIES[result.quantity].label;
      return `${formatNumber(Number(point.value[0]))} ms<br/>${quantity}: ${formatNumber(Number(point.value[1]))} ${result.unit}`
        + `<br/>${AMPLITUDE_LABELS[result.amplitudeMode]}: ${formatNumber(result.amplitude)} ${result.unit}`;
    };
  }

  private updateChartTheme(): void {
    const result = this.analysis;
    if (!result) { return; }
    if (result.amplitudeTrend) {
      this.chartOptions = this.offlineChartOptions(result, result.amplitudeTrend);
      return;
    }
    const styles = getComputedStyle(document.documentElement);
    const token = (name: string) => styles.getPropertyValue(`--bs-${name}`).trim();
    const quantity = VIBRATION_QUANTITIES[result.quantity].label;
    const label = `${quantity} (${result.unit})`;
    const signalColor = vibrationChartColor();
    this.chartOptions = {
      animation: false,
      color: [signalColor],
      textStyle: { color: token('gray-600'), fontFamily: styles.fontFamily },
      tooltip: {
        trigger: 'axis',
        formatter: this.tooltipFormatter(result),
        backgroundColor: token('body-bg'), borderColor: token('border-color'), textStyle: { color: token('body-color') },
      },
      grid: { left: 20, right: 24, top: 45, bottom: 75, containLabel: true },
      xAxis: { type: 'value', name: 'Time (ms)', nameLocation: 'middle', nameGap: 30,
        min: this.points[0]?.[0], max: this.points[this.points.length - 1]?.[0], splitLine: { show: false },
        axisLabel: { formatter: formatNumber },
        axisPointer: { label: { formatter: params => formatNumber(Number(params.value)) } },
        axisLine: { lineStyle: { color: token('gray-500') } } },
      yAxis: { type: 'value', name: label, scale: true, ...this.amplitudeAxisRange(result), nameTextStyle: { align: 'left' },
        axisLabel: { formatter: formatNumber },
        axisPointer: { label: { formatter: params => formatNumber(Number(params.value)) } },
        splitLine: { lineStyle: { color: token('border-color') } } },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'slider', xAxisIndex: 0, height: 20, bottom: 10,
          labelFormatter: formatNumber,
          borderColor: token('border-color'), backgroundColor: token('gray-100'), fillerColor: token('primary-light'),
          textStyle: { color: token('gray-600') }, handleStyle: { color: token('primary'), borderColor: token('primary') },
          moveHandleStyle: { color: token('primary') },
          dataBackground: { lineStyle: { color: token('gray-500') }, areaStyle: { color: token('gray-200') } },
          selectedDataBackground: { lineStyle: { color: signalColor }, areaStyle: { color: token('primary-light') } } },
      ],
      series: [this.waveformSeries(result)],
    };
  }

  private waveformSeries(result: TimeDomainAnalysis): LineSeriesOption {
    const color = vibrationChartColor();
    return { id: 'raw-time', name: VIBRATION_QUANTITIES[result.quantity].label, type: 'line',
      showSymbol: false, lineStyle: { width: 2, color }, itemStyle: { color },
      connectNulls: false, sampling: 'minmax', progressive: 5000,
      data: this.points };
  }

  private offlineChartOptions(result: TimeDomainAnalysis, windows: readonly TimeDomainAmplitudeWindow[]): EChartsOption {
    const { base, legend, tooltip, axis, token } = vibrationChartAppearance();
    const names = amplitudeModes.map(mode => AMPLITUDE_LABELS[mode]);
    const trendColors = [vibrationChartColor(), vibrationChartColor(1), VIBRATION_PEAK_TO_PEAK_COLOR];
    const xAxis = (gridIndex: number) => ({ ...axis(gridIndex === 1 ? 'Time (ms)' : ''), gridIndex,
      min: this.points[0][0], max: this.points[this.points.length - 1][0] });
    return {
      ...base, color: trendColors, legend: { ...legend, data: names, selectedMode: 'multiple' },
      tooltip: { ...tooltip, trigger: 'axis', formatter: this.tooltipFormatter(result) },
      axisPointer: { link: [{ xAxisIndex: 'all' }], snap: true,
        label: { backgroundColor: token('gray-700') }, lineStyle: { color: token('gray-500') } },
      grid: vibrationStackedGrids(['time-domain-waveform-grid', 'time-domain-amplitude-grid']),
      xAxis: [xAxis(0), xAxis(1)],
      yAxis: [
        { ...axis(`${VIBRATION_QUANTITIES[result.quantity].label} (${result.unit})`, true), gridIndex: 0,
          scale: true, ...this.amplitudeAxisRange(result) },
        { ...axis(`Amplitude (${result.unit})`, true), gridIndex: 1, min: 0 },
      ],
      dataZoom: vibrationLinearZoom(['time-domain-zoom-inside', 'time-domain-zoom-slider'], [0, 1], vibrationChartColor()),
      series: [this.waveformSeries(result), ...amplitudeModes.map((mode, index): LineSeriesOption => ({
        id: `${amplitudeSeriesPrefix}${mode}`, name: names[index], type: 'line', xAxisIndex: 1, yAxisIndex: 1,
        encode: { x: 0, y: 1 }, showSymbol: windows.length <= 2, symbol: 'circle', symbolSize: 4,
        lineStyle: { width: 2, color: trendColors[index] }, itemStyle: { color: trendColors[index] },
        data: windows.map((window, windowIndex) => [
          (window.from + (window.to - window.from) / 2) * 1000,
          selectTimeDomainAmplitude(window.statistics, mode), windowIndex,
        ]),
      }))],
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
