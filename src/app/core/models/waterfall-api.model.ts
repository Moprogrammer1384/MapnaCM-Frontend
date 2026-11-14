export interface WaterfallEventDto {
  readonly acquisitionEventId: number | string;
  readonly eventType: string;
  readonly startedAtUtc: string;
  readonly endedAtUtc: string;
  readonly hasSpeed: boolean;
}
export interface WaterfallAvailabilityDto {
  readonly timeZone: string;
  readonly events: readonly WaterfallEventDto[];
}
export interface WaterfallRecordDto extends Omit<WaterfallEventDto, 'hasSpeed'> {
  readonly id: number | string;
  readonly measurementId: number;
  readonly quantity: number;
  readonly unit: number;
  readonly sampleRateHz: number;
  readonly samplesPerFrame: number;
  readonly frameCount: number;
  readonly originalSampleCount: number;
  readonly frames: readonly {
    acquisitionSampleIndex: number; sampledAtUtc: string; speedRpm: number | null; values: readonly number[];
  }[];
}
