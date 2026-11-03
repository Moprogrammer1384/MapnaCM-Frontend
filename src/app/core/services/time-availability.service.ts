import { inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CalendarDateRange, TimeAvailability } from '../models/time-availability.model';
import { VibrationTimeDomainAvailabilityApiService } from './vibration/api/vibration-time-domain-availability-api.service';

export interface TimeAvailabilitySource {
  getAvailability(ids: readonly number[], window?: CalendarDateRange): Observable<TimeAvailability>;
}

export const TIME_AVAILABILITY_SOURCE = new InjectionToken<TimeAvailabilitySource>('TIME_AVAILABILITY_SOURCE', {
  providedIn: 'root', factory: () => inject(VibrationTimeDomainAvailabilityApiService),
});
