import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { VibrationOverviewComponent } from './overview/overview.component';
import { VibrationTimeDomainComponent } from './time-domain/time-domain.component';
import { VibrationFrequencyDomainComponent } from './frequency-domain/frequency-domain.component';
import { VibrationBodeAnalysisComponent } from './bode-analysis/bode-analysis.component';
import { VibrationRotorPositionComponent } from './rotor-position/rotor-position.component';

@NgModule({
  declarations: [
    VibrationOverviewComponent,
    VibrationTimeDomainComponent,
    VibrationFrequencyDomainComponent,
    VibrationBodeAnalysisComponent,
    VibrationRotorPositionComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    ApacheEchartsComponent,
    RouterModule.forChild([
      {
        path: 'overview',
        component: VibrationOverviewComponent,
      },
      {
        path: 'time-domain',
        component: VibrationTimeDomainComponent,
      },
      {
        path: 'frequency-domain',
        component: VibrationFrequencyDomainComponent,
      },
      {
        path: 'bode-analysis',
        component: VibrationBodeAnalysisComponent,
      },
      {
        path: 'rotor-position',
        component: VibrationRotorPositionComponent,
      },
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
    ]),
  ],
})
export class VibrationModule {}
