import { AfterViewInit, Component, Input, NgZone, OnChanges, OnDestroy, OnInit, signal } from '@angular/core';
import type { EChartsOption } from 'echarts';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { AMPLITUDE_LABELS, AnalysisChartSettings, defaultChartSettings, VIBRATION_QUANTITIES, vibrationUnit } from 'src/app/core/models/analysis-chart-settings.model';
import { createFrequencyDomainSampleData, frequencyAxis } from './frequency-domain-sample.data';
import { formatAnalysisNumber } from 'src/app/shared/components/analysis-workspace-panel/analysis-number-format';

/** Page-specific frequency spectrum preview; independent of Measurement/date data. */
@Component({
  selector: 'app-frequency-domain-sample-chart',
  standalone: true,
  imports: [ApacheEchartsComponent],
  template: `@if (ready()) { <app-apache-echarts [options]="chartOptions" [mergeOptions]="true" height="400px"></app-apache-echarts> }`,
  host: { class: 'd-block mw-100' },
})
export class FrequencyDomainSampleChartComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() settings?: AnalysisChartSettings;
  readonly ready = signal(false);
  chartOptions: EChartsOption;
  private observer?: MutationObserver;
  private mountTimer?: ReturnType<typeof setTimeout>;

  constructor(private zone: NgZone) {}

  ngOnInit(): void {
    this.updateTheme();
    this.observer = new MutationObserver(() => this.zone.run(() => this.updateTheme()));
    this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
  }

  ngOnChanges(): void { this.updateTheme(); }

  ngAfterViewInit(): void {
    // Wait for the workspace to project the active panel before ECharts measures it.
    this.mountTimer = setTimeout(() => this.ready.set(true));
  }

  private updateTheme(): void {
    const styles = getComputedStyle(document.documentElement);
    const token = (name: string) => styles.getPropertyValue(`--bs-${name}`).trim();
    const settings = this.settings ?? defaultChartSettings('frequency');
    const quantity = VIBRATION_QUANTITIES[settings.quantity];
    const unit = vibrationUnit(settings).value;
    const amplitude = AMPLITUDE_LABELS[settings.amplitude];
    const axis = frequencyAxis(settings.xAxis);
    this.chartOptions = {
      animation: true,
      color: [token('primary')],
      textStyle: { color: token('gray-600'), fontFamily: styles.fontFamily },
      tooltip: {
        trigger: 'axis',
        formatter: params => {
          const point = Array.isArray(params) ? params[0] : params;
          if (!Array.isArray(point.value)) { return ''; }
          return `${formatAnalysisNumber(Number(point.value[0]))} ${axis.unit}<br/>${quantity.label}: ${formatAnalysisNumber(Number(point.value[1]))} ${unit} ${amplitude}`;
        },
        backgroundColor: token('body-bg'), borderColor: token('border-color'),
        textStyle: { color: token('body-color') },
      },
      grid: { left: 20, right: 24, top: 45, bottom: 75, containLabel: true },
      xAxis: {
        type: 'value', name: `Frequency (${axis.unit})`, nameLocation: 'middle', nameGap: 30,
        min: 0, max: 125 * axis.scale, splitLine: { show: false },
        axisLabel: { formatter: formatAnalysisNumber },
        axisPointer: { label: { formatter: params => formatAnalysisNumber(Number(params.value)) } },
        axisLine: { lineStyle: { color: token('gray-500') } },
      },
      yAxis: {
        type: 'value', name: `${quantity.label} (${unit} ${amplitude})`, min: 0,
        nameTextStyle: { align: 'left' },
        axisLabel: { formatter: formatAnalysisNumber },
        axisPointer: { label: { formatter: params => formatAnalysisNumber(Number(params.value)) } },
        splitLine: { lineStyle: { color: token('border-color') } },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        {
          type: 'slider', xAxisIndex: 0, height: 20, bottom: 10,
          labelFormatter: formatAnalysisNumber,
          borderColor: token('border-color'), backgroundColor: token('gray-100'),
          fillerColor: token('primary-light'), textStyle: { color: token('gray-600') },
          handleStyle: { color: token('primary'), borderColor: token('primary') },
          moveHandleStyle: { color: token('primary') },
          dataBackground: {
            lineStyle: { color: token('gray-500') }, areaStyle: { color: token('gray-200') },
          },
          selectedDataBackground: {
            lineStyle: { color: token('primary') }, areaStyle: { color: token('primary-light') },
          },
        },
      ],
      series: [{
        id: 'sample',
        name: `${quantity.label} ${amplitude}`, type: 'line', showSymbol: false,
        lineStyle: { width: 2 }, data: createFrequencyDomainSampleData(settings),
      }],
    };
  }

  ngOnDestroy(): void {
    clearTimeout(this.mountTimer);
    this.observer?.disconnect();
  }
}
