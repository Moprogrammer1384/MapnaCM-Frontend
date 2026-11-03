import { AnalysisChartSettings, defaultChartSettings, VIBRATION_UNITS, vibrationUnit } from '../../../models/analysis-chart-settings.model';
import { BodeAnalysis, BodeRecord } from '../../../models/bode-analysis.model';
import { unitToSi } from '../time-domain/time-domain-unit-conversion';

/** The source owns Quantity; preserve compatible display choices without converting physical quantity. */
export function bodeSettingsForRecord(record: BodeRecord, settings?: AnalysisChartSettings): AnalysisChartSettings {
  unitToSi(record.quantity, record.unit);
  const compatibleUnit = settings?.quantity === record.quantity &&
    VIBRATION_UNITS[record.quantity].some(unit => unit.value === settings.unit);
  return { ...defaultChartSettings('bode'), ...settings, quantity: record.quantity,
    unit: compatibleUnit ? settings!.unit : record.unit };
}

/** Display transformations of measured 1X tracking data, without FFT or signal calculus. */
export function analyzeBode(record: BodeRecord, settings: AnalysisChartSettings): BodeAnalysis {
  if (record.phaseConvention !== 'as-exported' || record.order !== 1) {
    throw new Error('The tracking run has incompatible quantity, phase or order metadata.');
  }
  if (settings.quantity !== record.quantity) {
    throw new Error('The measured quantity must match the source; its phase lead/lag convention is unspecified.');
  }
  if (settings.xAxis !== 'rpm' && settings.xAxis !== 'hz') {
    throw new Error('Select RPM or Hz for the Bode speed axis.');
  }
  if (!record.observations.length) { throw new Error('The tracking run has no observations.'); }
  const unit = vibrationUnit(settings);
  const amplitudeFactor = settings.amplitude === 'rms' ? 1 : settings.amplitude === '0p' ? Math.SQRT2 : 2 * Math.SQRT2;
  const displayFactor = amplitudeFactor * (unitToSi(record.quantity, record.unit) / unitToSi(record.quantity, unit.value));
  const phaseMode = settings.phaseMode ?? 'wrapped';
  const speed: number[] = [], amplitude: number[] = [], phase: number[] = [];
  let previousWrapped = 0, offset = 0, peakIndex = 0;
  let minimumSpeedRpm = Infinity, maximumSpeedRpm = -Infinity;
  record.observations.forEach((point, index) => {
    if (!Number.isFinite(point.speedRpm) || point.speedRpm <= 0 ||
      !Number.isFinite(point.amplitudeRms) || point.amplitudeRms < 0 || !Number.isFinite(point.phaseDegrees)) {
      throw new Error('The tracking run contains an invalid speed, amplitude or phase.');
    }
    // Preserve acquisition order and every observation, including repeated speeds.
    const wrapped = ((point.phaseDegrees % 360) + 360) % 360;
    if (index > 0) {
      const delta = wrapped - previousWrapped;
      if (delta > 180) { offset -= 360; }
      else if (delta < -180) { offset += 360; }
    }
    previousWrapped = wrapped;
    speed.push(settings.xAxis === 'hz' ? point.speedRpm / 60 : point.speedRpm);
    amplitude.push(point.amplitudeRms * displayFactor);
    phase.push(phaseMode === 'unwrapped' ? wrapped + offset : wrapped);
    if (amplitude[index] > amplitude[peakIndex]) { peakIndex = index; }
    minimumSpeedRpm = Math.min(minimumSpeedRpm, point.speedRpm);
    maximumSpeedRpm = Math.max(maximumSpeedRpm, point.speedRpm);
  });
  return { quantity: record.quantity, speed, amplitude, phase, axisUnit: settings.xAxis === 'hz' ? 'Hz' : 'RPM', unit: unit.value,
    amplitudeMode: settings.amplitude, phaseMode, peakIndex, minimumSpeedRpm, maximumSpeedRpm };
}
