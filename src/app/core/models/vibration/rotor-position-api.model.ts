export interface RotorPositionEventDto {
  readonly operatingRunId: number | string;
  readonly eventType: 'Startup' | 'CoastDown' | 'Trip';
  readonly startedAtUtc: string;
  readonly endedAtUtc: string;
}
export interface RotorPositionAvailabilityDto {
  readonly timeZone: string;
  readonly events: readonly RotorPositionEventDto[];
}
export interface RotorPositionRecordDto extends RotorPositionEventDto {
  readonly id: number | string;
  readonly xMeasurementId: number;
  readonly yMeasurementId: number;
  readonly unit: number;
  readonly originalSampleCount: number;
  readonly dcPreserved: boolean;
  readonly synchronized: boolean;
  readonly meanWindowSeconds: number;
  readonly probeAnglesDegrees: readonly [number, number];
  readonly reference: { readonly probeMean: readonly [number, number]; readonly position: readonly [number, number]; readonly bearingCentreKnown: boolean };
  readonly clearance: { readonly radialX: number; readonly radialY: number } | null;
  readonly observations: readonly {
    readonly timeSeconds: number;
    readonly meanProbeX: number | null;
    readonly meanProbeY: number | null;
    readonly speedRpm: number | null;
    readonly quality: 'valid' | 'invalid';
    readonly breakBefore: boolean;
  }[];
}
