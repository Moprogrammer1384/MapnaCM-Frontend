import { SelectedMeasurementDetails } from './asset-taxonomy-selection.model';
import { AnalysisEventTime } from './analysis-event-time.model';

export type RotorPositionEventType = 'Startup' | 'CoastDown' | 'Trip';
export type RotorPositionUnit = 'µm' | 'mm' | 'mil' | 'in';
export interface RotorPositionPair {
  readonly key: string;
  readonly x: SelectedMeasurementDetails;
  readonly y: SelectedMeasurementDetails;
}
export interface RotorPositionEvent extends AnalysisEventTime {
  readonly eventType: RotorPositionEventType;
}
/** Recorded displacement observations from the backend. Means retain calibrated DC. */
export interface RotorPositionObservation {
  readonly timeSeconds: number;
  readonly meanProbeX: number | null;
  readonly meanProbeY: number | null;
  readonly speedRpm: number | null;
  readonly quality: 'valid' | 'invalid';
  readonly breakBefore?: boolean;
}
export interface RotorPositionRecord {
  readonly id: string;
  readonly event: RotorPositionEvent;
  readonly pairKey: string;
  readonly quantity: 'displacement';
  readonly unit: RotorPositionUnit;
  readonly dcPreserved: boolean;
  readonly synchronized: boolean;
  readonly meanWindowSeconds: number;
  readonly probeAnglesDegrees: readonly [number, number];
  /** Signed projection readings at a known position, in the record's native unit. */
  readonly reference: {
    readonly probeMean: readonly [number, number];
    readonly position: readonly [number, number];
    readonly bearingCentreKnown: boolean;
  };
  readonly clearance?: { readonly radialX: number; readonly radialY: number };
  readonly observations: readonly RotorPositionObservation[];
}
export interface RotorPositionSettings {
  readonly unit: RotorPositionUnit;
  readonly reference: 'bearing' | 'first';
  readonly trendAxis: 'time' | 'rpm';
  readonly showClearance: boolean;
}
export const DEFAULT_ROTOR_POSITION_SETTINGS: RotorPositionSettings = {
  unit: 'µm', reference: 'bearing', trendAxis: 'time', showClearance: true,
};
export interface RotorPositionPoint {
  readonly time: number;
  readonly x: number;
  readonly y: number;
  readonly speedRpm: number | null;
  readonly breakBefore: boolean;
}
export interface RotorPositionAnalysis {
  readonly points: readonly RotorPositionPoint[];
  readonly unit: RotorPositionUnit;
  readonly clearance?: { readonly radialX: number; readonly radialY: number };
  readonly bearingCentreKnown: boolean;
  readonly omittedCount: number;
}
