import { ChangeDetectorRef, Component as AngularComponent, DestroyRef, inject, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { AssetTaxonomyMutations } from 'src/app/core/utils/asset-taxonomy-mutations';
import { RequestState } from 'src/app/shared/components/request-state/request-state';
import type { Component, TaxonomyParentOption, EmployerOption, InheritedEmployer } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { buildParentIdMap, buildParentOptions, buildPlantEmployerMap, resolveInheritedEmployer } from 'src/app/core/utils/asset-taxonomy-hierarchy';
import { TablePagination, TablePaginationColumn } from 'src/app/shared/components/data-table/pagination/table-pagination';

@AngularComponent({
  selector: 'app-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.scss'],
})
export class ComponentComponent implements OnInit, OnDestroy {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
    beforeDismiss: () => !this.saving,
  };

  table = new TablePagination<Component>(
    [],
    [
      { key: 'name', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'tag', title: 'Tag', class: 'min-w-125px' },
      { key: 'assetLabel', title: 'Asset Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employerName', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ] satisfies readonly TablePaginationColumn<Component>[],
    { searchKeys: ['name', 'tag', 'assetLabel', 'employerName'] satisfies readonly Extract<keyof Component, string>[] }
  );

  // Select values are IDs; hierarchy labels are for display only.
  assetOptions: TaxonomyParentOption[] = [];
  employers: EmployerOption[] = [];
  employerFilter: string | null = null;
  assetFilter: number | null = null;
  componentForm: Component = this.emptyForm();
  saving = false;

  private systemIdByAssetId: Record<number, number> = {};
  private unitIdBySystemId: Record<number, number> = {};
  private plantIdByUnitId: Record<number, number> = {};
  private employerByPlantId: Record<number, InheritedEmployer> = {};

  readonly listState = new RequestState();
  readonly employersState = new RequestState();
  private readonly mutations: AssetTaxonomyMutations;
  private activeModal?: NgbModalRef;

  get canAdd(): boolean {
    return !this.saving && this.listState.ready && this.assetOptions.length > 0;
  }

  get actionsDisabled(): boolean {
    return this.saving || this.listState.loading();
  }

  ngOnDestroy(): void {
    this.listState.destroy();
    this.employersState.destroy();
    this.saving = false;
    this.activeModal?.dismiss('page destroyed');
  }

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private alertService: MetronicAlertService,
    private cdr: ChangeDetectorRef
  ) {
    this.mutations = new AssetTaxonomyMutations(this, inject(DestroyRef), alertService, cdr);
  }

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteComponentConfirmed(row);
    this.loadEmployerOptions();
    this.refresh();
  }

  loadEmployerOptions(): void {
    this.employersState.track(this.apiService.getEmployerOptions(), 'Unable to load employer users.', 'getEmployerOptions').subscribe({
      next: (users) => {
        this.employers = users;
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  filterByEmployer(employerId: string | null): void {
    this.employerFilter = employerId;
    this.table.setFilter('employerId', employerId);
  }

  filterByAsset(assetId: number | null): void {
    this.assetFilter = assetId;
    this.table.setFilter('assetId', assetId);
  }

  refresh(): void {
    if (this.listState.loading()) {
      return;
    }
    this.loadAssets();
  }

  private loadAssets(): void {
    this.listState.track(this.apiService.getAllAssets(), 'Unable to load assets.', 'getAllAssets').subscribe({
      next: (assets) => {
        this.assetOptions = buildParentOptions(assets);
        this.systemIdByAssetId = buildParentIdMap(assets, (asset) => asset.systemId);
        this.loadSystems();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private loadSystems(): void {
    this.listState.track(this.apiService.getAllSystems(), 'Unable to load systems.', 'getAllSystems').subscribe({
      next: (systems) => {
        this.unitIdBySystemId = buildParentIdMap(systems, (system) => system.unitId);
        this.loadUnits();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private loadUnits(): void {
    this.listState.track(this.apiService.getAllUnits(), 'Unable to load units.', 'getAllUnits').subscribe({
      next: (units) => {
        this.plantIdByUnitId = buildParentIdMap(units, (unit) => unit.plantId);
        this.loadPlants();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private loadPlants(): void {
    this.listState.track(this.apiService.getAllPlants(), 'Unable to load plants.', 'getAllPlants').subscribe({
      next: (plants) => {
        this.employerByPlantId = buildPlantEmployerMap(plants);
        this.loadComponents();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private toComponentRow(component: Component): Component {
    const employer = resolveInheritedEmployer(
      component.assetId, this.employerByPlantId,
      this.systemIdByAssetId, this.unitIdBySystemId, this.plantIdByUnitId
    );
    return {
      ...component,
      tag: component.tag ?? null,
      employerName: employer?.name || '\u2014',
      employerId: employer?.id ?? null,
    };
  }

  private loadComponents(): void {
    this.listState.track(this.apiService.getAllComponents(), 'Unable to load components.', 'getAllComponents').subscribe({
      next: (components) => {
        this.table.setRows(components.map((component) => this.toComponentRow(component)), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    if (!this.canAdd) {
      return;
    }
    this.componentForm = this.emptyForm();
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, component: Component): void {
    if (this.actionsDisabled || this.table.isDeleting(component)) {
      return;
    }
    this.componentForm = {
      id: component.id, assetId: component.assetId, name: component.name, tag: component.tag ?? '',
    };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.componentForm.name.trim() || this.componentForm.assetId === null) {
      form.control.markAllAsTouched();
      this.alertService.show('error', 'Error!', 'Please fill in all required fields.');
      return;
    }
    const assetId = this.componentForm.assetId;
    if (!this.assetOptions.some((asset) => asset.id === assetId)) {
      this.alertService.show('error', 'Error!', 'The selected asset is no longer available. Please pick it again.');
      return;
    }

    const payload = { name: this.componentForm.name.trim(), tag: this.componentForm.tag ?? '', assetId };
    const isEdit = !!this.componentForm.id;
    const request = () => isEdit
      ? this.apiService.updateComponent({ id: this.componentForm.id!, ...payload })
      : this.apiService.createComponent(payload);
    this.mutations.save(request, () => {
      modal.dismiss('saved');
      this.alertService.show('success', 'Success!', isEdit ? 'Component updated successfully!' : 'Component created successfully!');
      this.loadComponents();
    });
  }

  private deleteComponentConfirmed(component: Component): void {
    this.mutations.delete(component, this.table, (id) => this.apiService.deleteComponent(id), () => {
      this.alertService.show('success', 'Deleted!', 'You have deleted ' + component.name + '!.');
      this.loadComponents();
    }, 'Unable to delete the component.');
  }

  private emptyForm(): Component {
    return { assetId: null, name: '', tag: '' };
  }
}
