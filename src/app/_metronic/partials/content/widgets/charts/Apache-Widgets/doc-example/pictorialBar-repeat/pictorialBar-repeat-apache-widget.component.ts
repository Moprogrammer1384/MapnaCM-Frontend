import { Component } from '@angular/core';
import { ApacheEchartsComponent } from '../../../Apache-Echarts/apache-echarts.component';

@Component({
  selector: 'app-apache-widget-doc-example-pictorialbar-repeat',
  standalone: true,
  imports: [ApacheEchartsComponent],
  template: `<app-apache-echarts [demoId]="demoId" height="420px"></app-apache-echarts>`,
})
export class DocExamplePictorialBarRepeatApacheWidgetComponent {
  readonly demoId = "doc-example/pictorialBar-repeat";
}
