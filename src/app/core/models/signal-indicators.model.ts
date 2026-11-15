import { TimeDomainAnalysis, TimeDomainStatistics } from './vibration-data.model';
import { AmplitudeMode, VibrationQuantity } from './analysis-chart-settings.model';

export type SignalIndicatorMode = 'all' | AmplitudeMode;
export interface SignalIndicatorAlarmLimits { readonly lowerSi: number | null; readonly upperSi: number | null; }
export interface SignalIndicatorAlarmRange { readonly lower: number; readonly upper: number; }
export interface SignalIndicatorViewSettings {
  readonly mode: SignalIndicatorMode;
  /** Measurement/quantity/metric key; physical SI values survive compatible display-unit changes. */
  readonly limits: Readonly<Record<string, SignalIndicatorAlarmLimits>>;
}
export interface SignalIndicatorAlarmChange extends SignalIndicatorAlarmLimits {
  readonly quantity: VibrationQuantity;
  readonly metric: AmplitudeMode;
}
export function signalIndicatorAlarmKey(measurementId: number, quantity: VibrationQuantity, metric: AmplitudeMode): string {
  return `${measurementId}:${quantity}:${metric}`;
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
