import { inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { BodeRecord } from '../../../models/bode-analysis.model';
import { DateTimeRange } from '../../../models/date-time-range.model';
import { VibrationBodeAnalysisApiService } from '../api/vibration-bode-analysis-api.service';

export interface BodeDataRequest extends DateTimeRange { readonly measurementId: number; }
export interface BodeDataSource {
  load(request: BodeDataRequest): Observable<BodeRecord | readonly BodeRecord[]>;
}
export const BODE_DATA_SOURCE = new InjectionToken<BodeDataSource>('BODE_DATA_SOURCE', {
  providedIn: 'root', factory: () => inject(VibrationBodeAnalysisApiService),
});
