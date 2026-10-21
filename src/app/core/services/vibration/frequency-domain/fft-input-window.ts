/** Periodic Hann (spectral analysis) or rectangular. Returns exact coherent gain.
 * Fresh array: neither the source nor the uniformly sampled cache is changed. */
export function windowFftInput(source: Float64Array, window: 'rectangular' | 'hann'):
  { values: Float64Array; coherentGain: number } {
  if (window !== 'hann' && window !== 'rectangular') { throw new Error('Unsupported FFT window.'); }
  const values = new Float64Array(source.length);
  let sum = 0;
  for (let index = 0; index < source.length; index++) {
    const weight = window === 'hann' ? 0.5 - 0.5 * Math.cos(2 * Math.PI * index / source.length) : 1;
    values[index] = source[index] * weight;
    sum += weight;
  }
  return { values, coherentGain: sum / source.length };
}
