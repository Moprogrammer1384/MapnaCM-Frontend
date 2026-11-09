import type { SelectedMeasurementDetails } from './asset-taxonomy-selection.model';

export interface OrbitProbePair {
  readonly key: string;
  readonly x: SelectedMeasurementDetails;
  readonly y: SelectedMeasurementDetails;
}
export type OrbitUnit = 'µm' | 'mm' | 'mil' | 'in';
export type OrbitPeriod = 'Daily';
export interface OrbitCaptureSelection {
  readonly period: OrbitPeriod;
  readonly periodStart: string;
  /** Exact stored event within the calendar period; omitted only by older single-event callers. */
  readonly capturedAtUtc?: string;
}
export interface OrbitCaptureChoice extends OrbitCaptureSelection {
  readonly capturedAtUtc: string;
  readonly finishedAtUtc: string;
  readonly sampleCount: number;
  readonly sampleRateHz: number;
}
export interface OrbitSettings {
  readonly filter: 'direct' | 'order';
  readonly order: number;
  readonly unit: OrbitUnit;
  readonly showKeyphasor: boolean;
  readonly center: boolean;
  readonly overlayDirect: boolean;
}
export const DEFAULT_ORBIT_SETTINGS: OrbitSettings = {
  filter: 'direct', order: 1, unit: 'µm', showKeyphasor: true, center: true, overlayDirect: false,
};
export type OrbitChannelQuality = 'valid' | 'invalid' | 'missing';
export interface OrbitDisplacementChannel {
  readonly id: string;
  readonly clockId: string;
  readonly quantity: 'displacement';
  /** Calibrated engineering values supplied by the acquisition system. */
  readonly unit: 'µm';
  readonly quality: OrbitChannelQuality;
}
export interface OrbitKeyphasorChannel {
  readonly id: string;
  readonly clockId: string;
  readonly unit: 'V';
  readonly quality: OrbitChannelQuality;
  readonly detectedEdge: 'rising' | 'falling';
  readonly thresholdVolts: number;
  readonly hysteresisVolts: number;
  readonly pulsesPerRevolution: number;
  /** Original voltage samples on the same time grid as X/Y. */
  readonly values: readonly (number | null)[];
  /** Edge timestamps already supplied by the DAQ/counter, not detected by the UI. */
  readonly pulseTimes: readonly number[];
}
export interface OrbitRecord {
  readonly period: OrbitPeriod;
  readonly periodStart: string;
  readonly id: string;
  readonly label: string;
  readonly capturedAtUtc: string;
  readonly finishedAtUtc: string;
  readonly timeUnit: 's';
  readonly sampleRateHz: number;
  readonly sampleCount: number;
  readonly clockId: string;
  readonly synchronized: boolean;
  readonly channels: { readonly x: OrbitDisplacementChannel; readonly y: OrbitDisplacementChannel };
  /** Speed channel supplied by the DAQ; null means unavailable, without an inferred fallback. */
  readonly shaftSpeedRpm: number | null;
  readonly unit: 'µm';
  /** Synchronized sample times in seconds, relative to the capture start. */
  readonly time: readonly number[];
  readonly x: readonly number[];
  readonly y: readonly number[];
  readonly keyphasor?: OrbitKeyphasorChannel;
}
export interface OrbitPoint { readonly time: number; readonly x: number; readonly y: number; }
export interface OrbitAnalysis {
  readonly filter: 'direct' | 'order';
  readonly points: readonly OrbitPoint[];
  readonly direct: readonly OrbitPoint[];
  readonly keyphasor: readonly OrbitPoint[];
  readonly xPeakToPeak: number;
  readonly yPeakToPeak: number;
  readonly maximumRadius: number;
  readonly speedRpm: number | null;
  readonly notices: readonly string[];
}
