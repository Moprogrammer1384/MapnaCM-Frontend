import { FrequencyDomainAnalysis } from 'src/app/core/models/frequency-domain.model';

export interface SpectrumPeak { readonly frequency: number; readonly amplitude: number; }

/** Largest local maxima over the full loaded spectrum, in its selected units.
 * A flat peak contributes one point; adjacent lower bins are not extra peaks.
 */
export function largestSpectrumPeaks(result: Pick<FrequencyDomainAnalysis, 'frequency' | 'values'>, limit = 5): readonly SpectrumPeak[] {
  const peaks: SpectrumPeak[] = [];
  if (limit <= 0) { return peaks; }
  for (let index = 0; index < result.values.length; index++) {
    const start = index, value = result.values[index];
    while (index + 1 < result.values.length && result.values[index + 1] === value) { index++; }
    if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(result.frequency[start]) ||
      (start > 0 && value <= result.values[start - 1]) ||
      (index + 1 < result.values.length && value <= result.values[index + 1])) { continue; }
    const peak = { frequency: result.frequency[start], amplitude: value };
    let rank = peaks.findIndex(item => value > item.amplitude || (value === item.amplitude && peak.frequency < item.frequency));
    if (rank < 0) { rank = peaks.length; }
    if (rank < limit) { peaks.splice(rank, 0, peak); if (peaks.length > limit) { peaks.pop(); } }
  }
  return peaks;
}
