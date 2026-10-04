import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { MeasurementPayload, TaxonomyMeasurement } from '../../../core/models/asset.model';

/** Browser persistence until a Measurement API is available. */
@Injectable({ providedIn: 'root' })
export class MeasurementStorageService {
  private readonly storageKey = 'asset-taxonomy-measurements';

  getAllMeasurements(): Observable<TaxonomyMeasurement[]> {
    return defer(() => Promise.resolve(this.read()));
  }

  createMeasurement(payload: MeasurementPayload): Observable<void> {
    return this.change((measurements) => {
      const id = Math.max(0, ...measurements.map((measurement) => measurement.id)) + 1;
      return [...measurements, { id, ...payload }];
    });
  }

  updateMeasurement(payload: MeasurementPayload & { id: number }): Observable<void> {
    return this.change((measurements) => {
      this.requireMeasurement(measurements, payload.id);
      return measurements.map((measurement) => measurement.id === payload.id ? { ...payload } : measurement);
    });
  }

  deleteMeasurement(id: number): Observable<void> {
    return this.change((measurements) => {
      this.requireMeasurement(measurements, id);
      return measurements.filter((measurement) => measurement.id !== id);
    });
  }

  private change(update: (measurements: TaxonomyMeasurement[]) => TaxonomyMeasurement[]): Observable<void> {
    return defer(() => {
      const measurements = update(this.read());
      localStorage.setItem(this.storageKey, JSON.stringify(measurements));
      return Promise.resolve();
    });
  }

  private requireMeasurement(measurements: TaxonomyMeasurement[], id: number): void {
    if (!measurements.some((measurement) => measurement.id === id)) {
      throw new Error('The measurement is no longer available. Please refresh the page.');
    }
  }

  private read(): TaxonomyMeasurement[] {
    const stored = localStorage.getItem(this.storageKey);
    if (stored === null) {
      return [];
    }
    const measurements: unknown = JSON.parse(stored);
    if (!Array.isArray(measurements) || !measurements.every((measurement) =>
      measurement !== null && typeof measurement === 'object' &&
      Number.isSafeInteger(measurement.id) && measurement.id > 0 &&
      typeof measurement.name === 'string' &&
      Number.isSafeInteger(measurement.componentId) && measurement.componentId > 0
    )) {
      throw new Error('Unable to read the measurements saved in this browser.');
    }
    return measurements;
  }
}
