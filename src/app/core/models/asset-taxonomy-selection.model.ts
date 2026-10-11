import type { TreeNode } from 'primeng/api';
import type { Asset, AssetSystem, Component, Measurement, Plant, Unit } from './asset-taxonomy.model';

export interface AssetTaxonomySnapshot {
  plants: Plant[];
  units: Unit[];
  systems: AssetSystem[];
  assets: Asset[];
  components: Component[];
  measurements: Measurement[];
}

/** Saved by the consuming feature; the reusable drawer does not own persistence. */
export interface AssetTaxonomySelection {
  readonly plantId: number;
  readonly unitId: number;
  readonly measurementIds: readonly number[];
}

export type TaxonomyNodeKind = 'Unit' | 'System' | 'Asset' | 'Component' | 'Measurement';

export interface TaxonomyNodeData {
  id: number;
  unitId: number;
  kind: TaxonomyNodeKind;
  tag?: string | null;
  unit?: string | null;
}

export interface AssetTaxonomyNode extends TreeNode<TaxonomyNodeData> {
  data: TaxonomyNodeData;
  children: AssetTaxonomyNode[];
}
