/** Synthetic one-sided peak-amplitude spectrum of the existing 10 Hz + 25 Hz sample.
 * A two-second signal sampled at 250 Hz has 0.5 Hz bins through 125 Hz.
 * These ideal amplitudes are sample data, not FFT results from selected Measurements.
 */
export function createFrequencyDomainSampleData(): [number, number][] {
  return Array.from({ length: 251 }, (_, index) => [
    index / 2,
    index === 20 ? 2 : index === 50 ? 1 : 0,
  ]);
}
