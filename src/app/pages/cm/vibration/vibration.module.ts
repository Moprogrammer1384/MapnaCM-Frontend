import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AnalysisWorkspaceComponent } from 'src/app/shared/components/analysis-workspace-panel/analysis-workspace.component';
import { VibrationOverviewComponent } from './overview/overview.component';
import { VibrationTimeDomainComponent } from './time-domain/time-domain.component';
import { VibrationFrequencyDomainComponent } from './frequency-domain/frequency-domain.component';
import { VibrationFrequencyDomainChartComponent } from 'src/app/shared/components/vibration-frequency-domain-chart/vibration-frequency-domain-chart.component';
import { VibrationTimeDomainChartComponent } from 'src/app/shared/components/vibration-time-domain-chart/vibration-time-domain-chart.component';
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
    AnalysisWorkspaceComponent,
    VibrationFrequencyDomainChartComponent,
    VibrationTimeDomainChartComponent,
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
