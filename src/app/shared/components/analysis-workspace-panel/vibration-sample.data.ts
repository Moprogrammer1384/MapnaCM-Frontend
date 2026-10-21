import { AmplitudeMode, AnalysisChartSettings, VibrationQuantity, vibrationUnit } from 'src/app/core/models/analysis-chart-settings.model';

/** Two ideal harmonics of a synthetic velocity signal, not measurement/API data. */
const HARMONICS = [{ hz: 10, velocityPeak: 2 }, { hz: 25, velocityPeak: 1 }];

export function amplitudeScale(mode: AmplitudeMode): number {
  return mode === 'rms' ? 1 / Math.sqrt(2) : mode === 'pp' ? 2 : 1;
}

export function harmonicPeak(hz: number, velocityPeak: number, quantity: VibrationQuantity): number {
  const omega = 2 * Math.PI * hz;
  return quantity === 'displacement' ? velocityPeak * 1000 / omega
    : quantity === 'acceleration' ? velocityPeak * omega / 1000 : velocityPeak;
}

/** RMS/pp display conventions apply to each harmonic, rather than a waveform statistic. */
export function createTimeDomainSampleData(settings: AnalysisChartSettings): [number, number][] {
  const unitScale = vibrationUnit(settings).scale;
  return Array.from({ length: 501 }, (_, index) => {
    const time = index / 250;
    const value = HARMONICS.reduce((sum, harmonic) => {
      const phase = 2 * Math.PI * harmonic.hz * time;
      const wave = settings.quantity === 'displacement' ? -Math.cos(phase)
        : settings.quantity === 'acceleration' ? Math.cos(phase) : Math.sin(phase);
      return sum + harmonicPeak(harmonic.hz, harmonic.velocityPeak, settings.quantity) * wave;
    }, 0);
    return [time, value * amplitudeScale(settings.amplitude) * unitScale];
  });
}
