import { AmplitudeMode } from '../../../models/analysis-chart-settings.model';

/** Single-sided sinusoidal line amplitudes, NOT full-record waveform extrema.
 * DC/Nyquist are unpaired; DC is constant (RMS=peak, pp=0). */
export function frequencyLineAmplitude(magnitude: number, index: number, count: number,
  coherentGain: number, mode: AmplitudeMode): number {
  if (!['rms', '0p', 'pp'].includes(mode)) { throw new Error('Unsupported spectrum amplitude.'); }
  const unpaired = index === 0 || (count % 2 === 0 && index === count / 2);
  const peak = magnitude * (unpaired ? 1 : 2) / (count * coherentGain);
  return mode === 'rms' ? peak / (unpaired ? 1 : Math.SQRT2)
    : mode === 'pp' ? (index === 0 ? 0 : peak * 2) : peak;
}
