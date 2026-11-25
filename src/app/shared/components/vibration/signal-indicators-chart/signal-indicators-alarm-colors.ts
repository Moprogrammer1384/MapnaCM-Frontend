import { SignalIndicatorAlarmRange } from 'src/app/core/models/vibration/signal-indicators/signal-indicators.model';
import { signalIndicatorAlarmLevel } from 'src/app/core/services/vibration/signal-indicators/signal-indicators-alarms';

export interface SignalIndicatorAlarmPalette { readonly normal: string; readonly yellow: string; readonly orange: string; readonly red: string; }
export function signalIndicatorAlarmColor(value: number, range: SignalIndicatorAlarmRange, palette: SignalIndicatorAlarmPalette): string {
  return palette[signalIndicatorAlarmLevel(value, range)];
}
