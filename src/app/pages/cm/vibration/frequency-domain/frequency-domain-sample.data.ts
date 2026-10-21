import { AnalysisChartSettings, AnalysisXAxis, defaultChartSettings, SAMPLE_REFERENCE_HZ, vibrationUnit } from 'src/app/core/models/analysis-chart-settings.model';
import { amplitudeScale, harmonicPeak } from 'src/app/shared/components/analysis-workspace-panel/vibration-sample.data';

export function frequencyAxis(axis: AnalysisXAxis): { unit: string; scale: number } {
  return axis === 'cpm' ? { unit: 'CPM', scale: 60 }
    : axis === 'order' ? { unit: 'Order', scale: 1 / SAMPLE_REFERENCE_HZ } : { unit: 'Hz', scale: 1 };
}

/** Synthetic one-sided spectrum of the existing 10 Hz + 25 Hz sample.
 * A two-second signal sampled at 250 Hz has 0.5 Hz bins through 125 Hz.
 * These ideal amplitudes are sample data, not FFT results from selected Measurements.
 */
export function createFrequencyDomainSampleData(settings: AnalysisChartSettings = defaultChartSettings('frequency')): [number, number][] {
  const axis = frequencyAxis(settings.xAxis);
  const unitScale = vibrationUnit(settings).scale;
  return Array.from({ length: 251 }, (_, index) => {
    const hz = index / 2;
    const velocityPeak = index === 20 ? 2 : index === 50 ? 1 : 0;
    const value = velocityPeak === 0 ? 0 : harmonicPeak(hz, velocityPeak, settings.quantity) * amplitudeScale(settings.amplitude);
    return [hz * axis.scale, value * unitScale];
  });
}
