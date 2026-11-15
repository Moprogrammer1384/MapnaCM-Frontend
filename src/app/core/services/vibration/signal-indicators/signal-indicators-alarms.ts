import { AmplitudeMode, VIBRATION_UNITS } from '../../../models/analysis-chart-settings.model';
import { SignalIndicatorAlarmLimits, SignalIndicatorAlarmRange, SignalIndicatorAnalysis } from '../../../models/signal-indicators.model';
import { TimeDomainStatistics } from '../../../models/vibration-data.model';
import { unitToSi } from '../time-domain/time-domain-unit-conversion';

export const SIGNAL_INDICATOR_KEYS = { rms: 'rms', '0p': 'peak', pp: 'peakToPeak' } as const;
export function signalIndicatorValue(statistics: TimeDomainStatistics, metric: AmplitudeMode): number {
  return statistics[SIGNAL_INDICATOR_KEYS[metric]];
}

/** Initial editable display limits follow the loaded metric; they are not machine-supplied alarm settings. */
export function initialSignalIndicatorLimits(analysis: SignalIndicatorAnalysis, metric: AmplitudeMode): SignalIndicatorAlarmLimits {
  const values = analysis.points.map(point => signalIndicatorValue(point.statistics, metric));
  const min = Math.min(...values), max = Math.max(...values);
  const scale = unitToSi(analysis.signal.quantity, analysis.signal.unit);
  return { lowerSi: Math.max(0, min * 0.9) * scale,
    upperSi: max > 0 ? max * 1.1 * scale : unitToSi(analysis.signal.quantity, VIBRATION_UNITS[analysis.signal.quantity][0].value) };
}

export function signalIndicatorLimitError(lower: number | null, upper: number | null): string {
  if (lower === null || upper === null || !Number.isFinite(lower) || !Number.isFinite(upper)) { return 'Enter both lower and upper alarm limits.'; }
  if (lower < 0 || upper < 0) { return 'Alarm limits must be zero or greater.'; }
  return lower < upper ? '' : 'Upper alarm must be greater than lower alarm.';
}

/** Distance outside either boundary as a fraction of the configured normal-band width. */
export function signalIndicatorAlarmExceedance(value: number, range: SignalIndicatorAlarmRange): number {
  return Math.max(0, range.lower - value, value - range.upper) / (range.upper - range.lower);
}
