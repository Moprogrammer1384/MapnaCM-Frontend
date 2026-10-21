import type {
  AssetTaxonomyExecution, AssetTaxonomySelection, AssetTaxonomySnapshot,
  SelectedMeasurementDetails, TaxonomyEntitySummary,
} from '../models/asset-taxonomy-selection.model';

function indexById<T extends { id?: number }>(rows: readonly T[]): Map<number, T & { id: number }> {
  return new Map(rows.filter((row): row is T & { id: number } => row.id !== undefined).map(row => [row.id, row]));
}

function summary(row: { id: number; name: string; tag?: string | null }): TaxonomyEntitySummary {
  return { id: row.id, name: row.name, tag: row.tag ?? null };
}

/** Resolve Measurement chains by IDs and retain the selected Plant's display label. */
export function buildAssetTaxonomyExecution(
  snapshot: AssetTaxonomySnapshot, selection: AssetTaxonomySelection
): AssetTaxonomyExecution | null {
  const plant = snapshot.plants.find(plant => plant.id === selection.plantId);
  if (!plant) { return null; }
  const measurements = indexById(snapshot.measurements);
  const components = indexById(snapshot.components);
  const assets = indexById(snapshot.assets);
  const systems = indexById(snapshot.systems);
  const units = indexById(snapshot.units);
  const ids = [...new Set(selection.measurementIds)];
  const details: SelectedMeasurementDetails[] = [];
  for (const id of ids) {
    const measurement = measurements.get(id);
    const component = measurement?.componentId == null ? undefined : components.get(measurement.componentId);
    const asset = component?.assetId == null ? undefined : assets.get(component.assetId);
    const system = asset?.systemId == null ? undefined : systems.get(asset.systemId);
    const unit = system?.unitId == null ? undefined : units.get(system.unitId);
    if (!measurement || !component || !asset || !system || !unit ||
      unit.id !== selection.unitId || unit.plantId !== selection.plantId ||
      (details.length > 0 && asset.id !== details[0].asset.id)) {
      return null;
    }
    details.push({
      measurement: summary(measurement), component: summary(component), asset: summary(asset),
      system: summary(system), unit: summary(unit),
      sensitivity: measurement.sensitivity,
    });
  }
  return details.length ? {
    selection: { ...selection, measurementIds: ids }, measurements: details,
    plantLabel: plant.hierarchyLabel?.trim() || plant.name,
  } : null;
}
