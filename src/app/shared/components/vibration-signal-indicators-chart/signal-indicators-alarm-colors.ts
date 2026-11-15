import { color as echartsColor } from 'echarts';
import { SignalIndicatorAlarmRange } from 'src/app/core/models/signal-indicators.model';
import { signalIndicatorAlarmExceedance } from 'src/app/core/services/vibration/signal-indicators/signal-indicators-alarms';

export interface SignalIndicatorAlarmPalette { readonly normal: string; readonly yellow: string; readonly orange: string; readonly red: string; }

export function signalIndicatorAlarmColor(value: number, range: SignalIndicatorAlarmRange, palette: SignalIndicatorAlarmPalette): string {
  const exceeded = signalIndicatorAlarmExceedance(value, range);
  if (!(exceeded > 0)) { return palette.normal; }
  if (exceeded >= 0.25) { return palette.red; }
  return exceeded <= 0.1
    ? echartsColor.lerp(exceeded / 0.1, [palette.yellow, palette.orange])!
    : echartsColor.lerp((exceeded - 0.1) / 0.15, [palette.orange, palette.red])!;
}

/** A y-aligned line gradient colours the actual crossing segments without changing any observed sample. */
export function signalIndicatorAlarmLineColor(values: readonly number[], range: SignalIndicatorAlarmRange, palette: SignalIndicatorAlarmPalette) {
  const min = Math.min(...values), max = Math.max(...values);
  if (min === max || min >= range.lower && max <= range.upper) { return signalIndicatorAlarmColor(max, range, palette); }
  const span = range.upper - range.lower;
  const stops = [
    { value: max, color: signalIndicatorAlarmColor(max, range, palette) },
    { value: range.upper + span * 0.25, color: palette.red },
    { value: range.upper + span * 0.1, color: palette.orange },
    { value: range.upper, color: palette.yellow }, { value: range.upper, color: palette.normal },
    { value: range.lower, color: palette.normal }, { value: range.lower, color: palette.yellow },
    { value: range.lower - span * 0.1, color: palette.orange },
    { value: range.lower - span * 0.25, color: palette.red },
    { value: min, color: signalIndicatorAlarmColor(min, range, palette) },
  ].filter(stop => stop.value >= min && stop.value <= max).sort((a, b) => b.value - a.value);
  return { type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1, global: false,
    colorStops: stops.map(stop => ({ offset: (max - stop.value) / (max - min), color: stop.color })) };
}
