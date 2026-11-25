import { AmplitudeMode, VibrationQuantity, VibrationSourceProfile } from './analysis-chart-settings.model';

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

export interface SignalIndicatorValues {
  readonly rms: number;
  readonly zeroToPeak: number;
  readonly peakToPeak: number;
}

export interface SignalIndicatorPoint extends SignalIndicatorValues {
  readonly sampledAtUtc: string;
  readonly breakBefore: boolean;
}

interface SignalIndicatorSeries {
  readonly measurementId: number;
  readonly firstAtUtc: string;
  readonly lastAtUtc: string;
  readonly totalCount: number;
  readonly stepSeconds: number;
  readonly maxima: SignalIndicatorValues;
  readonly points: readonly SignalIndicatorPoint[];
}

export interface SignalIndicatorSeriesDto extends SignalIndicatorSeries {
  readonly quantity: number;
  readonly unit: number;
}

export type SignalIndicatorRecord = SignalIndicatorSeries & VibrationSourceProfile;
