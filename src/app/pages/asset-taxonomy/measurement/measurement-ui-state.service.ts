import { Injectable } from '@angular/core';
import { MeasurementPayload, TaxonomyMeasurement } from 'src/app/core/models/asset.model';

export interface MeasurementType {
  id: number;
  name: string;
  unit: string;
}

export interface MeasurementConfiguration {
  measurementTypeId: number;
  sensitivity: number;
}

interface PendingConfiguration {
  payload: MeasurementPayload;
  existingIds: Set<number>;
  configuration: MeasurementConfiguration;
}

/** Frontend-only state until Measurement types/configuration have a backend integration.
 * No browser persistence or new API fields: existing Measurement CRUD stays intact.
 */
@Injectable({ providedIn: 'root' })
export class MeasurementUiStateService {
  private types: MeasurementType[] = [];
  private nextTypeId = 1;
  private configurations = new Map<number, MeasurementConfiguration>();
  private pending: PendingConfiguration[] = [];

  getTypes(): MeasurementType[] {
    return this.types.map((type) => ({ ...type }));
  }

  saveType(value: { id?: number; name: string; unit: string }): void {
    const type = { id: value.id ?? this.nextTypeId++, name: value.name, unit: value.unit };
    this.types = value.id === undefined
      ? [...this.types, type]
      : this.types.map((current) => current.id === value.id ? type : current);
  }

  isTypeInUse(id: number): boolean {
    return [...this.configurations.values(), ...this.pending.map((item) => item.configuration)]
      .some((configuration) => configuration.measurementTypeId === id);
  }

  deleteType(id: number): boolean {
    if (this.isTypeInUse(id)) {
      return false;
    }
    this.types = this.types.filter((type) => type.id !== id);
    return true;
  }

  getConfiguration(id: number): MeasurementConfiguration | undefined {
    const configuration = this.configurations.get(id);
    return configuration ? { ...configuration } : undefined;
  }

  setConfiguration(id: number, configuration: MeasurementConfiguration): void {
    this.configurations.set(id, { ...configuration });
  }

  deleteConfiguration(id: number): void {
    this.configurations.delete(id);
  }

  queueCreatedConfiguration(payload: MeasurementPayload, existingIds: number[], configuration: MeasurementConfiguration): void {
    this.pending.push({ payload: { ...payload }, existingIds: new Set(existingIds), configuration: { ...configuration } });
  }

  reconcile(measurements: TaxonomyMeasurement[]): void {
    // The existing Add API returns void. Associate only a unique newly returned
    // record matching the submitted fields; never guess from a duplicate name.
    const candidates = this.pending.map((pending) =>
      measurements.filter((measurement) =>
        !pending.existingIds.has(measurement.id) &&
        !this.configurations.has(measurement.id) &&
        measurement.name === pending.payload.name &&
        measurement.componentId === pending.payload.componentId &&
        (measurement.tag ?? '') === (pending.payload.tag ?? '')
      )
    );
    this.pending = this.pending.filter((pending, index) => {
      const matches = candidates[index];
      if (matches.length !== 1 || candidates.filter((rows) => rows.some((row) => row.id === matches[0].id)).length !== 1) {
        return true;
      }
      this.setConfiguration(matches[0].id, pending.configuration);
      return false;
    });
  }
}
