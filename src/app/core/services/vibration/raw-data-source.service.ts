import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { RawVibrationRecord, VibrationDataRequest } from '../../models/vibration-data.model';

export interface RawVibrationDataSource {
  load(request: VibrationDataRequest): Observable<RawVibrationRecord>;
}

/** Replace this provider with an API adapter when its actual response contract is available. */
export const RAW_VIBRATION_DATA_SOURCE = new InjectionToken<RawVibrationDataSource>('RAW_VIBRATION_DATA_SOURCE', {
  providedIn: 'root', factory: () => inject(SampleVibrationDataSource),
});

interface WorkbookSamples {
  readonly id: string;
  readonly label: string;
  readonly time: readonly number[];
  readonly values: readonly number[];
}

const WORKBOOK_REPEAT_COUNT = 10;

/** Deliberately returns the same workbook fixture for any measurement/date request. No fake endpoint. */
@Injectable({ providedIn: 'root' })
export class SampleVibrationDataSource implements RawVibrationDataSource {
  private readonly record = inject(HttpClient).get<WorkbookSamples>('assets/data/vibration/book1-x.json').pipe(
    map(samples => {
      // Expand the fixture once, before shareReplay, keeping the workbook asset intact.
      // Continue time at each seam instead of restarting it or duplicating an endpoint.
      const count = samples.time.length;
      const cycleDuration = samples.time[count - 1] - samples.time[0] + samples.time[1] - samples.time[0];
      const time = new Array<number>(count * WORKBOOK_REPEAT_COUNT);
      const values = new Array<number>(time.length);
      for (let copy = 0; copy < WORKBOOK_REPEAT_COUNT; copy++) {
        const offset = copy * cycleDuration;
        const start = copy * count;
        for (let i = 0; i < count; i++) {
          time[start + i] = samples.time[i] + offset;
          values[start + i] = samples.values[i];
        }
      }
      return Object.freeze({ ...samples, id: `${samples.id}-repeat-${WORKBOOK_REPEAT_COUNT}`,
        time: Object.freeze(time), values: Object.freeze(values),
        quantity: 'displacement', unit: 'µm', timeUnit: 'ms',
        sourceNote: 'Sample metadata: Displacement (µm) is assumed; Time (ms) is confirmed. '
          + 'Workbook repeated 10 times with continuous timestamps. Selected dates do not filter this workbook sample.',
      }) as RawVibrationRecord;
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  load(_request: VibrationDataRequest): Observable<RawVibrationRecord> { return this.record; }
}
