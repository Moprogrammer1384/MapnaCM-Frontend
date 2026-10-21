export type AnalysisDomain = 'time' | 'frequency';
export type VibrationQuantity = 'displacement' | 'velocity' | 'acceleration';
export type AnalysisXAxis = 'time' | 'hz' | 'cpm' | 'order';
export type AmplitudeMode = 'rms' | '0p' | 'pp';
export type VibrationUnit = 'µm' | 'mm' | 'mil' | 'in' | 'mm/s' | 'cm/s' | 'm/s' | 'in/s'
  | 'm/s²' | 'mm/s²' | 'g' | 'in/s²';

export interface VibrationUnitOption {
  readonly value: VibrationUnit;
  /** Multiplier from the quantity's default sample unit to this display unit. */
  readonly scale: number;
}

/** Frontend display choices, kept independently for each analysis tab. */
export interface AnalysisChartSettings {
  readonly quantity: VibrationQuantity;
  readonly unit?: VibrationUnit;
  readonly xAxis: AnalysisXAxis;
  readonly amplitude: AmplitudeMode;
  /** Constant reference speed for frequency-axis Order; never inferred from a spectrum peak. */
  readonly referenceRpm?: number;
  readonly window?: 'rectangular' | 'hann';
}

export function defaultChartSettings(domain: AnalysisDomain = 'time'): AnalysisChartSettings {
  return { quantity: 'velocity', unit: 'mm/s', xAxis: domain === 'frequency' ? 'hz' : 'time', amplitude: '0p' };
}

export const VIBRATION_QUANTITIES: Record<VibrationQuantity, { label: string; unit: string }> = {
  displacement: { label: 'Displacement', unit: 'µm' },
  velocity: { label: 'Velocity', unit: 'mm/s' },
  acceleration: { label: 'Acceleration', unit: 'm/s²' },
};

/** Defaults first. Exact conversions: 1 in = 25.4 mm; 1 mil = 0.001 in; 1 g = 9.80665 m/s². */
export const VIBRATION_UNITS: Record<VibrationQuantity, readonly VibrationUnitOption[]> = {
  displacement: [
    { value: 'µm', scale: 1 }, { value: 'mm', scale: 1 / 1000 },
    { value: 'mil', scale: 1 / 25.4 }, { value: 'in', scale: 1 / 25400 },
  ],
  velocity: [
    { value: 'mm/s', scale: 1 }, { value: 'cm/s', scale: 1 / 10 },
    { value: 'm/s', scale: 1 / 1000 }, { value: 'in/s', scale: 1 / 25.4 },
  ],
  acceleration: [
    { value: 'm/s²', scale: 1 }, { value: 'mm/s²', scale: 1000 },
    { value: 'g', scale: 1 / 9.80665 }, { value: 'in/s²', scale: 1 / 0.0254 },
  ],
};

/** Older settings without units, or units from another quantity, use the quantity default. */
export function vibrationUnit(settings: AnalysisChartSettings): VibrationUnitOption {
  const options = VIBRATION_UNITS[settings.quantity];
  return options.find(option => option.value === settings.unit) ?? options[0];
}

export const AMPLITUDE_LABELS: Record<AmplitudeMode, string> = { rms: 'RMS', '0p': '0p', pp: 'pp' };

/** Synthetic reference speed only; not the selected asset's operating speed. */
export const SAMPLE_REFERENCE_HZ = 10;
