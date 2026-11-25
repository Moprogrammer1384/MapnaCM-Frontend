export interface SensorType {
  id?: number;
  name: string;
}

export interface Sensor {
  id?: number;
  name: string;
  sensorTypeId: number | null;
  typeName?: string;
}
