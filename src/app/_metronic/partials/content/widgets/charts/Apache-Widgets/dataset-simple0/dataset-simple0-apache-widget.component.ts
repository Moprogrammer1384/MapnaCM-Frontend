import { Component } from '@angular/core';
import { ApacheEchartsComponent } from '../../Apache-Echarts/apache-echarts.component';

@Component({
  selector: 'app-apache-widget-dataset-simple0',
  standalone: true,
  imports: [ApacheEchartsComponent],
  template: `<app-apache-echarts [demoId]="demoId" height="420px"></app-apache-echarts>`,
})
export class DatasetSimple0ApacheWidgetComponent {
  readonly demoId = "dataset-simple0";
}
