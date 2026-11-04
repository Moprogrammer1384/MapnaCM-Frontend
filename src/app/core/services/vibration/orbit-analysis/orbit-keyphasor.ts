import { OrbitPoint, OrbitRecord } from 'src/app/core/models/orbit-analysis.model';
import { interpolateOrbitPoint } from './orbit-point-interpolation';

export function validateKeyphasor(record: OrbitRecord): readonly number[] {
  const channel = record.keyphasor;
  if (!channel || channel.quality !== 'valid') { return []; }
  if (!channel.id || channel.clockId !== record.clockId || channel.unit !== 'V' || channel.pulsesPerRevolution !== 1 ||
    !['rising', 'falling'].includes(channel.detectedEdge) || !Number.isFinite(channel.thresholdVolts) ||
    !Number.isFinite(channel.hysteresisVolts) || channel.hysteresisVolts < 0 ||
    channel.values?.length !== record.time.length || !channel.values.every(Number.isFinite)) {
    throw new Error('Keyphasor requires a valid synchronized voltage channel and one pulse per revolution.');
  }
  const pulses = channel.pulseTimes;
  if (!Array.isArray(pulses)) { throw new Error('Keyphasor pulse times must be supplied by the acquisition.'); }
  if (pulses.some((value, i) => !Number.isFinite(value) || (i > 0 && value <= pulses[i - 1]))) {
    throw new Error('Keyphasor times must be finite, distinct and increasing.');
  }
  return pulses;
}
export function keyphasorMarkers(points: readonly OrbitPoint[], pulses: readonly number[]): OrbitPoint[] {
  return pulses.filter(time => time >= points[0].time && time <= points[points.length - 1].time).map(time => interpolateOrbitPoint(points, time));
}
/** Unwrapped shaft phase between once-per-revolution pulses, without extrapolation. */
export function shaftPhaseAt(time: number, pulses: readonly number[]): number {
  if (pulses.length < 2 || time < pulses[0] || time > pulses[pulses.length - 1]) { throw new Error('Order filtering requires bracketing Keyphasor pulses.'); }
  let low = 0, high = pulses.length - 1;
  while (high - low > 1) { const mid = (low + high) >> 1; if (pulses[mid] <= time) { low = mid; } else { high = mid; } }
  return 2 * Math.PI * (low + (time - pulses[low]) / (pulses[high] - pulses[low]));
}
