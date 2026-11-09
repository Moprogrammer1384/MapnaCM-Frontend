import { AnalysisChartSettings, vibrationUnit } from '../../../models/analysis-chart-settings.model';
import { PreparedTimeDomainRecord, TimeDomainAnalysis } from '../../../models/vibration-data.model';
import { convertTimeDomainQuantity, TIME_DOMAIN_QUANTITY_ORDER } from './time-domain-quantity-conversion';
import { calculateTimeDomainStatistics, selectTimeDomainAmplitude } from './time-domain-statistics';
import { scaleSignal, unitToSi } from './time-domain-unit-conversion';
import { timeDomainAmplitudeReference } from './time-domain-amplitude';

export function analyzeTimeDomain(record: PreparedTimeDomainRecord, settings: AnalysisChartSettings): TimeDomainAnalysis {
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
  return { time: record.time.slice(), values, statistics, amplitude: selectTimeDomainAmplitude(statistics, settings.amplitude),
    amplitudeMode: settings.amplitude, amplitudeReference: timeDomainAmplitudeReference(statistics, settings.amplitude),
    unit, quantity: settings.quantity, sampleCount: values.length, notices };
}
