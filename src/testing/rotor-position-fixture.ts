import { RotorPositionEvent, RotorPositionRecord } from 'src/app/core/models/rotor-position.model';
import { orbitPair } from './orbit-fixture';

export const rotorPair = orbitPair;
export function rotorEvent(): RotorPositionEvent {
  return { id: 'startup', eventType: 'Startup', from: '2026-11-08T10:00:00', to: '2026-11-08T10:00:03', label: '10:00 · Startup' };
}
export function rotorRecord(): RotorPositionRecord {
  return { id: 'dc-reference', event: rotorEvent(), pairKey: rotorPair().key, provenance: 'measured',
    quantity: 'displacement', unit: 'µm', dcPreserved: true, synchronized: true, meanWindowSeconds: 1,
    probeAnglesDegrees: [0, 90], reference: { probeMean: [0, 0], position: [0, 0], bearingCentreKnown: true },
    clearance: { radialX: 80, radialY: 80 }, observations: [0, 1, 2, 3].map(timeSeconds => ({
      timeSeconds, meanProbeX: 10 + timeSeconds, meanProbeY: -40 + timeSeconds * 2,
      speedRpm: timeSeconds * 1000, quality: 'valid',
    })) };
}
