import { AnalysisChartSettings, vibrationUnit } from '../../../models/analysis-chart-settings.model';
import { VibrationDisplayRecord } from '../../../models/vibration-api.model';
import { TimeDomainAnalysis, TimeDomainStatistics } from '../../../models/vibration-data.model';
import { timeDomainAmplitudeReference } from './time-domain-amplitude';
import { selectTimeDomainAmplitude } from './time-domain-statistics';
import { unitToSi } from './time-domain-unit-conversion';

/** Display server extrema/statistics. It deliberately performs no derivative, integral or FFT. */
export function displayTimeDomain(record: VibrationDisplayRecord, settings: AnalysisChartSettings): TimeDomainAnalysis {
  const unit = vibrationUnit({ ...settings, quantity: record.quantity }).value;
  const scale = unitToSi(record.quantity, record.unit) / unitToSi(record.quantity, unit);
  const source = record.series.statistics;
  const statistics: TimeDomainStatistics = { min: source.min * scale, max: source.max * scale,
    mean: source.mean * scale, rms: source.rms * scale, peak: source.peak * scale,
    peakToPeak: (source.peakToPeak ?? source.max - source.min) * scale };
  return { time: Float64Array.from(record.series.points, point => point.x),
    values: Float64Array.from(record.series.points, point => point.y * scale), statistics,
    amplitude: selectTimeDomainAmplitude(statistics, settings.amplitude), amplitudeMode: settings.amplitude,
    amplitudeReference: timeDomainAmplitudeReference(statistics, settings.amplitude), unit, quantity: record.quantity,
    sampleCount: record.series.originalSampleCount, notices: [] };
}
