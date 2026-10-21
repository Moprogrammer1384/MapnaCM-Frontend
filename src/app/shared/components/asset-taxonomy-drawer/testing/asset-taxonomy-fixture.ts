import type { AssetTaxonomySnapshot } from 'src/app/core/models/asset-taxonomy-selection.model';

export function assetTaxonomyFixture(): AssetTaxonomySnapshot {
  return {
    plants: [
      { id: 0, name: 'First plant', siteId: 0, plantTypeId: 0, hierarchyLabel: 'Site zero - Gas turbine - First plant' },
      { id: 8, name: 'Second plant', siteId: 0, plantTypeId: 0, hierarchyLabel: 'Site zero - Gas turbine - Second plant' },
    ],
    units: [
      { id: 0, name: 'Unit zero', plantId: 0 },
      { id: 10, name: 'Other Unit', plantId: 0 },
      { id: 80, name: 'Other plant Unit', plantId: 8 },
    ],
    systems: [
      { id: 0, name: 'System zero', unitId: 0 },
      { id: 10, name: 'Other system', unitId: 10 },
      { id: 80, name: 'Other plant system', unitId: 80 },
    ],
    assets: [
      { id: 0, name: 'Asset zero', tag: 'ASSET-0', systemId: 0 },
      { id: 3, name: 'Another asset in same Unit', systemId: 0 },
      { id: 10, name: 'Other asset', systemId: 10 },
      { id: 80, name: 'Other plant asset', systemId: 80 },
    ],
    components: [
      { id: 0, name: 'Bearing A', tag: 'COMP-0', assetId: 0 },
      { id: 2, name: 'Bearing B', assetId: 0 },
      { id: 3, name: 'Another asset bearing', assetId: 3 },
      { id: 10, name: 'Other bearing', assetId: 10 },
      { id: 80, name: 'Other plant bearing', assetId: 80 },
    ],
    measurements: [
      { id: 0, name: 'Velocity X', tag: 'VEL-X', componentId: 0, sensitivity: 100 },
      { id: 1, name: 'Velocity Y', tag: 'VEL-Y', componentId: 0, sensitivity: 100 },
      { id: 2, name: 'Displacement X', componentId: 2, sensitivity: 0 },
      { id: 10, name: 'Other Unit velocity', componentId: 10, sensitivity: null },
      { id: 3, name: 'Another asset velocity', componentId: 3, sensitivity: null },
      { id: 80, name: 'Other plant velocity', componentId: 80, sensitivity: null },
    ],
  };
}
