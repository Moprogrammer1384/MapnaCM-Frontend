/** User-defined vibration signal palette; surrounding UI retains Metronic tokens. */
export const VIBRATION_CHART_COLORS = ['#2563EB', '#EA580C'] as const;
export const VIBRATION_PEAK_TO_PEAK_COLOR = '#0D9488';

export function vibrationChartColor(index = 0): string {
  return VIBRATION_CHART_COLORS[Math.abs(Math.trunc(index)) % VIBRATION_CHART_COLORS.length];
}
