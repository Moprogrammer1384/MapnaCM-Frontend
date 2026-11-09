import { RotorPositionAnalysis, RotorPositionPoint, RotorPositionRecord, RotorPositionSettings, RotorPositionUnit } from 'src/app/core/models/rotor-position.model';
import { elapsedSeconds } from 'src/app/core/utils/elapsed-seconds';

/** Micrometres per native unit. Conversion never changes physical quantity or removes DC. */
export const ROTOR_POSITION_UNIT_SCALE: Record<RotorPositionUnit, number> = { 'µm': 1, mm: 1000, mil: 25.4, in: 25400 };

export function analyzeRotorPosition(record: RotorPositionRecord, settings: RotorPositionSettings): RotorPositionAnalysis {
  if (record.quantity !== 'displacement' || !record.dcPreserved || !record.synchronized) {
    throw new Error('Synchronized displacement measurements with retained DC are required.');
  }
  const scale = ROTOR_POSITION_UNIT_SCALE[record.unit] / ROTOR_POSITION_UNIT_SCALE[settings.unit];
  const duration = elapsedSeconds(record.event.from, record.event.to);
  if (!Number.isFinite(scale) || scale <= 0 || !Number.isFinite(record.meanWindowSeconds) || record.meanWindowSeconds <= 0) {
    throw new Error('The displacement unit and averaging interval must be valid.');
  }
  if (!Number.isFinite(duration) || duration <= 0) { throw new Error('The acquisition must have valid start and end times.'); }
  const [a, b] = record.probeAnglesDegrees.map(angle => angle * Math.PI / 180);
  const determinant = Math.sin(b - a);
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 0.1 ||
    ![...record.reference.probeMean, ...record.reference.position].every(Number.isFinite)) {
    throw new Error('Valid probe angles and a calibrated position reference are required.');
  }
  if (settings.reference === 'bearing' && !record.reference.bearingCentreKnown) {
    throw new Error('The bearing centre is unknown. Choose First valid point to view relative movement.');
  }
  const points: RotorPositionPoint[] = [];
  let omittedCount = 0, breakBefore = false, previousTime = -Infinity;
  for (const observation of record.observations) {
    if (!Number.isFinite(observation.timeSeconds) || observation.timeSeconds < 0 || observation.timeSeconds <= previousTime) {
      throw new Error('Position observations must have strictly increasing, non-negative acquisition times.');
    }
    if (observation.timeSeconds > duration + 1e-9) { throw new Error('Position observations must remain inside the selected acquisition.'); }
    previousTime = observation.timeSeconds;
    const validSpeed = observation.speedRpm === null || (Number.isFinite(observation.speedRpm) && observation.speedRpm >= 0);
    if (observation.quality !== 'valid' || observation.meanProbeX === null || observation.meanProbeY === null ||
      !Number.isFinite(observation.meanProbeX) || !Number.isFinite(observation.meanProbeY)) {
      omittedCount++; breakBefore = true; continue;
    }
    const q1 = observation.meanProbeX - record.reference.probeMean[0];
    const q2 = observation.meanProbeY - record.reference.probeMean[1];
    const x = record.reference.position[0] + (q1 * Math.sin(b) - q2 * Math.sin(a)) / determinant;
    const y = record.reference.position[1] + (q2 * Math.cos(a) - q1 * Math.cos(b)) / determinant;
    if (!Number.isFinite(x * scale) || !Number.isFinite(y * scale)) { throw new Error('Calibrated displacement exceeds the supported numeric range.'); }
    const last = points[points.length - 1];
    points.push({ time: observation.timeSeconds, x: x * scale, y: y * scale,
      speedRpm: validSpeed ? observation.speedRpm : null,
      breakBefore: breakBefore || !!observation.breakBefore || (!!last && observation.timeSeconds - last.time > record.meanWindowSeconds * 1.5) });
    breakBefore = false;
  }
  const first = points[0];
  const relative = settings.reference === 'first';
  const displayed = relative && first ? points.map(point => ({ ...point, x: point.x - first.x, y: point.y - first.y })) : points;
  const clearance = !relative && record.reference.bearingCentreKnown && settings.showClearance ? record.clearance : undefined;
  if (clearance && (![clearance.radialX, clearance.radialY].every(Number.isFinite) || clearance.radialX <= 0 || clearance.radialY <= 0)) {
    throw new Error('Bearing clearance must contain positive radial dimensions.');
  }
  return { points: displayed, unit: settings.unit, omittedCount,
    bearingCentreKnown: !relative && record.reference.bearingCentreKnown,
    clearance: clearance ? { radialX: clearance.radialX * scale, radialY: clearance.radialY * scale } : undefined };
}
