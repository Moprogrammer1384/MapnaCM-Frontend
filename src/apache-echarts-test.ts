import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

import './app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component.spec';
import './app/modules/widgets-examples/apache-charts/apache-charts.component.spec';
