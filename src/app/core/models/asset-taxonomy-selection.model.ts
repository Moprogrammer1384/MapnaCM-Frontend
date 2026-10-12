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

/** Entity display snapshot for an executed Measurement selection. */
export interface TaxonomyEntitySummary {
  readonly id: number;
  readonly name: string;
  readonly tag: string | null;
}

export interface SelectedMeasurementDetails {
  readonly measurement: TaxonomyEntitySummary;
  readonly component: TaxonomyEntitySummary;
  readonly asset: TaxonomyEntitySummary;
  readonly system: TaxonomyEntitySummary;
  readonly unit: TaxonomyEntitySummary;
  readonly typeName: string | null;
  readonly measurementUnit: string | null;
  readonly sensitivity: number | null;
}

export interface AssetTaxonomyExecution {
  readonly selection: AssetTaxonomySelection;
  readonly measurements: readonly SelectedMeasurementDetails[];
  /** Selected Plant's Site - Plant Type - Plant label, captured when executed. */
  readonly plantLabel?: string;
}

export type TaxonomyNodeKind = 'Unit' | 'System' | 'Asset' | 'Component' | 'Measurement';

export interface TaxonomyNodeData {
  id: number;
  unitId: number;
  assetId: number | null;
  kind: TaxonomyNodeKind;
  tag?: string | null;
  unit?: string | null;
}

export interface AssetTaxonomyNode extends TreeNode<TaxonomyNodeData> {
  data: TaxonomyNodeData;
  children: AssetTaxonomyNode[];
}
