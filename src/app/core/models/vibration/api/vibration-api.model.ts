import { VibrationQuantity, VibrationUnit } from '../analysis-chart-settings.model';
import { TimeDomainStatistics } from '../time-domain/vibration-data.model';

export interface VibrationChartDto {
  readonly timeOriginUtc: string;
  readonly timeUnit: 's';
  readonly series: readonly VibrationChartSeriesDto[];
}

export interface VibrationChartSeriesDto {
  readonly measurementId: number;
  readonly sourceQuantity: number;
  readonly quantity: number;
  readonly unit: number;
  readonly originalSampleCount: number;
  readonly returnedPointCount: number;
  readonly representation: 'raw' | 'minmax-statistical-envelope';
  readonly conversionApplied: boolean;
  readonly hasGaps: boolean;
  readonly isFftInput: boolean;
  readonly points: readonly { readonly x: number; readonly y: number; readonly breakBefore: boolean }[];
  /** Existing Time Domain response buckets; absent on older hosts and raw responses. */
  readonly buckets?: readonly VibrationChartBucketDto[];
  readonly statistics: Omit<TimeDomainStatistics, 'peakToPeak'> & { readonly peakToPeak: number | null };
}

export interface VibrationChartBucketDto {
  readonly fromX: number;
  readonly toX: number;
  readonly minAtX: number;
  readonly maxAtX: number;
  readonly containsGaps: boolean;
  readonly statistics: VibrationChartSeriesDto['statistics'] & { readonly sampleCount: number };
}

/** An envelope or discontinuous display record must not enter either numerical worker. */
export interface VibrationDisplayRecord {
  readonly kind: 'display';
  readonly quantity: VibrationQuantity;
  readonly unit: VibrationUnit;
  /** Native response origin, retained for the selected acquisition interval. */
  readonly timeOriginUtc?: string;
  readonly series: VibrationChartSeriesDto;
}

