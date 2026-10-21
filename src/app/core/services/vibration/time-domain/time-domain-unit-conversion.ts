import { VibrationQuantity, VibrationUnit, VIBRATION_UNITS } from '../../../models/analysis-chart-settings.model';

/** Exact scale from each quantity's default display unit to SI. */
const DEFAULT_TO_SI: Record<VibrationQuantity, number> = { displacement: 1e-6, velocity: 1e-3, acceleration: 1 };

export function unitToSi(quantity: VibrationQuantity, unit: VibrationUnit): number {
  const option = VIBRATION_UNITS[quantity]?.find(item => item.value === unit);
  if (!option) { throw new Error(`Unit ${unit} is incompatible with ${quantity}.`); }
  return DEFAULT_TO_SI[quantity] / option.scale;
}

/** Convert every sample in a time signal from an explicit source unit. */
export function convertTimeDomainUnit(values: ArrayLike<number>, quantity: VibrationQuantity,
  from: VibrationUnit, to: VibrationUnit): Float64Array {
  return scaleSignal(values, unitToSi(quantity, from) / unitToSi(quantity, to));
}

export function scaleSignal(values: ArrayLike<number>, scale: number): Float64Array {
  const result = new Float64Array(values.length);
  for (let index = 0; index < values.length; index++) { result[index] = values[index] * scale; }
  return result;
}
