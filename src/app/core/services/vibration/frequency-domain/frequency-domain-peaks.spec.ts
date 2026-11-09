import { largestSpectrumPeaks } from './frequency-domain-peaks';

describe('Frequency footer maxima', () => {
  it('ranks five independent maxima, not adjacent lower bins of the strongest peak', () => {
    const values = Float64Array.from([0, 10, 9, 8, 0, 6, 0, 5, 0, 4, 0, 3, 0, 2, 0]);
    const frequency = Float64Array.from(values, (_value, index) => index * 0.5);
    expect(largestSpectrumPeaks({ frequency, values })).toEqual([
      { frequency: 0.5, amplitude: 10 }, { frequency: 2.5, amplitude: 6 },
      { frequency: 3.5, amplitude: 5 }, { frequency: 4.5, amplitude: 4 }, { frequency: 5.5, amplitude: 3 },
    ]);
    expect(values[2]).toBe(9);
  });
  it('keeps one plateau maximum, resolves ties by frequency, and supports endpoint peaks', () => {
    const values = Float64Array.from([3, 0, 5, 5, 5, 0, 5, 0, 4]);
    expect(largestSpectrumPeaks({ values, frequency: Float64Array.from(values, (_v, index) => index) })).toEqual([
      { frequency: 2, amplitude: 5 }, { frequency: 6, amplitude: 5 }, { frequency: 8, amplitude: 4 }, { frequency: 0, amplitude: 3 },
    ]);
  });
  it('does not fabricate maxima for a zero spectrum or empty input', () => {
    expect(largestSpectrumPeaks({ values: new Float64Array(5), frequency: new Float64Array(5) })).toEqual([]);
    expect(largestSpectrumPeaks({ values: new Float64Array(), frequency: new Float64Array() })).toEqual([]);
  });
});
