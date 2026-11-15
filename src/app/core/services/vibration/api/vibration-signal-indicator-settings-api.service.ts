import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiEnvelope } from '../../../models/response.model';
import { SIGNAL_INDICATOR_BOUNDARIES, SignalIndicatorAlarmRange, SignalIndicatorAlarmSetting } from '../../../models/signal-indicators.model';
import { AmplitudeMode } from '../../../models/analysis-chart-settings.model';
import { apiErrorMessage } from '../../../utils/api-error';
import { scaleSignalIndicatorLimits, validSignalIndicatorLimits } from '../signal-indicators/signal-indicators-alarms';
import { unitToSi } from '../time-domain/time-domain-unit-conversion';
import { vibrationProfile } from './vibration-time-domain-api.service';

interface SettingDto extends SignalIndicatorAlarmRange {
  readonly id: number; readonly quantity: number; readonly unit: number; readonly metric: number;
}

@Injectable({ providedIn: 'root' })
export class VibrationSignalIndicatorSettingsApiService {
  private readonly http = inject(HttpClient);
  load(): Observable<readonly SignalIndicatorAlarmSetting[]> {
    return defer(() => {
      return this.http.get<ApiEnvelope<readonly SettingDto[]>>(`${environment.apiUrl}/SignalIndicatorSettings/Get`);
    }).pipe(map(response => {
      if (!response.success || !Array.isArray(response.data)) { throw new Error(apiErrorMessage(response, 'alarm settings')); }
      const seen = new Set<string>();
      return response.data.map(item => {
        const profile = vibrationProfile(item.quantity, item.unit);
        const metric = ({ 1: 'rms', 2: '0p', 3: 'pp' } as Record<number, AmplitudeMode>)[item.metric];
        const key = `${profile.quantity}:${metric}`;
        if (!metric || !Number.isSafeInteger(item.id) || item.id <= 0 || seen.has(key)
          || !SIGNAL_INDICATOR_BOUNDARIES.every(boundary => typeof item[boundary] === 'number') || !validSignalIndicatorLimits(item)) {
          throw new Error('The alarm settings API returned invalid limits.');
        }
        seen.add(key);
        const limitsSi = scaleSignalIndicatorLimits(item, unitToSi(profile.quantity, profile.unit));
        if (!validSignalIndicatorLimits(limitsSi)) { throw new Error('The alarm settings cannot be represented in SI units.'); }
        return { quantity: profile.quantity, metric, limitsSi };
      });
    }), catchError(error => throwError(() => new Error(apiErrorMessage(error, 'alarm settings')))));
  }
}
