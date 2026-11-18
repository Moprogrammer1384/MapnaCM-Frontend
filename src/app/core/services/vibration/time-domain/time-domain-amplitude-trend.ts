import { TimeDomainAmplitudeWindow } from '../../../models/vibration-data.model';
import { calculateTimeDomainStatistics } from './time-domain-statistics';

const WINDOW_SECONDS = 0.1;

/** Evaluate full windows of the uniformly sampled offline waveform in its display unit. */
export function calculateTimeDomainAmplitudeTrend(time: Float64Array, values: Float64Array): TimeDomainAmplitudeWindow[] {
  const sampleRate = (time.length - 1) / (time[time.length - 1] - time[0]);
  const windowSamples = Math.min(values.length, Math.max(3, Math.round(WINDOW_SECONDS * sampleRate)));
  const hop = Math.floor(windowSamples / 2);
  const lastStart = values.length - windowSamples;
  const windows: TimeDomainAmplitudeWindow[] = [];
  // Anchor the last full window at the end so it includes the final sample at the same resolution.
  for (let start = 0; ; start = Math.min(start + hop, lastStart)) {
    const end = start + windowSamples;
    windows.push({ from: time[start], to: time[end - 1],
      statistics: calculateTimeDomainStatistics(values.subarray(start, end)) });
    if (start === lastStart) { return windows; }
  }
}
