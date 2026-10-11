import type { AssetTaxonomySnapshot } from 'src/app/core/models/asset-taxonomy-selection.model';

export function assetTaxonomyFixture(): AssetTaxonomySnapshot {
  return {
    plants: [
      { id: 0, name: 'First plant', hierarchyLabel: 'Tehran - Gas - First plant', siteId: null, plantTypeId: null },
      { id: 8, name: 'Second plant', siteId: null, plantTypeId: null },
    ],
    units: [{ id: 0, name: 'Unit zero', plantId: 0 }, { id: 10, name: 'Unit ten', plantId: 0 }, { id: 80, name: 'Unit eighty', plantId: 8 }],
    systems: [{ id: 0, name: 'System zero', unitId: 0 }, { id: 10, name: 'System ten', unitId: 10 }, { id: 80, name: 'System eighty', unitId: 80 }],
    assets: [{ id: 0, name: 'Asset zero', systemId: 0 }, { id: 10, name: 'Asset ten', systemId: 10 }, { id: 80, name: 'Asset eighty', systemId: 80 }],
    components: [
      { id: 0, name: 'Bearing A', assetId: 0 }, { id: 1, name: 'Bearing B', assetId: 0 },
      { id: 10, name: 'Bearing C', assetId: 10 }, { id: 80, name: 'Bearing D', assetId: 80 },
    ],
    measurements: [
      { id: 0, name: 'Velocity X', tag: 'ZERO', unit: 'mm/s', componentId: 0, sensitivity: 10, measurementTypeId: 1 },
      { id: 1, name: 'Velocity Y', tag: 'ONE', componentId: 0, sensitivity: 10, measurementTypeId: 1 },
      { id: 2, name: 'Displacement X', tag: 'TWO', componentId: 1, sensitivity: 10, measurementTypeId: 2 },
      { id: 10, name: 'Other Unit velocity', componentId: 10, sensitivity: 10, measurementTypeId: 1 },
      { id: 80, name: 'Other plant velocity', componentId: 80, sensitivity: 10, measurementTypeId: 1 },
    ],
  };
}
