import { inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { RotorPositionEvent, RotorPositionPair, RotorPositionRecord } from 'src/app/core/models/rotor-position.model';
import { RotorPositionMockDataSource } from './rotor-position-mock-data-source.service';

/** Frontend seam for a future agreed adapter. No assumed endpoint or Bode amplitude reuse. */
export interface RotorPositionDataSource {
  listEvents(pairs: readonly RotorPositionPair[]): Observable<readonly RotorPositionEvent[]>;
  load(pair: RotorPositionPair, eventId: string): Observable<RotorPositionRecord | null>;
}
export const ROTOR_POSITION_DATA_SOURCE = new InjectionToken<RotorPositionDataSource>('ROTOR_POSITION_DATA_SOURCE', {
  providedIn: 'root', factory: () => inject(RotorPositionMockDataSource),
});
