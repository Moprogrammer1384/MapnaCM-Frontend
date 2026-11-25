import { SignalIndicatorRecord, SignalIndicatorSeriesDto } from 'src/app/core/models/vibration/signal-indicators.model';

const values = { rms: 14.03, zeroToPeak: 27.78, peakToPeak: 54.02 };
const firstAtUtc = '2026-10-22T20:30:00.000Z';

export function storedIndicatorRecord(rmsValues = [8, values.rms, 11]): SignalIndicatorRecord {
  const start = Date.parse(firstAtUtc);
  const points = rmsValues.map((rms, index) => ({
    sampledAtUtc: new Date(start + index * 1000).toISOString(), rms,
    zeroToPeak: rms === values.rms ? values.zeroToPeak : rms * 1.5,
    peakToPeak: rms === values.rms ? values.peakToPeak : rms * 2.8,
    breakBefore: false,
  }));
  const maxima = {
    rms: Math.max(...points.map(point => point.rms)),
    zeroToPeak: Math.max(...points.map(point => point.zeroToPeak)),
    peakToPeak: Math.max(...points.map(point => point.peakToPeak)),
  };
  return { measurementId: 1, quantity: 'displacement', unit: 'µm', firstAtUtc,
    lastAtUtc: points[points.length - 1].sampledAtUtc, stepSeconds: 1, totalCount: points.length, maxima, points };
}

export function storedIndicatorDto(measurementId = 1): SignalIndicatorSeriesDto {
  return { ...storedIndicatorRecord(), measurementId, quantity: 1, unit: 1 };
}
