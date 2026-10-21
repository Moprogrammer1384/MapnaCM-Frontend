import { AnalysisChartSettings, VibrationQuantity, VIBRATION_UNITS } from '../../../models/analysis-chart-settings.model';
import { RawVibrationRecord } from '../../../models/vibration-data.model';
import { convertTimeDomainQuantity } from './time-domain-quantity-conversion';
import { prepareTimeDomainRecord } from './time-domain-preparation';
import { calculateTimeDomainStatistics, selectTimeDomainAmplitude } from './time-domain-statistics';
import { analyzeTimeDomain } from './time-domain-analysis';

const quantities: VibrationQuantity[] = ['displacement', 'velocity', 'acceleration'];
const settings = (quantity: VibrationQuantity): AnalysisChartSettings => ({ quantity, xAxis: 'time', amplitude: '0p' });

function harmonicRecord(quantity: VibrationQuantity, length = 10001): RawVibrationRecord {
  const time = Array.from({ length }, (_, i) => i * 4 / (length - 1));
  const omega = 2 * Math.PI * 25;
  const values = time.map(t => quantity === 'displacement' ? 10 * Math.sin(omega * t)
    : quantity === 'velocity' ? 0.01 * omega * Math.cos(omega * t) : -1e-5 * omega ** 2 * Math.sin(omega * t));
  return { id: quantity, label: quantity, quantity, unit: VIBRATION_UNITS[quantity][0].value, timeUnit: 's', time, values };
}

describe('Time Domain numerical analysis', () => {
  it('converts all nine source/target quantity pairs against independently generated analytical waveforms', () => {
    for (const source of quantities) {
      const raw = harmonicRecord(source);
      const original = [...raw.values];
      const prepared = prepareTimeDomainRecord(raw);
      for (const target of quantities) {
        const expected = harmonicRecord(target).values;
        const actual = analyzeTimeDomain(prepared, settings(target)).values;
        let error2 = 0;
        let expected2 = 0;
        for (let i = 2; i < actual.length - 2; i++) {
          error2 += (actual[i] - expected[i]) ** 2;
          expected2 += expected[i] ** 2;
        }
        expect(Math.sqrt(error2 / expected2)).withContext(`${source} → ${target}`).toBeLessThan(0.005);
      }
      expect(raw.values).toEqual(original);
    }
  });

  it('does not turn a DC acceleration offset into a false velocity/displacement ramp', () => {
    const raw: RawVibrationRecord = { id: 'dc', label: 'DC', quantity: 'acceleration', unit: 'g', timeUnit: 'ms',
      time: [0, 100, 200, 300, 400], values: [2, 2, 2, 2, 2] };
    const prepared = prepareTimeDomainRecord(raw);
    for (const target of ['velocity', 'displacement'] as VibrationQuantity[]) {
      const result = analyzeTimeDomain(prepared, settings(target));
      result.values.forEach(value => expect(value).toBeCloseTo(0, 9));
      expect(result.notices.join(' ')).toContain('initial position/velocity');
    }
    expect(analyzeTimeDomain(prepared, settings('acceleration')).values[0]).toBeCloseTo(19.6133, 10);
  });

  it('uses every sample for true RMS, absolute peak and max-minus-min, without altering waveform values', () => {
    const raw: RawVibrationRecord = { id: 'pulse', label: 'Asymmetric pulse', quantity: 'displacement', unit: 'µm',
      timeUnit: 's', time: [0, 1, 2, 3, 4], values: [-2, 0, 0, 0, 7] };
    const prepared = prepareTimeDomainRecord(raw);
    const stats = calculateTimeDomainStatistics(raw.values);
    expect(stats.rms).toBeCloseTo(Math.sqrt(53 / 5), 12);
    expect(selectTimeDomainAmplitude(stats, '0p')).toBe(7);
    expect(selectTimeDomainAmplitude(stats, 'pp')).toBe(9);
    for (const amplitude of ['rms', '0p', 'pp'] as const) {
      const result = analyzeTimeDomain(prepared, { ...settings('displacement'), amplitude });
      expect(Array.from(result.values)).toEqual(raw.values);
      expect(result.amplitude).toBe(selectTimeDomainAmplitude(stats, amplitude));
    }
    expect(stats.rms).not.toBeCloseTo(stats.peak / Math.sqrt(2), 4);
  });

  it('rejects unavailable Time Domain axes and unsupported amplitude modes', () => {
    const prepared = prepareTimeDomainRecord(harmonicRecord('velocity', 11));
    expect(() => analyzeTimeDomain(prepared, { ...settings('velocity'), xAxis: 'order' })).toThrowError(/Time axis/);
    expect(() => analyzeTimeDomain(prepared, { ...settings('velocity'), amplitude: 'invalid' as 'rms' })).toThrowError(/amplitude/);
  });

  it('reuses bounded quantity arrays and benchmarks a full 40960-sample record across all display units', () => {
    const raw = harmonicRecord('displacement', 40960);
    const started = performance.now();
    const prepared = prepareTimeDomainRecord(raw);
    for (const quantity of quantities) {
      const first = convertTimeDomainQuantity(prepared, quantity);
      expect(convertTimeDomainQuantity(prepared, quantity)).toBe(first);
      for (const unit of VIBRATION_UNITS[quantity]) {
        const result = analyzeTimeDomain(prepared, { ...settings(quantity), unit: unit.value, amplitude: 'rms' });
        expect(result.sampleCount).toBe(40960);
        expect(Number.isFinite(result.amplitude)).toBeTrue();
      }
    }
    expect(prepared.quantities.size).toBe(3);
    console.info(`Vibration benchmark: prepare + 12 full-record analyses (40960 samples): ${(performance.now() - started).toFixed(1)} ms`);
  });
});
