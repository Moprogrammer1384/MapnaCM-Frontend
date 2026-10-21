import { VibrationQuantity } from '../../../models/analysis-chart-settings.model';

const ORDERS: Record<VibrationQuantity, number> = { displacement: 0, velocity: 1, acceleration: 2 };

/** Fourier differentiation/integration: Y=(j*2*pi*f)^(target-source)*X.
 * DC conversion is zero: integration constants/static motion are not recoverable. */
export function convertFrequencyQuantity(real: number, imaginary: number, hz: number,
  source: VibrationQuantity, target: VibrationQuantity): [number, number] {
  if (!(source in ORDERS) || !(target in ORDERS)) { throw new Error('Unsupported spectrum quantity.'); }
  const difference = ORDERS[target] - ORDERS[source];
  if (!difference) { return [real, imaginary]; }
  if (hz === 0) { return [0, 0]; }
  const omega = 2 * Math.PI * hz;
  switch (difference) {
    case 1: return [-imaginary * omega, real * omega];
    case 2: return [-real * omega * omega, -imaginary * omega * omega];
    case -1: return [imaginary / omega, -real / omega];
    default: return [-real / (omega * omega), -imaginary / (omega * omega)];
  }
}
