import { AmplitudeMode, AnalysisChartSettings, VibrationQuantity, VibrationUnit } from './analysis-chart-settings.model';
import { RawVibrationRecord } from './vibration-data.model';

export interface FrequencyDomainAnalysis {
  readonly frequency: Float64Array;
  readonly values: Float64Array;
  readonly quantity: VibrationQuantity;
  readonly unit: VibrationUnit;
  readonly amplitudeMode: AmplitudeMode;
  readonly axisUnit: 'Hz' | 'CPM' | 'Order';
  readonly sampleCount: number;
  readonly sampleRate: number;
  readonly resolutionHz: number;
  readonly nyquistHz: number;
  readonly min: number;
  readonly max: number;
  readonly peakFrequency: number;
  readonly notices: readonly string[];
}

export type FrequencyDomainWorkerRequest =
  | { readonly id: number; readonly type: 'load'; readonly record: RawVibrationRecord }
  | { readonly id: number; readonly type: 'analyze'; readonly settings: AnalysisChartSettings };
export type FrequencyDomainWorkerResponse =
  | { readonly id: number; readonly result: FrequencyDomainAnalysis }
  | { readonly id: number; readonly error: string }
  | { readonly id: number; readonly loaded: true };
