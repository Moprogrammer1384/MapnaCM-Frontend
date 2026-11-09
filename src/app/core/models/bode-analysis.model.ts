import type { AmplitudeMode, VibrationQuantity, VibrationUnit } from './analysis-chart-settings.model';

/** Tracking observations, not a waveform or a transfer-function gain. */
export interface BodeObservation {
  /** Local wall time, YYYY-MM-DDTHH:mm:ss, strictly increasing within a run. */
  readonly timestamp: string;
  readonly speedRpm: number;
  /** RMS amplitude of the record's declared quantity, in the record's declared unit. */
  readonly amplitudeRms: number;
  readonly phaseDegrees: number;
}

export interface BodeRecord {
  readonly id?: string;
  readonly startedAtUtc?: string;
  readonly originalSampleCount?: number;
  readonly eventType?: 'Startup' | 'CoastDown' | 'Trip' | 'LoadChange';
  readonly label: string;
  readonly channel: string;
  readonly run: string;
  readonly phaseConvention: 'as-exported';
  readonly order: number;
  readonly quantity: VibrationQuantity;
  readonly unit: VibrationUnit;
  readonly observations: readonly BodeObservation[];
}

export interface BodeAnalysis {
  readonly quantity: VibrationQuantity;
  readonly speed: readonly number[];
  readonly amplitude: readonly number[];
  readonly phase: readonly number[];
  readonly axisUnit: 'RPM' | 'Hz';
  readonly unit: VibrationUnit;
  readonly amplitudeMode: AmplitudeMode;
  readonly phaseMode: 'wrapped' | 'unwrapped';
  readonly peakIndex: number;
  readonly minimumSpeedRpm: number;
  readonly maximumSpeedRpm: number;
}
