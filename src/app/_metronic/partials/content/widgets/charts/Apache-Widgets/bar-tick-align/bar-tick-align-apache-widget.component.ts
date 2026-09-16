import { Component } from '@angular/core';
import { ApacheEchartsComponent } from '../../Apache-Echarts/apache-echarts.component';

@Component({
  selector: 'app-apache-widget-bar-tick-align',
  standalone: true,
  imports: [ApacheEchartsComponent],
  template: `<app-apache-echarts [demoId]="demoId" height="420px"></app-apache-echarts>`,
})
export class BarTickAlignApacheWidgetComponent {
  readonly demoId = "bar-tick-align";
}
