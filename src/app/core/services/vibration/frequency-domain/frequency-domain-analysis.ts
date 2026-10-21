import { AnalysisChartSettings, vibrationUnit } from '../../../models/analysis-chart-settings.model';
import { FrequencyDomainAnalysis } from '../../../models/frequency-domain.model';
import { RawVibrationRecord } from '../../../models/vibration-data.model';
import { prepareTimeDomainRecord } from '../time-domain/time-domain-preparation';
import { resampleFftInput } from './fft-input-resampling';
import { windowFftInput } from './fft-input-window';
import { ComplexSpectrum, frequencyDomainFft } from './frequency-domain-fft';
import { frequencyDomainAxis } from './frequency-domain-axis';
import { frequencyLineAmplitude } from './frequency-domain-amplitude';
import { convertFrequencyQuantity } from './frequency-domain-quantity-conversion';
import { spectrumUnitScale } from './frequency-domain-unit-conversion';

export function prepareFrequencyDomainRecord(raw: RawVibrationRecord) {
  const timeRecord = prepareTimeDomainRecord(raw);
  const uniform = resampleFftInput(timeRecord);
  return { ...uniform, sourceQuantity: raw.quantity,
    notices: uniform.resampled ? ['Nonuniform timestamps: linear interpolation to the same sample count and endpoints before FFT.'] : [],
    spectra: new Map<string, ComplexSpectrum & { coherentGain: number }>() };
}

export function analyzeFrequencyDomain(record: ReturnType<typeof prepareFrequencyDomainRecord>,
  settings: AnalysisChartSettings): FrequencyDomainAnalysis {
  const axis = frequencyDomainAxis(settings);
  const window = settings.window ?? 'rectangular';
  let spectrum = record.spectra.get(window);
  if (!spectrum) {
    const windowed = windowFftInput(record.values, window);
    spectrum = { ...frequencyDomainFft(windowed.values), coherentGain: windowed.coherentGain };
    record.spectra.set(window, spectrum);
  }
  const count = record.values.length;
  const bins = Math.floor(count / 2) + 1;
  const frequency = new Float64Array(bins), values = new Float64Array(bins);
  const unit = vibrationUnit(settings).value;
  const scale = spectrumUnitScale(settings.quantity, unit);
  const resolutionHz = record.sampleRate / count;
  let min = Infinity, max = -Infinity, peakFrequency = 0;
  for (let index = 0; index < bins; index++) {
    const hz = index * resolutionHz;
    const [real, imaginary] = convertFrequencyQuantity(spectrum.real[index], spectrum.imaginary[index], hz,
      record.sourceQuantity, settings.quantity);
    const value = frequencyLineAmplitude(Math.hypot(real, imaginary), index, count, spectrum.coherentGain, settings.amplitude) * scale;
    if (!Number.isFinite(value)) { throw new Error('Spectrum conversion exceeded numerical range.'); }
    frequency[index] = hz * axis.scale;
    values[index] = value;
    min = Math.min(min, value);
    if (value > max) { max = value; peakFrequency = frequency[index]; }
  }
  return { frequency, values, quantity: settings.quantity, unit, amplitudeMode: settings.amplitude,
    axisUnit: axis.unit, sampleCount: count, sampleRate: record.sampleRate, resolutionHz,
    nyquistHz: record.sampleRate / 2, min, max, peakFrequency,
    notices: [...record.notices,
      ...(settings.quantity !== record.sourceQuantity ? ['DC is zero for quantity conversion; integration constants are unavailable.'] : []),
      ...(window === 'hann' ? ['Periodic Hann with coherent-gain correction: line amplitudes, not PSD or broadband RMS.'] : []),
      ...(axis.unit === 'Order' ? ['Constant reference RPM only; this is not variable-speed order tracking.'] : [])] };
}
