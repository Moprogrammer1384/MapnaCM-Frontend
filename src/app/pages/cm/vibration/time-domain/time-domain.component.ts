import { Component } from '@angular/core';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { AnalysisChartSettings } from 'src/app/core/models/analysis-chart-settings.model';
import { AnalysisTab } from 'src/app/core/models/analysis-panel.model';
import { TimeDomainCaptureAvailabilityApiService } from 'src/app/core/services/vibration/api/time-domain-capture-availability-api.service';
import { VibrationTimeDomainAcquisitionApiService } from 'src/app/core/services/vibration/api/vibration-time-domain-acquisition-api.service';
import { VIBRATION_DATA_SOURCE } from 'src/app/core/services/vibration/api/vibration-time-domain-api.service';

const EMPTY_RANGE = { from: '', to: '' };

@Component({
  selector: 'app-vibration-time-domain',
  templateUrl: './time-domain.component.html',
  styleUrls: ['./time-domain.component.scss'],
  providers: [TimeDomainCaptureAvailabilityApiService, VibrationTimeDomainAcquisitionApiService,
    { provide: VIBRATION_DATA_SOURCE, useExisting: VibrationTimeDomainAcquisitionApiService }],
})
export class VibrationTimeDomainComponent {
  readonly chartReady = (tab: AnalysisTab) => tab.timeDomainRecentSeconds !== undefined || !!tab.timeDomainEvent;
  constructor(public state: VibrationSelectionService, public captureAvailability: TimeDomainCaptureAvailabilityApiService) {}

  range(tab: AnalysisTab) {
    return tab.timeDomainEvent ?? EMPTY_RANGE;
  }

  showRecent(tabId: string, seconds: number): void {
    if (Number.isInteger(seconds) && seconds >= 1) {
      this.state.setTimeDomainRecentSeconds(tabId, seconds);
    }
  }

  initializeSettings(tabId: string, settings: AnalysisChartSettings): void {
    if (this.state.tabs().some(tab => tab.id === tabId && !tab.chartSettings)) {
      this.state.updateChartSettings(tabId, settings);
    }
  }
}
