import { Component } from '@angular/core';
import { AnalysisChartSettings } from 'src/app/core/models/analysis-chart-settings.model';
import { AnalysisTab } from 'src/app/core/models/analysis-panel.model';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { TimeDomainCaptureAvailabilityApiService } from 'src/app/core/services/vibration/api/time-domain-capture-availability-api.service';
import { VibrationTimeDomainAcquisitionApiService } from 'src/app/core/services/vibration/api/vibration-time-domain-acquisition-api.service';
import { VIBRATION_DATA_SOURCE } from 'src/app/core/services/vibration/api/vibration-time-domain-api.service';

@Component({
  selector: 'app-vibration-frequency-domain',
  templateUrl: './frequency-domain.component.html',
  styleUrls: ['./frequency-domain.component.scss'],
  providers: [TimeDomainCaptureAvailabilityApiService, VibrationTimeDomainAcquisitionApiService,
    { provide: VIBRATION_DATA_SOURCE, useExisting: VibrationTimeDomainAcquisitionApiService }],
})
export class VibrationFrequencyDomainComponent {
  readonly chartReady = (tab: AnalysisTab) => !!tab.timeDomainEvent;
  readonly emptyRange = { from: '', to: '' };

  constructor(public state: VibrationSelectionService, public captureAvailability: TimeDomainCaptureAvailabilityApiService) {}

  initializeSettings(tabId: string, settings: AnalysisChartSettings): void {
    if (this.state.tabs().some(tab => tab.id === tabId && !tab.chartSettings)) {
      this.state.updateChartSettings(tabId, settings);
    }
  }
}
