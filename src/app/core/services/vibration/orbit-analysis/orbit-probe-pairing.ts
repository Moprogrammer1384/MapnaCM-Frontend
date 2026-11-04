import { AssetTaxonomyExecution } from 'src/app/core/models/asset-taxonomy-selection.model';
import { OrbitProbePair } from 'src/app/core/models/orbit-analysis.model';

/** A distinct synchronized X/Y pair per bearing, within one asset. */
export function resolveOrbitProbePairs(execution: AssetTaxonomyExecution | null): { pairs: OrbitProbePair[]; error: string } {
  const pairs: OrbitProbePair[] = [];
  const items = execution?.measurements ?? [];
  let error = items.length ? '' : 'Select both X and Y displacement measurements for each bearing.';
  const first = items[0];
  if (items.some(item => item.asset.id !== first.asset.id || item.unit.id !== first.unit.id)) { error = 'All probe pairs must belong to the same asset.'; }
  for (const componentId of new Set(items.map(item => item.component.id))) {
    const measurements = items.filter(item => item.component.id === componentId);
    const probe = (axis: string) => {
      const matches = measurements.filter(item => new RegExp(`(?:^|[\\s_/-])${axis}(?:$|[\\s_/-])`, 'i').test(item.measurement.name));
      return matches.length === 1 ? matches[0] : undefined;
    };
    const x = probe('X'), y = probe('Y');
    if (measurements.length !== 2 || !x || !y || x.measurement.id === y.measurement.id) {
      error ||= 'Select exactly one X and one Y displacement measurement per bearing.';
    } else { pairs.push({ key: `c${componentId}_x${x.measurement.id}_y${y.measurement.id}`, x, y }); }
  }
  return { pairs: error ? [] : pairs, error };
}
