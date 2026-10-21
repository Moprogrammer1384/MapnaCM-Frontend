import { AnalysisChartSettings, vibrationUnit } from '../../../models/analysis-chart-settings.model';
import { PreparedTimeDomainRecord, TimeDomainAnalysis } from '../../../models/vibration-data.model';
import { convertTimeDomainQuantity, TIME_DOMAIN_QUANTITY_ORDER } from './time-domain-quantity-conversion';
import { calculateTimeDomainStatistics, selectTimeDomainAmplitude } from './time-domain-statistics';
import { scaleSignal, unitToSi } from './time-domain-unit-conversion';
import { timeDomainAmplitudeReference } from './time-domain-amplitude';

/** X-axis transform for time records. No invented RPM/Order conversion for a time signal. */
export function timeDomainAxis(record: PreparedTimeDomainRecord, axis: AnalysisChartSettings['xAxis']): Float64Array {
  if (axis !== 'time') { throw new Error('Time Domain requires the Time axis.'); }
  return record.time;
}

export function analyzeTimeDomain(record: PreparedTimeDomainRecord, settings: AnalysisChartSettings): TimeDomainAnalysis {
  const time = timeDomainAxis(record, settings.xAxis);
  const siValues = convertTimeDomainQuantity(record, settings.quantity);
  const unit = vibrationUnit(settings).value;
  const values = scaleSignal(siValues, 1 / unitToSi(settings.quantity, unit));
  const statistics = calculateTimeDomainStatistics(values);
  const sourceOrder = TIME_DOMAIN_QUANTITY_ORDER[record.sourceQuantity];
  const targetOrder = TIME_DOMAIN_QUANTITY_ORDER[settings.quantity];
  const notices = [...record.notices];
  if (targetOrder < sourceOrder) {
    notices.push('AC integration removes the record mean at each stage; initial position/velocity and sensor drift cannot be recovered.');
  } else if (targetOrder > sourceOrder) {
    notices.push('Numerical differentiation amplifies high-frequency noise; no additional filter is applied.');
  }
  return { time: time.slice(), values, statistics, amplitude: selectTimeDomainAmplitude(statistics, settings.amplitude),
    amplitudeMode: settings.amplitude, amplitudeReference: timeDomainAmplitudeReference(statistics, settings.amplitude),
    unit, quantity: settings.quantity, sampleCount: values.length, notices };
}
