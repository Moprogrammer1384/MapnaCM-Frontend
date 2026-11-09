/** User-defined vibration signal palette; surrounding UI retains Metronic tokens. */
export const VIBRATION_CHART_COLORS = ['#2563EB', '#EA580C'] as const;

export function vibrationChartColor(index = 0): string {
  return VIBRATION_CHART_COLORS[Math.abs(Math.trunc(index)) % VIBRATION_CHART_COLORS.length];
}
