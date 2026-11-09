import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrbitAcquisitionPickerComponent } from 'src/app/shared/components/orbit-acquisition-picker/orbit-acquisition-picker.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AnalysisWorkspaceComponent } from 'src/app/shared/components/analysis-workspace-panel/analysis-workspace.component';
import { VibrationOverviewComponent } from './overview/overview.component';
import { VibrationTimeDomainComponent } from './time-domain/time-domain.component';
import { VibrationFrequencyDomainComponent } from './frequency-domain/frequency-domain.component';
import { VibrationFrequencyDomainChartComponent } from 'src/app/shared/components/vibration-frequency-domain-chart/vibration-frequency-domain-chart.component';
import { VibrationTimeDomainChartComponent } from 'src/app/shared/components/vibration-time-domain-chart/vibration-time-domain-chart.component';
import { VibrationBodeAnalysisComponent } from './bode-analysis/bode-analysis.component';
import { VibrationBodeChartComponent } from 'src/app/shared/components/vibration-bode-chart/vibration-bode-chart.component';
import { VibrationRotorPositionComponent } from './rotor-position/rotor-position.component';
import { VibrationOrbitAnalysisComponent } from './orbit-analysis/orbit-analysis.component';
import { VibrationOrbitChartComponent } from 'src/app/shared/components/vibration-orbit-chart/vibration-orbit-chart.component';
import { OrbitAnalysisControlsComponent } from 'src/app/shared/components/orbit-analysis-controls/orbit-analysis-controls.component';
import { RotorPositionControlsComponent } from 'src/app/shared/components/rotor-position-controls/rotor-position-controls.component';
import { RotorPositionEventPickerComponent } from 'src/app/shared/components/rotor-position-event-picker/rotor-position-event-picker.component';
import { VibrationRotorPositionChartComponent } from 'src/app/shared/components/vibration-rotor-position-chart/vibration-rotor-position-chart.component';
import { MeasurementHeadingPipe } from 'src/app/shared/pipes/measurement-heading.pipe';

@NgModule({
  declarations: [
    VibrationOverviewComponent,
    VibrationTimeDomainComponent,
    VibrationFrequencyDomainComponent,
    VibrationBodeAnalysisComponent,
    VibrationOrbitAnalysisComponent,
    VibrationRotorPositionComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AnalysisWorkspaceComponent,
    OrbitAcquisitionPickerComponent,
    VibrationFrequencyDomainChartComponent,
    VibrationTimeDomainChartComponent,
    VibrationBodeChartComponent,
    VibrationOrbitChartComponent,
    OrbitAnalysisControlsComponent,
    RotorPositionControlsComponent,
    RotorPositionEventPickerComponent,
    VibrationRotorPositionChartComponent,
    MeasurementHeadingPipe,
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
      { path: 'orbit-analysis', component: VibrationOrbitAnalysisComponent },
      {
        path: 'rotor-position',
        component: VibrationRotorPositionComponent,
      },
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
    ]),
  ],
})
export class VibrationModule {}
