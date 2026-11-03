import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import type { EChartsOption, TooltipComponentOption } from 'echarts';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { AMPLITUDE_LABELS, AnalysisChartSettings, VIBRATION_QUANTITIES } from 'src/app/core/models/analysis-chart-settings.model';
import { BodeAnalysis, BodeRecord } from 'src/app/core/models/bode-analysis.model';
import { analyzeBode, bodeSettingsForRecord } from 'src/app/core/services/vibration/bode-analysis/bode-analysis';
import { BODE_DATA_SOURCE } from 'src/app/core/services/vibration/bode-analysis/bode-data-source.service';
import { apiErrorMessage } from 'src/app/core/utils/api-error';
import { formatNumber, NumberFormatPipe } from '../../pipes/number-format.pipe';

/** Paired phase/amplitude plots of one tracking run, sharing speed cursor and zoom. */
@Component({
  selector: 'app-vibration-bode-chart',
  standalone: true,
  imports: [CommonModule, ApacheEchartsComponent, NumberFormatPipe],
  templateUrl: './vibration-bode-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block mw-100', '[attr.aria-busy]': 'loading' },
})
export class VibrationBodeChartComponent implements OnChanges, OnDestroy {
  readonly eventClasses = { Startup: 'badge-light-success', CoastDown: 'badge-light-info', Trip: 'badge-light-danger', LoadChange: 'badge-light-warning' };
  @Input({ required: true }) measurementId: number;
  @Input({ required: true }) from: string;
  @Input({ required: true }) to: string;
  @Input() settings?: AnalysisChartSettings;
  @Input() title = '';
  @Input() tag?: string | null;
  @Input() titleId?: string;
  @Output() readonly sourceSettings = new EventEmitter<AnalysisChartSettings>(true);
  loading = false;
  error = '';
  record?: BodeRecord;
  analysis?: BodeAnalysis;
  chartOptions?: EChartsOption;
  private readonly source = inject(BODE_DATA_SOURCE);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private subscription?: Subscription;
  private readonly observer: MutationObserver;

  constructor() {
    this.observer = new MutationObserver(() => this.zone.run(() => {
      this.updateChartOptions();
      this.cdr.markForCheck();
    }));
    this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['measurementId'] || changes['from'] || changes['to']) { this.reload(); }
    else { this.updateAnalysis(); }
  }

  reload(): void {
    this.subscription?.unsubscribe();
    this.loading = true;
    this.error = '';
    this.record = undefined;
    this.analysis = undefined;
    this.chartOptions = undefined;
    this.subscription = this.source.load({ measurementId: this.measurementId, from: this.from, to: this.to }).subscribe({
      next: result => {
        const records = 'observations' in result ? [result] : result;
        this.record = records[records.length - 1];
        this.loading = false;
        this.updateAnalysis();
      },
      error: error => {
        this.loading = false;
        this.error = apiErrorMessage(error, 'Bode data');
        this.cdr.markForCheck();
      },
    });
  }

  private updateAnalysis(): void {
    this.error = '';
    if (!this.record) { this.cdr.markForCheck(); return; }
    try {
      const settings = bodeSettingsForRecord(this.record, this.settings);
      if (this.settings?.quantity !== settings.quantity || this.settings?.unit !== settings.unit) {
        this.sourceSettings.emit(settings);
      }
      this.analysis = this.record.observations.length ? analyzeBode(this.record, settings) : undefined;
      if (this.analysis) { this.updateChartOptions(); }
      else { this.chartOptions = undefined; }
    } catch (error) {
      this.analysis = undefined;
      this.chartOptions = undefined;
      this.error = apiErrorMessage(error, 'Bode analysis');
    }
    this.cdr.markForCheck();
  }

  private tooltipFormatter(): TooltipComponentOption['formatter'] {
    return params => {
      const entries = Array.isArray(params) ? params : [params];
      const entry = entries.find(item => Array.isArray(item.value) && Number(item.value[2]) >= 0);
      const index = entry && Array.isArray(entry.value) ? Number(entry.value[2]) : -1;
      const point = this.record?.observations[index], result = this.analysis;
      if (!point || !result) { return ''; }
      const quantity = VIBRATION_QUANTITIES[result.quantity].label;
      return `${formatNumber(point.speedRpm)} RPM · ${formatNumber(point.speedRpm / 60)} Hz<br/>` +
        `${quantity}: ${formatNumber(result.amplitude[index])} ${result.unit} ${AMPLITUDE_LABELS[result.amplitudeMode]}<br/>` +
        `Phase: ${formatNumber(result.phase[index])}°<br/>${point.timestamp.replace('T', ' ')}`;
    };
  }

  private updateChartOptions(): void {
    const result = this.analysis;
    if (!result) { return; }
    const styles = getComputedStyle(document.documentElement);
    const token = (name: string) => styles.getPropertyValue(`--bs-${name}`).trim();
    const phasePoints: [number, number | null, number][] = [];
    result.speed.forEach((speed, index) => {
      // A 359° -> 0° wrap is not a physical phase excursion. Break the wrapped
      // trace instead of drawing a false line through all intermediate angles.
      if (result.phaseMode === 'wrapped' && index > 0 && Math.abs(result.phase[index] - result.phase[index - 1]) > 180) {
        phasePoints.push([speed, null, -1]);
      }
      phasePoints.push([speed, result.phase[index], index]);
    });
    const quantity = VIBRATION_QUANTITIES[result.quantity].label;
    const amplitudeName = `${quantity} (${result.unit} ${AMPLITUDE_LABELS[result.amplitudeMode]})`;
    const xAxis = (gridIndex: number) => ({
      type: 'value' as const, gridIndex,
      min: (result.minimumSpeedRpm - (result.speed.length === 1 ? 30 : 0)) / (result.axisUnit === 'Hz' ? 60 : 1),
      max: (result.maximumSpeedRpm + (result.speed.length === 1 ? 30 : 0)) / (result.axisUnit === 'Hz' ? 60 : 1),
      name: gridIndex === 1 ? `Speed (${result.axisUnit})` : '', nameLocation: 'middle' as const, nameGap: 32,
      nameTextStyle: { color: token('gray-700') },
      axisLabel: { formatter: formatNumber, color: token('gray-600'), hideOverlap: true }, splitLine: { show: false },
      axisPointer: { label: { formatter: (params: { value: unknown }) => formatNumber(Number(params.value)) } },
      axisLine: { lineStyle: { color: token('gray-500') } },
    });
    this.chartOptions = {
      animation: false,
      textStyle: { color: token('gray-600'), fontFamily: styles.fontFamily },
      tooltip: { trigger: 'axis', formatter: this.tooltipFormatter(), confine: true,
        backgroundColor: token('body-bg'), borderColor: token('border-color'), textStyle: { color: token('body-color') } },
      axisPointer: { link: [{ xAxisIndex: 'all' }], snap: true,
        label: { backgroundColor: token('gray-700') }, lineStyle: { color: token('gray-500') } },
      grid: [
        { id: 'bode-amplitude-grid', left: 64, right: 30, top: 36, height: '34%' },
        { id: 'bode-phase-grid', left: 64, right: 30, top: '52%', height: '30%' },
      ],
      xAxis: [xAxis(0), xAxis(1)],
      yAxis: [
        { type: 'value', gridIndex: 0, name: amplitudeName, min: 0, nameTextStyle: { align: 'left', color: token('gray-700') },
          axisLabel: { formatter: formatNumber, color: token('gray-600') }, splitLine: { lineStyle: { color: token('border-color') } } },
        { type: 'value', gridIndex: 1, name: result.phaseMode === 'wrapped' ? 'Phase (°)' : 'Continuous phase (°)',
          min: result.phaseMode === 'wrapped' ? 0 : Math.floor(result.phase.reduce((min, value) => Math.min(min, value), Infinity) / 90) * 90,
          max: result.phaseMode === 'wrapped' ? 360 : Math.ceil(result.phase.reduce((max, value) => Math.max(max, value), -Infinity) / 90) * 90 + 90,
          interval: 90,
          nameTextStyle: { align: 'left', color: token('gray-700') }, axisLabel: { formatter: formatNumber, color: token('gray-600') },
          splitLine: { lineStyle: { color: token('border-color') } } },
      ],
      dataZoom: [
        { id: 'bode-zoom-inside', type: 'inside', xAxisIndex: [0, 1], filterMode: 'none' },
        { id: 'bode-zoom-slider', type: 'slider', xAxisIndex: [0, 1], filterMode: 'none', height: 20, bottom: 10,
          labelFormatter: formatNumber, borderColor: token('border-color'), backgroundColor: token('gray-100'),
          fillerColor: token('primary-light'), textStyle: { color: token('gray-600') },
          handleStyle: { color: token('primary'), borderColor: token('primary') }, moveHandleStyle: { color: token('primary') },
          dataBackground: { lineStyle: { color: token('gray-500') }, areaStyle: { color: token('gray-200') } },
          selectedDataBackground: { lineStyle: { color: token('primary') }, areaStyle: { color: token('primary-light') } } },
      ],
      series: [
        { id: 'bode-amplitude', name: '1X amplitude', type: 'line', xAxisIndex: 0, yAxisIndex: 0, showSymbol: result.speed.length <= 2,
          lineStyle: { width: 1.5, color: token('primary') }, itemStyle: { color: token('primary') },
          data: result.speed.map((speed, index) => [speed, result.amplitude[index], index]),
          markPoint: { symbol: 'circle', symbolSize: 8, itemStyle: { color: token('warning') },
            label: { show: false }, data: [{ name: 'Peak amplitude', coord: [result.speed[result.peakIndex], result.amplitude[result.peakIndex]] }] } },
        { id: 'bode-phase', name: '1X phase', type: 'line', xAxisIndex: 1, yAxisIndex: 1,
          // Wrapped runs can have isolated points between consecutive wraps.
          // Keep their markers visible even when neither adjacent line is drawn.
          showSymbol: result.phaseMode === 'wrapped' || result.speed.length <= 2, symbol: 'circle', symbolSize: 3,
          connectNulls: false, lineStyle: { width: 1.5, color: token('info') }, itemStyle: { color: token('info') }, data: phasePoints },
      ],
    };
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.observer.disconnect();
  }
}
