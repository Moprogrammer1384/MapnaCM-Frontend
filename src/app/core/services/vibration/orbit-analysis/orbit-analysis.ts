import { OrbitAnalysis, OrbitRecord, OrbitSettings } from 'src/app/core/models/orbit-analysis.model';
import { keyphasorMarkers, validateKeyphasor } from './orbit-keyphasor';
import { filterOrbitOrder } from './orbit-order-filter';
import { prepareOrbitSignal } from './orbit-signal-preparation';

export function analyzeOrbit(record: OrbitRecord, settings: OrbitSettings): OrbitAnalysis {
  const direct = prepareOrbitSignal(record, settings), pulses = validateKeyphasor(record);
  const filter = settings.filter === 'order' && pulses.length >= 2 ? 'order' : 'direct';
  const points = filter === 'direct' ? direct : filterOrbitOrder(direct, pulses, settings.order);
  const notices: string[] = [];
  if (settings.filter === 'order' && filter === 'direct') { notices.push('Order filtering requires valid Keyphasor pulses. Displaying the direct orbit.'); }
  if (settings.showKeyphasor && !pulses.length) { notices.push('No Keyphasor channel in this acquisition. Reference markers are unavailable.'); }
  const extent = (axis: 'x' | 'y') => { const values = points.map(p => p[axis]); return Math.max(...values) - Math.min(...values); };
  return { filter, points, direct, keyphasor: settings.showKeyphasor ? keyphasorMarkers(points, pulses) : [],
    xPeakToPeak: extent('x'), yPeakToPeak: extent('y'), maximumRadius: Math.max(...points.map(p => Math.hypot(p.x, p.y))),
    speedRpm: record.shaftSpeedRpm, notices };
}
