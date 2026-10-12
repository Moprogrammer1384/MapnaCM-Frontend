import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import type { EChartsOption } from 'echarts';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';

/** Opt-in Time Domain preview for the shared analysis workspace. */
@Component({
  selector: 'app-vibration-sample-chart',
  standalone: true,
  imports: [ApacheEchartsComponent],
  template: `@if (ready()) { <app-apache-echarts [options]="chartOptions" [mergeOptions]="true" height="400px"></app-apache-echarts> }`,
  host: { class: 'd-block mw-100' },
})
export class VibrationSampleChartComponent implements OnInit, AfterViewInit, OnDestroy {
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

  ngAfterViewInit(): void {
    // PrimeNG first projects the active panel; initialize ECharts once it has layout dimensions.
    this.mountTimer = setTimeout(() => this.ready.set(true));
  }

  private updateTheme(): void {
    const styles = getComputedStyle(document.documentElement);
    const token = (name: string) => styles.getPropertyValue(`--bs-${name}`).trim();
    this.chartOptions = {
      animation: true,
      color: [token('primary')],
      textStyle: { color: token('gray-600'), fontFamily: styles.fontFamily },
      tooltip: {
        trigger: 'axis', valueFormatter: value => `${value} mm/s`,
        backgroundColor: token('body-bg'), borderColor: token('border-color'),
        textStyle: { color: token('body-color') },
      },
      grid: { left: 20, right: 24, top: 45, bottom: 75, containLabel: true },
      xAxis: {
        type: 'value', name: 'Time (s)', nameLocation: 'middle', nameGap: 30,
        min: 0, max: 2, splitLine: { show: false },
        axisLine: { lineStyle: { color: token('gray-500') } },
      },
      yAxis: {
        type: 'value', name: 'Velocity (mm/s)',
        splitLine: { lineStyle: { color: token('border-color') } },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        {
          type: 'slider', xAxisIndex: 0, height: 20, bottom: 10,
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
        name: 'Vibration velocity', type: 'line', showSymbol: false, lineStyle: { width: 2 },
        data: Array.from({ length: 501 }, (_, index) => {
          const time = index / 250;
          const velocity = 2 * Math.sin(2 * Math.PI * 10 * time) + Math.sin(2 * Math.PI * 25 * time);
          return [time, Number(velocity.toFixed(3))];
        }),
      }],
    };
  }

  ngOnDestroy(): void {
    clearTimeout(this.mountTimer);
    this.observer?.disconnect();
  }
}
