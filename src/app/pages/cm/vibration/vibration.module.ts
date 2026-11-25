import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrbitAcquisitionPickerComponent } from 'src/app/shared/components/vibration/orbit-analysis-acquisition-picker/orbit-analysis-acquisition-picker.component';
import { VibrationEventPickerComponent } from 'src/app/shared/components/vibration/event-picker/event-picker.component';
import { VibrationOnlineWindowPickerComponent } from 'src/app/shared/components/vibration/time-domain-online-window-picker/time-domain-online-window-picker.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AnalysisWorkspaceComponent } from 'src/app/shared/components/analysis-workspace-panel/analysis-workspace.component';
import { VibrationOverviewComponent } from './overview/overview.component';
import { VibrationTimeDomainComponent } from './time-domain/time-domain.component';
import { VibrationFrequencyDomainComponent } from './frequency-domain/frequency-domain.component';
import { VibrationFrequencyDomainChartComponent } from 'src/app/shared/components/vibration/frequency-domain-chart/frequency-domain-chart.component';
import { VibrationTimeDomainChartComponent } from 'src/app/shared/components/vibration/time-domain-chart/time-domain-chart.component';
import { VibrationBodeAnalysisComponent } from './bode-analysis/bode-analysis.component';
import { VibrationBodeChartComponent } from 'src/app/shared/components/vibration/bode-analysis-chart/bode-analysis-chart.component';
import { VibrationRotorPositionComponent } from './rotor-position/rotor-position.component';
import { VibrationOrbitAnalysisComponent } from './orbit-analysis/orbit-analysis.component';
import { VibrationOrbitChartComponent } from 'src/app/shared/components/vibration/orbit-analysis-chart/orbit-analysis-chart.component';
import { OrbitAnalysisControlsComponent } from 'src/app/shared/components/vibration/orbit-analysis-controls/orbit-analysis-controls.component';
import { RotorPositionControlsComponent } from 'src/app/shared/components/vibration/rotor-position-controls/rotor-position-controls.component';
import { RotorPositionEventPickerComponent } from 'src/app/shared/components/vibration/rotor-position-event-picker/rotor-position-event-picker.component';
import { VibrationRotorPositionChartComponent } from 'src/app/shared/components/vibration/rotor-position-chart/rotor-position-chart.component';
import { MeasurementHeadingPipe } from 'src/app/shared/pipes/measurement-heading.pipe';
import { VibrationWaterfallComponent } from './waterfall/waterfall.component';
import { WaterfallControlsComponent } from 'src/app/shared/components/vibration/waterfall-controls/waterfall-controls.component';
import { WaterfallAcquisitionPickerComponent } from 'src/app/shared/components/vibration/waterfall-acquisition-picker/waterfall-acquisition-picker.component';
import { VibrationWaterfallChartComponent } from 'src/app/shared/components/vibration/waterfall-chart/waterfall-chart.component';

@NgModule({
  declarations: [
    VibrationOverviewComponent,
    VibrationTimeDomainComponent,
    VibrationFrequencyDomainComponent,
    VibrationBodeAnalysisComponent,
    VibrationOrbitAnalysisComponent,
    VibrationRotorPositionComponent,
    VibrationWaterfallComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AnalysisWorkspaceComponent,
    OrbitAcquisitionPickerComponent,
    VibrationEventPickerComponent,
    VibrationFrequencyDomainChartComponent,
    VibrationTimeDomainChartComponent,
    VibrationOnlineWindowPickerComponent,
    VibrationBodeChartComponent,
    VibrationOrbitChartComponent,
    OrbitAnalysisControlsComponent,
    RotorPositionControlsComponent,
    RotorPositionEventPickerComponent,
    VibrationRotorPositionChartComponent,
    MeasurementHeadingPipe,
    WaterfallControlsComponent,
    WaterfallAcquisitionPickerComponent,
    VibrationWaterfallChartComponent,
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
      { path: 'signal-indicators', loadComponent: () => import('./signal-indicators/signal-indicators.component').then(module => module.VibrationSignalIndicatorsComponent) },
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
      { path: 'waterfall', component: VibrationWaterfallComponent },
    ]),
  ],
})
export class VibrationModule {}
