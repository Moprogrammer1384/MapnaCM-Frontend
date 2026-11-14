import { AnalysisChartSettings } from './analysis-chart-settings.model';
import { RawVibrationRecord } from './vibration-data.model';
import { FrequencyDomainAnalysis } from './frequency-domain.model';

/** Frontend models only; these do not define a backend API contract. */
export interface WaterfallSettings extends AnalysisChartSettings {
  readonly xAxis: 'hz' | 'cpm';
  readonly depthAxis: 'time' | 'rpm';
  readonly view: 'waterfall' | 'map';
}

export const DEFAULT_WATERFALL_SETTINGS: WaterfallSettings = {
  quantity: 'velocity', unit: 'mm/s', amplitude: 'rms', xAxis: 'hz', window: 'hann',
  depthAxis: 'time', view: 'waterfall',
};

export type WaterfallEventType = 'SteadyState' | 'Startup' | 'CoastDown' | 'Trip';

/** One recorded acquisition, identified independently of its date/type. Tehran wall clock. */
export interface WaterfallEvent {
  readonly id: string;
  readonly eventType: WaterfallEventType;
  readonly from: string;
  readonly to: string;
}

export interface WaterfallRequest {
  readonly measurementId: number;
  readonly eventId: string;
}

export interface WaterfallFrame {
  readonly elapsedSeconds: number;
  readonly rpm: number;
  readonly raw: RawVibrationRecord;
}

export interface WaterfallCapture {
  readonly event: WaterfallEvent;
  readonly startedAt: string;
  readonly frames: readonly WaterfallFrame[];
  readonly source: 'mock';
}

export interface WaterfallSpectrum extends FrequencyDomainAnalysis {
  readonly elapsedSeconds: number;
  readonly rpm: number;
}
