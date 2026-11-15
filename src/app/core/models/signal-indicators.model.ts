import { TimeDomainAnalysis, TimeDomainStatistics } from './vibration-data.model';
import { AmplitudeMode, VibrationQuantity } from './analysis-chart-settings.model';

export type SignalIndicatorMode = 'all' | AmplitudeMode;
export interface SignalIndicatorAlarmRange {
  readonly upperNormal: number;
  readonly upperCaution: number;
  readonly upperDanger: number;
}
export const SIGNAL_INDICATOR_BOUNDARIES = ['upperNormal', 'upperCaution', 'upperDanger'] as const;
export interface SignalIndicatorAlarmSetting {
  readonly quantity: VibrationQuantity;
  readonly metric: AmplitudeMode;
  readonly limitsSi: SignalIndicatorAlarmRange;
}
export interface SignalIndicatorViewSettings {
  readonly mode: SignalIndicatorMode;
  readonly showAlarms?: boolean;
}

export interface SignalIndicatorPoint {
  readonly from: number;
  readonly to: number;
  readonly sampleCount: number;
  readonly statistics: TimeDomainStatistics;
  readonly breakBefore?: boolean;
}

export interface SignalIndicatorAnalysis {
  readonly basis: 'raw' | 'summary';
  readonly sourceId: string;
  readonly signal: TimeDomainAnalysis;
  readonly windowSeconds: number;
  readonly points: readonly SignalIndicatorPoint[];
}
