import { AnalysisChartSettings } from './analysis-chart-settings.model';
import { RawVibrationRecord } from './vibration-data.model';
import { FrequencyDomainAnalysis } from './frequency-domain.model';

/** Display settings; native acquisition DTOs are defined in waterfall-api.model.ts. */
export interface WaterfallSettings extends AnalysisChartSettings {
  readonly xAxis: 'hz' | 'cpm';
  readonly depthAxis: 'time' | 'rpm';
  readonly view: 'waterfall' | 'map';
}

export const DEFAULT_WATERFALL_SETTINGS: WaterfallSettings = {
  quantity: 'velocity', unit: 'mm/s', amplitude: 'rms', xAxis: 'hz', window: 'hann',
  depthAxis: 'time', view: 'waterfall',
};

export type WaterfallEventType = 'SteadyState' | 'Startup' | 'CoastDown' | 'Trip' | 'LoadChange';

/** One recorded acquisition, identified independently of its date/type. Tehran wall clock. */
export interface WaterfallEvent {
  readonly id: string;
  readonly eventType: WaterfallEventType;
  readonly from: string;
  readonly to: string;
  readonly hasSpeed?: boolean;
}

export interface WaterfallRequest {
  readonly measurementId: number;
  readonly eventId: string;
}

export interface WaterfallFrame {
  readonly elapsedSeconds: number;
  readonly rpm: number | null;
  readonly raw: RawVibrationRecord;
}

export interface WaterfallCapture {
  readonly event: WaterfallEvent;
  readonly startedAt: string;
  readonly frames: readonly WaterfallFrame[];
}

export interface WaterfallSpectrum extends FrequencyDomainAnalysis {
  readonly elapsedSeconds: number;
  readonly rpm: number | null;
}
