import { Component } from '@angular/core';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-vibration-time-domain',
  templateUrl: './time-domain.component.html',
  styleUrls: ['./time-domain.component.scss'],
})
export class VibrationTimeDomainComponent {
  readonly chartOptions: EChartsOption = {
    animation: false,
    color: ['#3e97ff'],
    tooltip: { trigger: 'axis', valueFormatter: (value) => `${value} mm/s` },
    grid: { left: 20, right: 24, top: 45, bottom: 75, containLabel: true },
    xAxis: {
      type: 'value',
      name: 'Time (s)',
      nameLocation: 'middle',
      nameGap: 30,
      min: 0,
      max: 2,
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      name: 'Velocity (mm/s)',
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0 },
      { type: 'slider', xAxisIndex: 0, height: 20, bottom: 10 },
    ],
    series: [{
      name: 'Vibration velocity',
      type: 'line',
      showSymbol: false,
      lineStyle: { width: 2 },
      data: Array.from({ length: 501 }, (_, index) => {
        const time = index / 250;
        const velocity = 2 * Math.sin(2 * Math.PI * 10 * time)
          + 1 * Math.sin(2 * Math.PI * 25 * time);
        return [time, Number(velocity.toFixed(3))];
      }),
    }],
  };
}
