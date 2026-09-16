import { Component } from '@angular/core';
import { ApacheEchartsComponent } from '../../../Apache-Echarts/apache-echarts.component';

@Component({
  selector: 'app-apache-widget-doc-example-axispointer-handle-image',
  standalone: true,
  imports: [ApacheEchartsComponent],
  template: `<app-apache-echarts [demoId]="demoId" height="420px"></app-apache-echarts>`,
})
export class DocExampleAxisPointerHandleImageApacheWidgetComponent {
  readonly demoId = "doc-example/axisPointer-handle-image";
}
