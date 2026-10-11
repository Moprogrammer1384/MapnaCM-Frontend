import type { AssetTaxonomyNode, AssetTaxonomySnapshot, TaxonomyNodeKind } from '../models/asset-taxonomy-selection.model';

type NamedRecord = { id?: number; name: string; tag?: string | null; unit?: string | null };

function createNode(row: NamedRecord & { id: number }, kind: TaxonomyNodeKind, unitId: number): AssetTaxonomyNode {
  return {
    key: `${kind}:${row.id}`,
    label: row.name,
    data: { id: row.id, unitId, kind, tag: row.tag, unit: row.unit },
    children: [],
    selectable: kind === 'Measurement',
    expanded: kind === 'Unit',
  };
}

/** Attach only records whose complete parent chain belongs to the selected plant. */
function addLevel<T extends NamedRecord>(
  rows: readonly T[], parentId: (row: T) => number | null,
  kind: TaxonomyNodeKind, parents: ReadonlyMap<number, AssetTaxonomyNode>
): Map<number, AssetTaxonomyNode> {
  const nodes = new Map<number, AssetTaxonomyNode>();
  for (const row of rows) {
    const id = parentId(row);
    const parent = id === null ? undefined : parents.get(id);
    if (row.id === undefined || !parent || nodes.has(row.id)) {
      continue;
    }
    const node = createNode({ ...row, id: row.id }, kind, parent.data.unitId);
    parent.children.push(node);
    nodes.set(row.id, node);
  }
  return nodes;
}

export function buildAssetTaxonomyTree(snapshot: AssetTaxonomySnapshot, plantId: number): AssetTaxonomyNode[] {
  const units = new Map<number, AssetTaxonomyNode>();
  for (const unit of snapshot.units) {
    if (unit.id !== undefined && unit.plantId === plantId && !units.has(unit.id)) {
      units.set(unit.id, createNode({ ...unit, id: unit.id }, 'Unit', unit.id));
    }
  }
  const systems = addLevel(snapshot.systems, row => row.unitId, 'System', units);
  const assets = addLevel(snapshot.assets, row => row.systemId, 'Asset', systems);
  const components = addLevel(snapshot.components, row => row.assetId, 'Component', assets);
  addLevel(snapshot.measurements, row => row.componentId, 'Measurement', components);
  return Array.from(units.values());
}

export function flattenAssetTaxonomyTree(nodes: readonly AssetTaxonomyNode[]): AssetTaxonomyNode[] {
  const result: AssetTaxonomyNode[] = [];
  for (const node of nodes) {
    result.push(node, ...flattenAssetTaxonomyTree(node.children));
  }
  return result;
}
