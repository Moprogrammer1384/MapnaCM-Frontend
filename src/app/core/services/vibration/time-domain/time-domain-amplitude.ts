import { AmplitudeMode } from '../../../models/vibration/analysis-chart-settings.model';
import { TimeDomainAmplitudeReference, TimeDomainStatistics } from '../../../models/vibration/vibration-data.model';
import { selectTimeDomainAmplitude } from './time-domain-statistics';

/** Full-record reference levels; instantaneous waveform samples retain their physical values. */
export function timeDomainAmplitudeReference(statistics: TimeDomainStatistics, mode: AmplitudeMode): TimeDomainAmplitudeReference {
  const amplitude = selectTimeDomainAmplitude(statistics, mode);
  return mode === 'pp' ? { lower: statistics.min, upper: statistics.max } : { lower: -amplitude, upper: amplitude };
}
