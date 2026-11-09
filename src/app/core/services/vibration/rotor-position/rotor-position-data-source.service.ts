import { inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { RotorPositionEvent, RotorPositionPair, RotorPositionRecord } from 'src/app/core/models/rotor-position.model';
import { VibrationRotorPositionApiService } from '../api/vibration-rotor-position-api.service';

/** Recorded DC acquisition source. Bode tracking amplitudes are never reused as probe means. */
export interface RotorPositionDataSource {
  listEvents(pairs: readonly RotorPositionPair[]): Observable<readonly RotorPositionEvent[]>;
  load(pair: RotorPositionPair, eventId: string): Observable<RotorPositionRecord | null>;
}
export const ROTOR_POSITION_DATA_SOURCE = new InjectionToken<RotorPositionDataSource>('ROTOR_POSITION_DATA_SOURCE', {
  providedIn: 'root', factory: () => inject(VibrationRotorPositionApiService),
});
