import { inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { OrbitCaptureSelection, OrbitProbePair, OrbitRecord } from 'src/app/core/models/orbit-analysis.model';
import { VibrationOrbitAnalysisApiService } from '../api/vibration-orbit-analysis-api.service';

export interface OrbitDataRequest { readonly pair: OrbitProbePair; readonly selection: OrbitCaptureSelection; }
export interface OrbitDataSource { load(request: OrbitDataRequest): Observable<OrbitRecord | null>; }

export const ORBIT_DATA_SOURCE = new InjectionToken<OrbitDataSource>('ORBIT_DATA_SOURCE', {
  providedIn: 'root', factory: () => inject(VibrationOrbitAnalysisApiService),
});
