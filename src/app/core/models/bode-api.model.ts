export interface BodeChartDto {
  readonly measurementId: number;
  readonly runs: readonly {
    readonly id: number;
    readonly eventType: 'Startup' | 'CoastDown' | 'Trip' | 'LoadChange';
    readonly startedAtUtc: string;
    readonly endedAtUtc: string;
    readonly quantity: number;
    readonly unit: number;
    readonly order: number;
    readonly originalSampleCount: number;
    readonly points: readonly {
      readonly sampledAtUtc: string;
      readonly speedRpm: number;
      readonly amplitudeRms: number;
      readonly phaseDegrees: number;
    }[];
  }[];
}
