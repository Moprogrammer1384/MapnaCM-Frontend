import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AnalysisWorkspaceComponent } from 'src/app/shared/components/analysis-workspace-panel/analysis-workspace.component';
import { PerformanceOverviewComponent } from './overview/overview.component';
import { PerformanceOperatingParametersComponent } from './operating-parameters/operating-parameters.component';
import { PerformanceTrendsComponent } from './performance-trends/performance-trends.component';
import { PerformancePowerLoadAnalysisComponent } from './power-load-analysis/power-load-analysis.component';
import { PerformanceHeatRateEfficiencyComponent } from './heat-rate-efficiency/heat-rate-efficiency.component';
import { PerformanceActualVsReferenceComponent } from './actual-vs-reference/actual-vs-reference.component';

@NgModule({
  declarations: [
    PerformanceOverviewComponent,
    PerformanceOperatingParametersComponent,
    PerformanceTrendsComponent,
    PerformancePowerLoadAnalysisComponent,
    PerformanceHeatRateEfficiencyComponent,
    PerformanceActualVsReferenceComponent,
  ],
  imports: [
    AnalysisWorkspaceComponent,
    RouterModule.forChild([
      { path: 'overview', component: PerformanceOverviewComponent },
      { path: 'operating-parameters', component: PerformanceOperatingParametersComponent },
      { path: 'performance-trends', component: PerformanceTrendsComponent },
      { path: 'power-load-analysis', component: PerformancePowerLoadAnalysisComponent },
      { path: 'heat-rate-efficiency', component: PerformanceHeatRateEfficiencyComponent },
      { path: 'actual-vs-reference', component: PerformanceActualVsReferenceComponent },
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
    ]),
  ],
})
export class PerformanceModule {}
