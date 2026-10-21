import { VibrationQuantity } from '../../../models/analysis-chart-settings.model';
import { PreparedTimeDomainRecord } from '../../../models/vibration-data.model';
import { differentiateSignal, integrateDynamicSignal } from './time-domain-calculus';

export const TIME_DOMAIN_QUANTITY_ORDER: Readonly<Record<VibrationQuantity, number>> = { displacement: 0, velocity: 1, acceleration: 2 };

/** Convert from the original calibrated signal, with at most two calculus stages. */
export function convertTimeDomainQuantity(record: PreparedTimeDomainRecord, target: VibrationQuantity): Float64Array {
  if (!Object.prototype.hasOwnProperty.call(TIME_DOMAIN_QUANTITY_ORDER, target)) { throw new Error('Unsupported vibration quantity.'); }
  const cached = record.quantities.get(target);
  if (cached) { return cached; }
  let values = record.quantities.get(record.sourceQuantity)!;
  let order = TIME_DOMAIN_QUANTITY_ORDER[record.sourceQuantity];
  const targetOrder = TIME_DOMAIN_QUANTITY_ORDER[target];
  while (order !== targetOrder) {
    values = order < targetOrder ? differentiateSignal(record.time, values) : integrateDynamicSignal(record.time, values);
    order += order < targetOrder ? 1 : -1;
  }
  record.quantities.set(target, values);
  return values;
}

