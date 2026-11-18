import { Component } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, shareReplay, startWith, switchMap } from 'rxjs';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { AnalysisChartSettings } from 'src/app/core/models/analysis-chart-settings.model';
import { AnalysisTab } from 'src/app/core/models/analysis-panel.model';
import { TimeDomainAvailability, VibrationTimeDomainAcquisitionApiService } from
  'src/app/core/services/vibration/api/vibration-time-domain-acquisition-api.service';
import { VIBRATION_DATA_SOURCE, vibrationError } from 'src/app/core/services/vibration/api/vibration-time-domain-api.service';

const EMPTY_RANGE = { from: '', to: '' };
interface AvailabilityState {
  readonly loading: boolean;
  readonly data?: TimeDomainAvailability;
  readonly error?: string;
}

@Component({
  selector: 'app-vibration-time-domain',
  templateUrl: './time-domain.component.html',
  styleUrls: ['./time-domain.component.scss'],
  providers: [VibrationTimeDomainAcquisitionApiService,
    { provide: VIBRATION_DATA_SOURCE, useExisting: VibrationTimeDomainAcquisitionApiService }],
})
export class VibrationTimeDomainComponent {
  readonly chartReady = (tab: AnalysisTab) => tab.timeDomainRecentSeconds !== undefined || !!tab.timeDomainEvent;
  private readonly availability = new WeakMap<AnalysisTab['selection'],
    { refresh: BehaviorSubject<void>; state: Observable<AvailabilityState> }>();

  constructor(public state: VibrationSelectionService, private api: VibrationTimeDomainAcquisitionApiService) {}

  range(tab: AnalysisTab) {
    return tab.timeDomainEvent ?? EMPTY_RANGE;
  }

  catalogue(tab: AnalysisTab): Observable<AvailabilityState> {
    let entry = this.availability.get(tab.selection);
    if (!entry) {
      const refresh = new BehaviorSubject<void>(undefined);
      const state = refresh.pipe(switchMap(() => this.api.availability(tab.selection.measurementIds).pipe(
        map((data): AvailabilityState => ({ loading: false, data })),
        catchError(error => of({ loading: false, error: vibrationError(error) })),
        startWith({ loading: true }),
      )), shareReplay({ bufferSize: 1, refCount: true }));
      entry = { refresh, state };
      this.availability.set(tab.selection, entry);
    }
    return entry.state;
  }

  retryCatalogue(tab: AnalysisTab): void {
    this.availability.get(tab.selection)?.refresh.next();
  }

  showRecent(tabId: string, seconds: number, maximum: number): void {
    if (Number.isInteger(seconds) && seconds >= 1 && seconds <= maximum) {
      this.state.setTimeDomainRecentSeconds(tabId, seconds);
    }
  }

  initializeSettings(tabId: string, settings: AnalysisChartSettings): void {
    if (this.state.tabs().some(tab => tab.id === tabId && !tab.chartSettings)) {
      this.state.updateChartSettings(tabId, settings);
    }
  }
}
