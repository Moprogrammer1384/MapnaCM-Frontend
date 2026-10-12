import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { Tree, TreeModule } from 'primeng/tree';
import { forkJoin } from 'rxjs';
import { DrawerComponent, DrawerStore, defaultDrawerOptions } from 'src/app/_metronic/kt/components/_DrawerComponent';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AssetTaxonomyExecution, AssetTaxonomyNode, AssetTaxonomySelection, AssetTaxonomySnapshot, TaxonomyNodeData } from 'src/app/core/models/asset-taxonomy-selection.model';
import { TaxonomyParentOption } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { buildParentOptions } from 'src/app/core/utils/asset-taxonomy-hierarchy';
import { buildAssetTaxonomyExecution } from 'src/app/core/utils/asset-taxonomy-execution';
import { buildAssetTaxonomyTree, flattenAssetTaxonomyTree } from 'src/app/core/utils/asset-taxonomy-tree';
import { RequestState } from '../request-state/request-state';

/** Metronic drawer shell + documented PrimeNG Tree selection/templates. No feature storage. */
@Component({
  selector: 'app-asset-taxonomy-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, A11yModule, SharedModule, TreeModule],
  templateUrl: './asset-taxonomy-drawer.component.html',
})
export class AssetTaxonomyDrawerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() drawerId = 'kt_asset_taxonomy';
  @Input() visible = false;
  @Input() selection: AssetTaxonomySelection | null = null;
  @Output() readonly selectionSave = new EventEmitter<AssetTaxonomySelection | null>();
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly executed = new EventEmitter<AssetTaxonomyExecution>();
  @ViewChild('drawerElement', { static: true }) private element: ElementRef<HTMLElement>;
  @ViewChild(Tree) private tree?: Tree;

  readonly isOpen = signal(false);
  readonly requestState = new RequestState();
  plants: TaxonomyParentOption[] = [];
  plantId: number | null = null;
  nodes: AssetTaxonomyNode[] = [];
  selectedNodes: AssetTaxonomyNode[] = [];
  activeUnitId: number | null = null;
  activeAssetId: number | null = null;
  status = '';
  private snapshot?: AssetTaxonomySnapshot;
  private drawer?: DrawerComponent;
  private observer?: MutationObserver;
  private opener?: HTMLElement;

  constructor(private api: AssetApiService) {}

  ngAfterViewInit(): void {
    const element = this.element.nativeElement;
    this.drawer = DrawerComponent.getInstance(this.drawerId) ?? new DrawerComponent(element, { ...defaultDrawerOptions });
    // Keep Angular visibility in sync with Metronic overlay/script dismissal.
    this.observer = new MutationObserver(() => {
      if (this.isOpen() && !this.drawer!.isShown()) {
        this.close();
      }
    });
    this.observer.observe(element, { attributes: true, attributeFilter: ['class'] });
    this.syncVisibility();
  }

  ngOnChanges(): void {
    this.syncVisibility();
  }

  private syncVisibility(): void {
    if (!this.drawer || this.visible === this.isOpen()) {
      return;
    }
    if (this.visible) {
      const focused = this.element.nativeElement.ownerDocument.activeElement;
      this.opener = focused instanceof HTMLElement ? focused : undefined;
      this.isOpen.set(true);
      this.drawer.show();
      this.load();
    } else {
      this.hide();
    }
  }

  load(): void {
    this.status = '';
    this.snapshot = undefined;
    this.nodes = [];
    this.selectedNodes = [];
    this.requestState.track(forkJoin({
      plants: this.api.getAllPlants(), units: this.api.getAllUnits(),
      systems: this.api.getAllSystems(), assets: this.api.getAllAssets(),
      components: this.api.getAllComponents(), measurements: this.api.getAllMeasurements(),
    }), 'Unable to load the asset hierarchy.').subscribe({
      next: snapshot => {
        this.snapshot = snapshot;
        this.plants = buildParentOptions(snapshot.plants);
        this.restoreSelection();
      },
      error: () => {},
    });
  }

  changePlant(plantId: number | null): void {
    this.setPlant(plantId);
    this.selectionSave.emit(null);
  }

  private setPlant(plantId: number | null): void {
    this.plantId = plantId;
    this.nodes = this.snapshot && plantId !== null ? buildAssetTaxonomyTree(this.snapshot, plantId) : [];
    this.clearSelection();
    this.tree?.resetFilter();
  }

  private restoreSelection(): void {
    const saved = this.selection;
    this.setPlant(saved && this.plants.some(plant => plant.id === saved.plantId) ? saved.plantId : null);
    if (!saved || this.plantId === null) {
      if (saved) { this.status = 'The saved plant is no longer available. Choose a plant and select measurements again.'; }
      return;
    }
    const ids = new Set(saved.measurementIds);
    this.selectedNodes = flattenAssetTaxonomyTree(this.nodes).filter(node =>
      node.data.kind === 'Measurement' && node.data.unitId === saved.unitId && ids.has(node.data.id));
    const assetId = this.selectedNodes[0]?.data.assetId;
    this.selectedNodes = this.selectedNodes.filter(node => node.data.assetId === assetId);
    const expandSelected = (nodes: AssetTaxonomyNode[]): boolean => {
      let hasSelection = false;
      for (const node of nodes) {
        const selected = this.selectedNodes.includes(node) || expandSelected(node.children);
        if (selected && node.children.length) { node.expanded = true; }
        hasSelection ||= selected;
      }
      return hasSelection;
    };
    expandSelected(this.nodes);
    this.applyAssetRestriction();
    if (this.selectedNodes.length !== ids.size) {
      this.status = 'Some saved measurements are no longer available or belong to another asset. Review and update the selection.';
    }
  }

  selectNodes(selection: TreeNode<TaxonomyNodeData> | TreeNode<TaxonomyNodeData>[] | null): void {
    if (!this.isOpen() || !this.requestState.ready || this.plantId === null) {
      return;
    }
    const candidates = Array.isArray(selection) ? selection : [];
    const leaves = flattenAssetTaxonomyTree(this.nodes).filter(node => node.data.kind === 'Measurement');
    const keys = new Set(candidates.map(node => node.key));
    // Validate against the current hierarchy, including filtered-node copies.
    const assetId = this.activeAssetId ?? leaves.find(node => keys.has(node.key))?.data.assetId ?? null;
    this.selectedNodes = leaves.filter(node => keys.has(node.key) && node.data.assetId === assetId);
    this.status = '';
    this.applyAssetRestriction();
    this.selectionSave.emit(this.activeUnitId === null ? null : {
      plantId: this.plantId, unitId: this.activeUnitId,
      measurementIds: this.selectedNodes.map(node => node.data.id),
    });
  }

  private clearSelection(): void {
    this.selectedNodes = [];
    this.status = '';
    this.applyAssetRestriction();
  }

  private applyAssetRestriction(): void {
    this.activeUnitId = this.selectedNodes[0]?.data.unitId ?? null;
    this.activeAssetId = this.selectedNodes[0]?.data.assetId ?? null;
    const update = (nodes: TreeNode<TaxonomyNodeData>[]) => {
      for (const node of nodes) {
        node.selectable = node.data?.kind === 'Measurement' &&
          (this.activeAssetId === null || node.data.assetId === this.activeAssetId);
        update(node.children ?? []);
      }
    };
    update(this.nodes);
    update(this.tree?.filteredNodes ?? []);
  }

  reset(): void {
    this.changePlant(null);
    this.status = 'Selection reset.';
  }

  get canExecute(): boolean {
    return this.isOpen() && this.requestState.ready && this.selectedNodes.length > 0;
  }

  executeSelection(): void {
    if (!this.canExecute || !this.snapshot || this.plantId === null || this.activeUnitId === null) { return; }
    const execution = buildAssetTaxonomyExecution(this.snapshot, {
      plantId: this.plantId, unitId: this.activeUnitId,
      measurementIds: this.selectedNodes.map(node => node.data.id),
    });
    if (!execution) {
      this.status = 'The selected measurements are no longer available. Reload the hierarchy and select them again.';
      return;
    }
    this.selectionSave.emit(execution.selection);
    this.executed.emit(execution);
    this.close();
  }

  close(): void {
    this.hide();
    this.closed.emit();
  }

  private hide(): void {
    this.isOpen.set(false);
    if (this.drawer?.isShown()) { this.drawer.hide(); }
    this.requestState.destroy();
    if (this.element.nativeElement.contains(this.element.nativeElement.ownerDocument.activeElement)) {
      this.opener?.focus();
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.hide();
    DrawerStore.remove(this.drawerId);
  }
}
