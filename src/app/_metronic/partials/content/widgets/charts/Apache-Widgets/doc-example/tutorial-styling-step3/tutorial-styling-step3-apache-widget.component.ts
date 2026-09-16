import { Component } from '@angular/core';
import { ApacheEchartsComponent } from '../../../Apache-Echarts/apache-echarts.component';

@Component({
  selector: 'app-apache-widget-doc-example-tutorial-styling-step3',
  standalone: true,
  imports: [ApacheEchartsComponent],
  template: `<app-apache-echarts [demoId]="demoId" height="420px"></app-apache-echarts>`,
})
export class DocExampleTutorialStylingStep3ApacheWidgetComponent {
  readonly demoId = "doc-example/tutorial-styling-step3";
}
