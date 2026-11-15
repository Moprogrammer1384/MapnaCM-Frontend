import { scaleSignalIndicatorLimits, signalIndicatorAlarmLevel, validSignalIndicatorLimits } from './signal-indicators-alarms';

describe('Upper-only stored signal indicator alarms', () => {
  const limits = { upperNormal: 10, upperCaution: 12, upperDanger: 14 };
  it('keeps zero and low vibration normal and applies the four upper bands', () => {
    for (const value of [0, 1, 6, 8, 10]) { expect(signalIndicatorAlarmLevel(value, limits)).toBe('normal'); }
    for (const value of [10.01, 11, 12]) { expect(signalIndicatorAlarmLevel(value, limits)).toBe('yellow'); }
    for (const value of [12.01, 13, 14]) { expect(signalIndicatorAlarmLevel(value, limits)).toBe('orange'); }
    for (const value of [14.01, 100]) { expect(signalIndicatorAlarmLevel(value, limits)).toBe('red'); }
  });
  it('validates three positive ordered limits and scales without changing severity', () => {
    expect(validSignalIndicatorLimits(limits)).toBeTrue();
    const scaled = scaleSignalIndicatorLimits(limits, 0.001);
    for (const value of [0, 3, 5, 8, 11, 13, 15]) {
      expect(signalIndicatorAlarmLevel(value * 0.001, scaled)).toBe(signalIndicatorAlarmLevel(value, limits));
    }
    for (const bad of [{ ...limits, upperNormal: 0 }, { ...limits, upperNormal: -1 }, { ...limits, upperNormal: 12 },
      { ...limits, upperCaution: 14 }, { ...limits, upperDanger: NaN }, { ...limits, upperCaution: Infinity }]) {
      expect(validSignalIndicatorLimits(bad)).toBeFalse();
    }
  });
});
