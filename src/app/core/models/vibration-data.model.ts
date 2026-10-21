import { AmplitudeMode, AnalysisChartSettings, VibrationQuantity, VibrationUnit } from './analysis-chart-settings.model';

export type VibrationTimeUnit = 's' | 'ms';

/** Frontend domain model, not a proposed backend response contract. Never mutate a loaded record. */
export interface RawVibrationRecord {
  readonly id: string;
  readonly label: string;
  readonly quantity: VibrationQuantity;
  readonly unit: VibrationUnit;
  readonly timeUnit: VibrationTimeUnit;
  readonly time: readonly number[];
  readonly values: readonly number[];
  readonly sourceNote?: string;
}

export interface VibrationDataRequest {
  readonly measurementId: number;
  readonly from: string;
  readonly to: string;
}

export interface TimeDomainStatistics {
  readonly rms: number;
  readonly peak: number;
  readonly peakToPeak: number;
  readonly mean: number;
  readonly min: number;
  readonly max: number;
}

export interface TimeDomainAnalysis {
  readonly time: Float64Array;
  readonly values: Float64Array;
  readonly statistics: TimeDomainStatistics;
  readonly amplitude: number;
  readonly amplitudeMode: AmplitudeMode;
  readonly amplitudeReference: TimeDomainAmplitudeReference;
  readonly unit: VibrationUnit;
  readonly quantity: VibrationQuantity;
  readonly sampleCount: number;
  readonly notices: readonly string[];
}

/** Selected amplitude's reference levels, expressed in the result's display unit. */
export interface TimeDomainAmplitudeReference {
  readonly lower: number;
  readonly upper: number;
}

export interface PreparedTimeDomainRecord {
  readonly time: Float64Array;
  readonly sourceQuantity: VibrationQuantity;
  /** Quantity signals in SI, at most three arrays per record. */
  readonly quantities: Map<VibrationQuantity, Float64Array>;
  readonly notices: readonly string[];
}

export type TimeDomainWorkerRequest =
  | { readonly id: number; readonly type: 'load'; readonly record: RawVibrationRecord }
  | { readonly id: number; readonly type: 'analyze'; readonly settings: AnalysisChartSettings };

export type TimeDomainWorkerResponse =
  | { readonly id: number; readonly result: TimeDomainAnalysis }
  | { readonly id: number; readonly error: string }
  | { readonly id: number; readonly loaded: true };
