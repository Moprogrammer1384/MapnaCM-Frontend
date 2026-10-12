export const VIBRATION_PAGES = {
  overview: 'Overview',
  'time-domain': 'Time domain',
  'frequency-domain': 'Frequency domain',
  'bode-analysis': 'Bode analysis',
  'rotor-position': 'Rotor position',
} as const;

export type VibrationPage = keyof typeof VIBRATION_PAGES;
