import { AnalysisChartSettings, VIBRATION_UNITS } from '../../../models/analysis-chart-settings.model';
import { RawVibrationRecord } from '../../../models/vibration-data.model';
import { prepareTimeDomainRecord } from '../time-domain/time-domain-preparation';
import { resampleFftInput } from './fft-input-resampling';
import { windowFftInput } from './fft-input-window';
import { analyzeFrequencyDomain, prepareFrequencyDomainRecord } from './frequency-domain-analysis';
import { frequencyDomainFft } from './frequency-domain-fft';
import { convertFrequencyQuantity } from './frequency-domain-quantity-conversion';

describe('Frequency Domain numerical pipeline', () => {
  const settings: AnalysisChartSettings = { quantity: 'displacement', unit: 'µm', amplitude: '0p', xAxis: 'hz' };
  const raw = (count = 1000): RawVibrationRecord => ({ id: 'analytic', label: 'Analytical signal',
    quantity: 'displacement', unit: 'µm', timeUnit: 's',
    time: Array.from({ length: count }, (_, i) => i / count),
    values: Array.from({ length: count }, (_, i) => 3 + 4 * Math.cos(2 * Math.PI * 10 * i / count)) });

  it('matches an independent direct complex DFT for power-of-two, composite, prime and odd lengths', () => {
    for (const count of [1, 2, 7, 16, 25, 31, 100]) {
      const input = Float64Array.from({ length: count }, (_, i) => Math.sin(i * 0.7) + i / count);
      const { real, imaginary } = frequencyDomainFft(input);
      for (let k = 0; k < count; k++) {
        let re = 0, im = 0;
        for (let n = 0; n < count; n++) {
          re += input[n] * Math.cos(2 * Math.PI * k * n / count);
          im -= input[n] * Math.sin(2 * Math.PI * k * n / count);
        }
        expect(real[k]).toBeCloseTo(re, 9); expect(imaginary[k]).toBeCloseTo(im, 9);
      }
    }
  });

  it('normalizes DC, ordinary lines and Nyquist for RMS/0p/pp and conserves rectangular RMS energy', () => {
    const source = raw(128);
    const data = { ...source, values: source.values.map((v, i) => v + 2 * (-1) ** i) };
    const prepared = prepareFrequencyDomainRecord(data);
    const peak = analyzeFrequencyDomain(prepared, settings);
    expect(peak.values.length).toBe(65);
    expect(peak.values[0]).toBeCloseTo(3, 10);
    expect(peak.values[10]).toBeCloseTo(4, 10);
    expect(peak.values[64]).toBeCloseTo(2, 10);
    const rms = analyzeFrequencyDomain(prepared, { ...settings, amplitude: 'rms' });
    expect(rms.values[0]).toBeCloseTo(3, 10);
    expect(rms.values[10]).toBeCloseTo(4 / Math.SQRT2, 10);
    expect(rms.values[64]).toBeCloseTo(2, 10);
    expect(rms.values.reduce((sum, v) => sum + v * v, 0)).toBeCloseTo(data.values.reduce((sum, v) => sum + v * v, 0) / 128, 10);
    const pp = analyzeFrequencyDomain(prepared, { ...settings, amplitude: 'pp' });
    expect(pp.values[0]).toBe(0); expect(pp.values[10]).toBeCloseTo(8, 10);
    expect(pp.values[64]).toBeCloseTo(4, 10);
  });

  it('doubles the last positive-frequency line for odd N (it is not Nyquist)', () => {
    const source = raw(101);
    const result = analyzeFrequencyDomain(prepareFrequencyDomainRecord({ ...source,
      values: source.time.map(t => 7 * Math.cos(2 * Math.PI * 50 * t)) }), settings);
    expect(result.values.length).toBe(51);
    expect(result.values[50]).toBeCloseTo(7, 9);
    expect(result.frequency[50]).toBeCloseTo(50, 10);
  });

  it('uses Fourier mechanical relations for all nine quantity pairs, including complex phase and DC policy', () => {
    const orders = ['displacement', 'velocity', 'acceleration'] as const;
    const omega = 2 * Math.PI * 10;
    for (const [fromIndex, from] of orders.entries()) {
      for (const [toIndex, to] of orders.entries()) {
        const [re, im] = convertFrequencyQuantity(2, -3, 10, from, to);
        const phase = (toIndex - fromIndex) * Math.PI / 2;
        const factor = omega ** (toIndex - fromIndex);
        expect(re).toBeCloseTo((2 * Math.cos(phase) + 3 * Math.sin(phase)) * factor, 8);
        expect(im).toBeCloseTo((2 * Math.sin(phase) - 3 * Math.cos(phase)) * factor, 8);
        expect(convertFrequencyQuantity(2, 0, 0, from, to)).toEqual(from === to ? [2, 0] : [0, 0]);
      }
    }
  });

  it('converts every compatible unit from source SI and reuses the original FFT', () => {
    const source = raw(); const prepared = prepareFrequencyDomainRecord(source);
    for (const quantity of ['displacement', 'velocity', 'acceleration'] as const) {
      for (const unit of VIBRATION_UNITS[quantity]) {
        const result = analyzeFrequencyDomain(prepared, { ...settings, quantity, unit: unit.value });
        const peak = quantity === 'displacement' ? 4 : quantity === 'velocity' ? 4e-3 * 2 * Math.PI * 10 : 4e-6 * (2 * Math.PI * 10) ** 2;
        expect(result.values[10]).toBeCloseTo(peak * unit.scale, 9);
        if (quantity !== 'displacement') { expect(result.values[0]).toBe(0); }
      }
    }
    expect(prepared.spectra.size).toBe(1);
    expect(source.values).toEqual(raw().values);
  });

  it('normalizes a periodic Hann window by coherent gain without changing the source', () => {
    const source = raw(1000); const prepared = prepareFrequencyDomainRecord(source);
    const hann = analyzeFrequencyDomain(prepared, { ...settings, window: 'hann' });
    expect(hann.values[10]).toBeCloseTo(4, 9);
    expect(windowFftInput(new Float64Array(1000).fill(1), 'hann').coherentGain).toBeCloseTo(0.5, 12);
    analyzeFrequencyDomain(prepared, settings);
    expect(prepared.spectra.size).toBe(2);
    expect(source.values).toEqual(raw(1000).values);
  });

  it('interpolates nonuniform samples on actual timestamps, preserving N and endpoints', () => {
    const source = { ...raw(5), time: [0, 0.19, 0.41, 0.59, 0.8], values: [1, 1.38, 1.82, 2.18, 2.6] };
    const uniform = resampleFftInput(prepareTimeDomainRecord(source));
    expect(uniform.resampled).toBeTrue(); expect(uniform.sampleRate).toBe(5);
    Array.from(uniform.values).forEach((v, i) => expect(v).toBeCloseTo((1 + i * 0.4) * 1e-6, 14));
    expect(uniform.values.length).toBe(5);
    expect(source.time).toEqual([0, 0.19, 0.41, 0.59, 0.8]);
  });

  it('converts Hz/CPM/Order using supplied RPM and rejects invalid input without fabricating speed', () => {
    const prepared = prepareFrequencyDomainRecord(raw());
    expect(analyzeFrequencyDomain(prepared, { ...settings, xAxis: 'cpm' }).frequency[10]).toBeCloseTo(600, 10);
    expect(analyzeFrequencyDomain(prepared, { ...settings, xAxis: 'order', referenceRpm: 1200 }).frequency[10]).toBeCloseTo(0.5, 10);
    for (const referenceRpm of [undefined, 0, -1, NaN, Infinity]) {
      expect(() => analyzeFrequencyDomain(prepared, { ...settings, xAxis: 'order', referenceRpm })).toThrowError(/positive reference/);
    }
    expect(() => analyzeFrequencyDomain(prepared, { ...settings, xAxis: 'time' })).toThrowError(/Select Hz/);
    expect(() => prepareFrequencyDomainRecord({ ...raw(), values: [NaN] })).toThrow();
  });
});
