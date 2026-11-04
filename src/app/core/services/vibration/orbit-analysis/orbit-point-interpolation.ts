import { OrbitPoint } from 'src/app/core/models/orbit-analysis.model';

/** Interpolate a position at a supplied reference time, without extrapolating the acquisition. */
export function interpolateOrbitPoint(points: readonly OrbitPoint[], time: number): OrbitPoint {
  let low = 0, high = points.length - 1;
  if (time < points[low].time || time > points[high].time) { throw new Error('Reference time is outside the acquisition.'); }
  while (high - low > 1) { const mid = (low + high) >> 1; if (points[mid].time <= time) { low = mid; } else { high = mid; } }
  const a = points[low], b = points[high], ratio = (time - a.time) / (b.time - a.time);
  return { time, x: a.x + ratio * (b.x - a.x), y: a.y + ratio * (b.y - a.y) };
}
