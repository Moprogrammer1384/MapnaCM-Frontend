import { VibrationQuantity, VIBRATION_UNITS } from '../../../models/analysis-chart-settings.model';
import { RawVibrationRecord } from '../../../models/vibration-data.model';
import { prepareTimeDomainRecord } from './time-domain-preparation';
import { detrendSignal, differentiateSignal, integrateSignal } from './time-domain-calculus';
import { convertTimeDomainUnit } from './time-domain-unit-conversion';

const quantities: VibrationQuantity[] = ['displacement', 'velocity', 'acceleration'];

describe('Time Domain signal preprocessing', () => {
  it('differentiates nonuniform quadratic data at every point, including endpoints', () => {
    const time = new Float64Array([0, 0.1, 0.24, 0.5, 0.9, 1.4]);
    const values = time.map(t => 3 * t ** 2 + 2 * t + 7);
    const derivative = differentiateSignal(time, values);
    time.forEach((t, i) => expect(derivative[i]).toBeCloseTo(6 * t + 2, 11));
    const acceleration = differentiateSignal(time, derivative);
    acceleration.forEach(value => expect(value).toBeCloseTo(6, 10));
  });

  it('integrates nonuniform linear data with the requested physical initial condition', () => {
    const time = new Float64Array([0, 0.1, 0.24, 0.5, 0.9, 1.4]);
    const integral = integrateSignal(time, time.map(t => 6 * t + 2), 7);
    time.forEach((t, i) => expect(integral[i]).toBeCloseTo(3 * t ** 2 + 2 * t + 7, 12));
    detrendSignal(time, time.map(t => 8 * t + 10)).forEach(value => expect(value).toBeCloseTo(0, 12));
  });

  it('converts every unit from arbitrary source units and returns to the same source values', () => {
    for (const quantity of quantities) {
      for (const from of VIBRATION_UNITS[quantity]) {
        for (const to of VIBRATION_UNITS[quantity]) {
          const converted = convertTimeDomainUnit([-3.5, 0, 7], quantity, from.value, to.value);
          const roundTrip = convertTimeDomainUnit(converted, quantity, to.value, from.value);
          [-3.5, 0, 7].forEach((value, i) => expect(roundTrip[i]).toBeCloseTo(value, 10));
        }
      }
    }
    expect(convertTimeDomainUnit([1], 'acceleration', 'g', 'm/s²')[0]).toBe(9.80665);
    expect(convertTimeDomainUnit([1], 'displacement', 'mil', 'µm')[0]).toBeCloseTo(25.4, 12);
    expect(() => convertTimeDomainUnit([1], 'velocity', 'g', 'mm/s')).toThrowError(/incompatible/);
  });

  it('rejects corrupt raw time records before Time Domain analysis', () => {
    const raw: RawVibrationRecord = { id: 'validation', label: 'Validation', quantity: 'velocity', unit: 'mm/s',
      timeUnit: 's', time: [0, 1, 2, 3], values: [1, -2, 3, 0] };
    expect(() => prepareTimeDomainRecord({ ...raw, time: [0] })).toThrowError(/matching/);
    expect(() => prepareTimeDomainRecord({ ...raw, time: raw.time.map(() => 0) })).toThrowError(/increasing/);
    expect(() => prepareTimeDomainRecord({ ...raw, values: raw.values.map(() => NaN) })).toThrowError(/non-finite/);
    expect(() => prepareTimeDomainRecord({ ...raw, quantity: 'toString' as VibrationQuantity })).toThrowError(/Unsupported/);
  });
});
