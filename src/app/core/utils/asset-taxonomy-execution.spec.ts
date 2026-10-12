import { assetTaxonomyFixture } from 'src/app/shared/components/asset-taxonomy-drawer/testing/asset-taxonomy-fixture';
import { buildAssetTaxonomyExecution } from './asset-taxonomy-execution';

describe('buildAssetTaxonomyExecution', () => {
  it('captures the Plant label separately and resolves Measurement details by IDs without joined labels', () => {
    const data = assetTaxonomyFixture();
    data.measurements[0].componentLabel = 'Secret plant / Unit zero';
    const result = buildAssetTaxonomyExecution(data, { plantId: 0, unitId: 0, measurementIds: [0, 2, 0] })!;
    expect(result.plantLabel).toBe('Site zero - Gas turbine - First plant');
    expect(result.selection.measurementIds).toEqual([0, 2]);
    expect(result.measurements[0]).toEqual({
      measurement: { id: 0, name: 'Velocity X', tag: 'VEL-X' },
      component: { id: 0, name: 'Bearing A', tag: 'COMP-0' },
      asset: { id: 0, name: 'Asset zero', tag: 'ASSET-0' },
      system: { id: 0, name: 'System zero', tag: null },
      unit: { id: 0, name: 'Unit zero', tag: null },
      typeName: 'Velocity', measurementUnit: 'mm/s', sensitivity: 100,
    });
    expect(result.measurements[1].sensitivity).toBe(0);
    expect(JSON.stringify(result.measurements)).not.toContain('plant');
    data.assets[0].name = 'Renamed';
    data.plants[0].hierarchyLabel = 'Changed site - Changed type - Changed plant';
    expect(result.measurements[0].asset.name).toBe('Asset zero');
    expect(result.plantLabel).toBe('Site zero - Gas turbine - First plant');
  });

  it('uses the Plant name if its joined display label is missing or blank', () => {
    const data = assetTaxonomyFixture();
    for (const label of [undefined, '   ']) {
      data.plants[0].hierarchyLabel = label;
      expect(buildAssetTaxonomyExecution(data, { plantId: 0, unitId: 0, measurementIds: [0] })!.plantLabel).toBe('First plant');
    }
  });

  it('rejects empty, missing, reparented and cross-Asset selections including assets in the same Unit', () => {
    const data = assetTaxonomyFixture();
    for (const ids of [[], [999], [0, 3], [0, 10], [80]]) {
      expect(buildAssetTaxonomyExecution(data, { plantId: 0, unitId: 0, measurementIds: ids })).toBeNull();
    }
    data.components[0].assetId = null;
    expect(buildAssetTaxonomyExecution(data, { plantId: 0, unitId: 0, measurementIds: [0] })).toBeNull();
  });
});
