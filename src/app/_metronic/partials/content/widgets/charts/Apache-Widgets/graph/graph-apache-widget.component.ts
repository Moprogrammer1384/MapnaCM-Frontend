import { Component } from '@angular/core';
import { ApacheEchartsComponent } from '../../Apache-Echarts/apache-echarts.component';

@Component({
  selector: 'app-apache-widget-graph',
  standalone: true,
  imports: [ApacheEchartsComponent],
  template: `<app-apache-echarts [demoId]="demoId" height="420px"></app-apache-echarts>`,
})
export class GraphApacheWidgetComponent {
  readonly demoId = "graph";
}
