import { VibrationQuantity, VibrationUnit } from '../../../models/analysis-chart-settings.model';
import { unitToSi } from '../time-domain/time-domain-unit-conversion';

/** Dimensional scale only; never differentiates/integrates time samples. */
export function spectrumUnitScale(quantity: VibrationQuantity, unit: VibrationUnit): number {
  return 1 / unitToSi(quantity, unit);
}
