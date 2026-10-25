import { VibrationQuantity, VibrationUnit } from './analysis-chart-settings.model';
import { TimeDomainStatistics } from './vibration-data.model';

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
  readonly statistics: Omit<TimeDomainStatistics, 'peakToPeak'> & { readonly peakToPeak: number | null };
}

/** An envelope or discontinuous display record must not enter either numerical worker. */
export interface VibrationDisplayRecord {
  readonly kind: 'display';
  readonly quantity: VibrationQuantity;
  readonly unit: VibrationUnit;
  readonly series: VibrationChartSeriesDto;
}

