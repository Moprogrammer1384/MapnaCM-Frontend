import { assetTaxonomyFixture } from 'src/app/shared/components/asset-taxonomy-drawer/testing/asset-taxonomy-fixture';
import { buildAssetTaxonomyTree, flattenAssetTaxonomyTree } from './asset-taxonomy-tree';

describe('buildAssetTaxonomyTree', () => {
  it('joins every level by numeric ID and keeps zero IDs', () => {
    const nodes = buildAssetTaxonomyTree(assetTaxonomyFixture(), 0);
    expect(nodes.map(node => node.data.id)).toEqual([0, 10]);
    expect(nodes[0].children[0].children[0].children[0].children[0].key).toBe('Measurement:0');
    const leaves = flattenAssetTaxonomyTree(nodes).filter(node => node.selectable);
    expect(leaves.map(node => [node.data.id, node.data.unitId, node.data.assetId])).toEqual([[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 3], [10, 10, 10]]);
    expect(leaves[0].data).not.toEqual(jasmine.objectContaining({ unit: jasmine.anything() }));
  });

  it('excludes another plant, undefined IDs and broken ancestor chains', () => {
    const snapshot = assetTaxonomyFixture();
    snapshot.units.push({ name: 'Unsaved', plantId: 0 });
    snapshot.systems.push({ id: 99, name: 'Orphan system', unitId: null });
    snapshot.assets.push({ id: 99, name: 'Orphan asset', systemId: 99 });
    snapshot.components.push({ id: 99, name: 'Orphan component', assetId: 99 });
    snapshot.measurements.push({ id: 99, name: 'Orphan', componentId: 99, sensitivity: null });
    const nodes = flattenAssetTaxonomyTree(buildAssetTaxonomyTree(snapshot, 0));
    expect(nodes.some(node => node.data.id === 80 || node.data.id === 99)).toBeFalse();
    expect(buildAssetTaxonomyTree(snapshot, 1234)).toEqual([]);
  });

  it('does not mutate API data and namespaces keys across entity levels', () => {
    const snapshot = assetTaxonomyFixture();
    const before = JSON.stringify(snapshot);
    const nodes = flattenAssetTaxonomyTree(buildAssetTaxonomyTree(snapshot, 0));
    expect(new Set(nodes.map(node => node.key)).size).toBe(nodes.length);
    expect(JSON.stringify(snapshot)).toBe(before);
    expect(nodes.filter(node => node.data.kind !== 'Measurement').every(node => node.selectable === false)).toBeTrue();
  });

  it('does not carry retired type/unit metadata into tree nodes or executed snapshots', () => {
    const snapshot = assetTaxonomyFixture();
    Object.assign(snapshot.measurements[0], { measurementTypeId: 9, typeName: 'Retired type', unit: 'mm/s' });
    const leaf = flattenAssetTaxonomyTree(buildAssetTaxonomyTree(snapshot, 0)).find(node => node.key === 'Measurement:0')!;
    expect(leaf.label).toBe('Velocity X');
    for (const field of ['measurementTypeId', 'typeName', 'unit']) { expect(field in leaf.data).toBeFalse(); }
  });
});
