import { AmplitudeMode } from '../../../models/analysis-chart-settings.model';
import { TimeDomainStatistics } from '../../../models/vibration-data.model';

/** Time-domain statistics use every sample. RMS includes DC; peak is max(abs(y)); pp is max(y)-min(y).
 * No sine-wave sqrt(2) approximation, and no rescaling of instantaneous samples.
 */
export function calculateTimeDomainStatistics(values: ArrayLike<number>): TimeDomainStatistics {
  let min = Infinity;
  let max = -Infinity;
  let mean = 0;
  let squareScale = 0;
  let scaledSquares = 0;
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (!Number.isFinite(value)) { throw new Error('Analysis produced a non-finite sample.'); }
    min = Math.min(min, value);
    max = Math.max(max, value);
    mean += (value - mean) / (index + 1);
    const magnitude = Math.abs(value);
    // Scaled sum of squares avoids unnecessary overflow/underflow in y*y.
    if (magnitude > 0) {
      if (magnitude > squareScale) {
        scaledSquares = 1 + scaledSquares * (squareScale / magnitude) ** 2;
        squareScale = magnitude;
      } else { scaledSquares += (magnitude / squareScale) ** 2; }
    }
  }
  if (!values.length) { throw new Error('No vibration samples.'); }
  return { min, max, mean, rms: squareScale * Math.sqrt(scaledSquares / values.length),
    peak: Math.max(Math.abs(min), Math.abs(max)), peakToPeak: max - min };
}

export function selectTimeDomainAmplitude(statistics: TimeDomainStatistics, mode: AmplitudeMode): number {
  switch (mode) {
    case 'rms': return statistics.rms;
    case '0p': return statistics.peak;
    case 'pp': return statistics.peakToPeak;
    default: throw new Error('Unsupported amplitude mode.');
  }
}
