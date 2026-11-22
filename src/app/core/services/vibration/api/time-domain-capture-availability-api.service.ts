import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, shareReplay, startWith, switchMap } from 'rxjs';
import { AssetTaxonomyExecution } from '../../../models/asset-taxonomy-selection.model';
import { TimeDomainAvailability, VibrationTimeDomainAcquisitionApiService } from './vibration-time-domain-acquisition-api.service';
import { vibrationError } from './vibration-time-domain-api.service';

interface AvailabilityState {
  readonly loading: boolean;
  readonly data?: TimeDomainAvailability;
  readonly error?: string;
}

@Injectable()
export class TimeDomainCaptureAvailabilityApiService {
  private readonly api = inject(VibrationTimeDomainAcquisitionApiService);
  private readonly entries = new WeakMap<AssetTaxonomyExecution['selection'],
    { refresh: BehaviorSubject<void>; state: Observable<AvailabilityState> }>();

  forSelection(selection: AssetTaxonomyExecution['selection']): Observable<AvailabilityState> {
    let entry = this.entries.get(selection);
    if (!entry) {
      const refresh = new BehaviorSubject<void>(undefined);
      const state = refresh.pipe(switchMap(() => this.api.availability(selection.measurementIds).pipe(
        map((data): AvailabilityState => ({ loading: false, data })),
        catchError(error => of({ loading: false, error: vibrationError(error) })),
        startWith({ loading: true }),
      )), shareReplay({ bufferSize: 1, refCount: true }));
      entry = { refresh, state };
      this.entries.set(selection, entry);
    }
    return entry.state;
  }

  retry(selection: AssetTaxonomyExecution['selection']): void {
    this.entries.get(selection)?.refresh.next();
  }
}
