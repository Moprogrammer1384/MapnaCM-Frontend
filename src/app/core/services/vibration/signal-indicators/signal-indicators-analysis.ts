import { VibrationQuantity, VibrationUnit } from '../../../models/analysis-chart-settings.model';
import { SignalIndicatorAnalysis, SignalIndicatorPoint } from '../../../models/signal-indicators.model';
import { RawVibrationRecord, TimeDomainAnalysis } from '../../../models/vibration-data.model';
import { AnalysisChartSettings } from '../../../models/analysis-chart-settings.model';
import { VibrationDisplayRecord } from '../../../models/vibration-api.model';
import { analyzeTimeDomain } from '../time-domain/time-domain-analysis';
import { prepareTimeDomainRecord } from '../time-domain/time-domain-preparation';
import { calculateTimeDomainStatistics } from '../time-domain/time-domain-statistics';
import { displayTimeDomain } from '../time-domain/time-domain-display';
import { unitToSi } from '../time-domain/time-domain-unit-conversion';

/** Every window uses its actual samples; no harmonic RMS/peak multipliers or synthetic values. */
export function analyzeSignalIndicators(source: RawVibrationRecord, quantity: VibrationQuantity,
  unit: VibrationUnit, windowSeconds: number): SignalIndicatorAnalysis {
  const prepared = prepareTimeDomainRecord(source);
  const signal = analyzeTimeDomain(prepared, { quantity, unit, xAxis: 'time', amplitude: 'rms' });
  return signalIndicatorsFromTimeDomain(signal, source.id, windowSeconds);
}

/** Consume the existing worker result so raw quantity/unit conversion is never duplicated on the UI thread. */
export function signalIndicatorsFromTimeDomain(signal: TimeDomainAnalysis, sourceId: string, windowSeconds: number): SignalIndicatorAnalysis {
  if (!Number.isFinite(windowSeconds) || windowSeconds <= 0) { throw new Error('Choose a positive statistics window.'); }
  const points: SignalIndicatorPoint[] = [];
  let start = 0;
  for (let index = 1; index <= signal.time.length; index++) {
    const bucket = (sample: number) => Math.floor((signal.time[sample] - signal.time[0]) / windowSeconds);
    if (index === signal.time.length || bucket(index) !== bucket(start)) {
      points.push({ from: signal.time[start], to: signal.time[index - 1], sampleCount: index - start,
        statistics: calculateTimeDomainStatistics(signal.values.subarray(start, index)) });
      start = index;
    }
  }
  return { basis: 'raw', sourceId, signal, windowSeconds, points };
}

/** Summary statistics are authoritative. Never treat the envelope's min/max points as raw waveform samples. */
export function signalIndicatorsFromSummary(record: VibrationDisplayRecord, settings: AnalysisChartSettings, sourceId: string): SignalIndicatorAnalysis {
  const signal = displayTimeDomain(record, settings);
  const scale = unitToSi(record.quantity, record.unit) / unitToSi(record.quantity, signal.unit);
  const buckets = record.series.buckets;
  const points: SignalIndicatorPoint[] = buckets?.length ? buckets.map((bucket, index) => {
    const stats = bucket.statistics;
    if (!Number.isFinite(bucket.fromX) || !Number.isFinite(bucket.toX) || bucket.fromX > bucket.toX
      || !Number.isSafeInteger(stats.sampleCount) || stats.sampleCount <= 0
      || ![stats.min, stats.max, stats.mean, stats.rms, stats.peak].every(Number.isFinite)) {
      throw new Error('The Time Domain response contains invalid summary statistics.');
    }
    return { from: bucket.fromX, to: bucket.toX, sampleCount: stats.sampleCount,
      breakBefore: bucket.containsGaps || (index > 0 && record.series.hasGaps),
      statistics: { min: stats.min * scale, max: stats.max * scale, mean: stats.mean * scale,
        rms: stats.rms * scale, peak: stats.peak * scale, peakToPeak: (stats.peakToPeak ?? stats.max - stats.min) * scale } };
  }) : [{ from: signal.time[0], to: signal.time[signal.time.length - 1], sampleCount: signal.sampleCount, statistics: signal.statistics }];
  if (points.reduce((count, point) => count + point.sampleCount, 0) !== signal.sampleCount) {
    throw new Error('The Time Domain summary sample counts do not match the acquisition.');
  }
  const notices = [...signal.notices];
  if (settings.quantity !== record.quantity) { notices.push('Showing the recorded quantity. Quantity conversion requires continuous raw Time Domain samples.'); }
  return { basis: 'summary', sourceId, signal: { ...signal, notices }, windowSeconds: 0, points };
}
