import { AmplitudeMode } from '../../../models/analysis-chart-settings.model';
import { SIGNAL_INDICATOR_BOUNDARIES, SignalIndicatorAlarmRange } from '../../../models/signal-indicators.model';
import { TimeDomainStatistics } from '../../../models/vibration-data.model';

export const SIGNAL_INDICATOR_KEYS = { rms: 'rms', '0p': 'peak', pp: 'peakToPeak' } as const;
export function signalIndicatorValue(statistics: TimeDomainStatistics, metric: AmplitudeMode): number {
  return statistics[SIGNAL_INDICATOR_KEYS[metric]];
}
export function validSignalIndicatorLimits(limits: SignalIndicatorAlarmRange): boolean {
  const values = SIGNAL_INDICATOR_BOUNDARIES.map(key => limits[key]);
  return values.every((value, index) => Number.isFinite(value) && value > 0 && (!index || value > values[index - 1]));
}
export function scaleSignalIndicatorLimits(limits: SignalIndicatorAlarmRange, scale: number): SignalIndicatorAlarmRange {
  return { upperNormal: limits.upperNormal * scale, upperCaution: limits.upperCaution * scale, upperDanger: limits.upperDanger * scale };
}
/** Low vibration is normal; only exceeding an upper boundary increases magnitude severity. */
export function signalIndicatorAlarmLevel(value: number, range: SignalIndicatorAlarmRange): 'normal' | 'yellow' | 'orange' | 'red' {
  if (value > range.upperDanger) { return 'red'; }
  if (value > range.upperCaution) { return 'orange'; }
  if (value > range.upperNormal) { return 'yellow'; }
  return 'normal';
}
