import { inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { WaterfallCapture, WaterfallEvent, WaterfallRequest } from '../../../models/waterfall.model';
import { VibrationWaterfallApiService } from '../api/vibration-waterfall-api.service';

export interface WaterfallDataSource {
  listEvents(measurementIds: readonly number[]): Observable<readonly WaterfallEvent[]>;
  load(request: WaterfallRequest): Observable<WaterfallCapture | null>;
}

export const WATERFALL_DATA_SOURCE = new InjectionToken<WaterfallDataSource>('WATERFALL_DATA_SOURCE', {
  providedIn: 'root', factory: () => inject(VibrationWaterfallApiService),
});
