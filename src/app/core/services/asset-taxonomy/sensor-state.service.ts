import { Injectable } from '@angular/core';
import { Sensor, SensorType } from 'src/app/core/models/asset-taxonomy/sensor.model';

/** Temporary in-memory state until the Sensor backend is available. */
@Injectable({ providedIn: 'root' })
export class SensorStateService {
  private sensors: Sensor[] = [];
  private types: SensorType[] = [];
  private nextSensorId = 1;
  private nextTypeId = 1;

  getTypes(): SensorType[] {
    return this.types.map((type) => ({ ...type }));
  }

  getSensors(): Sensor[] {
    return this.sensors.map((sensor) => ({
      ...sensor,
      typeName: this.types.find((type) => type.id === sensor.sensorTypeId)?.name ?? '',
    }));
  }

  saveType(type: SensorType): void {
    const name = type.name.trim();
    if (!name) { throw new Error('Enter a sensor type name.'); }
    if (type.id === undefined) {
      this.types = [...this.types, { id: this.nextTypeId++, name }];
    } else {
      if (!this.types.some((item) => item.id === type.id)) { throw new Error('Sensor type no longer exists.'); }
      this.types = this.types.map((item) => item.id === type.id ? { id: item.id, name } : item);
    }
  }

  saveSensor(sensor: Sensor): void {
    const name = sensor.name.trim();
    if (!name || !this.types.some((type) => type.id === sensor.sensorTypeId)) {
      throw new Error('Enter a name and select an available sensor type.');
    }
    const value = { name, sensorTypeId: sensor.sensorTypeId };
    if (sensor.id === undefined) {
      this.sensors = [...this.sensors, { id: this.nextSensorId++, ...value }];
    } else {
      if (!this.sensors.some((item) => item.id === sensor.id)) { throw new Error('Sensor no longer exists.'); }
      this.sensors = this.sensors.map((item) => item.id === sensor.id ? { id: item.id, ...value } : item);
    }
  }

  deleteSensor(id: number): void {
    this.sensors = this.sensors.filter((sensor) => sensor.id !== id);
  }

  deleteType(id: number): boolean {
    if (this.sensors.some((sensor) => sensor.sensorTypeId === id)) { return false; }
    this.types = this.types.filter((type) => type.id !== id);
    return true;
  }
}
