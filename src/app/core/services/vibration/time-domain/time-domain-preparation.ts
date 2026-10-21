import { PreparedTimeDomainRecord, RawVibrationRecord } from '../../../models/vibration-data.model';
import { TIME_DOMAIN_QUANTITY_ORDER } from './time-domain-quantity-conversion';
import { scaleSignal, unitToSi } from './time-domain-unit-conversion';

/** Validate a time record and normalize it to seconds/SI once before time-domain analysis. */
export function prepareTimeDomainRecord(raw: RawVibrationRecord): PreparedTimeDomainRecord {
  if (!raw?.time || !raw.values || raw.time.length < 3 || raw.time.length !== raw.values.length) {
    throw new Error('At least three matching time/value samples are required.');
  }
  if (!Object.prototype.hasOwnProperty.call(TIME_DOMAIN_QUANTITY_ORDER, raw.quantity)) { throw new Error('Unsupported source vibration quantity.'); }
  if (raw.timeUnit !== 's' && raw.timeUnit !== 'ms') { throw new Error('Source time unit must be s or ms.'); }
  const time = scaleSignal(raw.time, raw.timeUnit === 'ms' ? 0.001 : 1);
  let minDt = Infinity;
  let maxDt = 0;
  for (let index = 0; index < time.length; index++) {
    if (!Number.isFinite(time[index]) || !Number.isFinite(raw.values[index])) {
      throw new Error('Raw data contains a missing or non-finite sample.');
    }
    if (index > 0) {
      const dt = time[index] - time[index - 1];
      if (dt <= 0) { throw new Error('Raw timestamps must be strictly increasing; duplicates/gaps are not filled silently.'); }
      minDt = Math.min(minDt, dt);
      maxDt = Math.max(maxDt, dt);
    }
  }
  const values = scaleSignal(raw.values, unitToSi(raw.quantity, raw.unit));
  return { time, sourceQuantity: raw.quantity, quantities: new Map([[raw.quantity, values]]),
    notices: maxDt / minDt > 1.01 ? ['Nonuniform sample spacing: calculations use the recorded timestamps.'] : [] };
}
