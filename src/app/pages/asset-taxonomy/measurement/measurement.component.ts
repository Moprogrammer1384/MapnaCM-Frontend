import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { AssetTaxonomyMutations } from 'src/app/core/utils/asset-taxonomy-mutations';
import { RequestState } from 'src/app/shared/components/request-state/request-state';
import type { Measurement, TaxonomyParentOption, EmployerOption, InheritedEmployer } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { buildParentIdMap, buildParentOptions, buildPlantEmployerMap, resolveInheritedEmployer } from 'src/app/core/utils/asset-taxonomy-hierarchy';
import { TablePagination, TablePaginationColumn } from 'src/app/shared/components/data-table/pagination/table-pagination';

@Component({
  selector: 'app-measurement',
  templateUrl: './measurement.component.html',
  styleUrls: ['./measurement.component.scss'],
})
export class MeasurementComponent implements OnInit, OnDestroy {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
    beforeDismiss: () => !this.saving,
  };

  table = new TablePagination<Measurement>(
    [],
    [
      { key: 'name', title: 'Name', class: 'min-w-100px' },
      { key: 'tag', title: 'Tag', class: '' },
      { key: 'sensitivity', title: 'Sensitivity', class: '' },
      { key: 'componentLabel', title: 'Component Name', class: 'min-w-150px' },
      { key: 'employerName', title: 'Employer', class: 'min-w-125px' },
    ] satisfies readonly TablePaginationColumn<Measurement>[],
    { searchKeys: ['name', 'tag', 'sensitivity', 'componentLabel', 'employerName'] satisfies readonly Extract<keyof Measurement, string>[] }
  );

  // Options carry the backend hierarchy labels ("City - Plant - Unit -
  // System - Asset - Component"); the select binds the numeric component id.
  componentOptions: TaxonomyParentOption[] = [];
  // Employer filter values are user IDs; names are for display only.
  employers: EmployerOption[] = [];
  employerFilter: string | null = null;
  componentFilter: number | null = null;
  measurementForm: Measurement = this.emptyForm();
  saving = false;

  private assetIdByComponentId: Record<number, number> = {};
  private systemIdByAssetId: Record<number, number> = {};
  private unitIdBySystemId: Record<number, number> = {};
  private plantIdByUnitId: Record<number, number> = {};
  private employerByPlantId: Record<number, InheritedEmployer> = {};

  readonly listState = new RequestState();
  readonly employersState = new RequestState();
  private readonly mutations: AssetTaxonomyMutations;
  private activeModal?: NgbModalRef;

  get canAdd(): boolean {
    return !this.saving && this.listState.ready && this.componentOptions.length > 0;
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
    this.table.onConfirmedDelete = (row) => this.deleteMeasurementConfirmed(row);
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

  filterByComponent(componentId: number | null): void {
    this.componentFilter = componentId;
    this.table.setFilter('componentId', componentId);
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

  private loadComponents(): void {
    this.listState.track(this.apiService.getAllComponents(), 'Unable to load components.', 'getAllComponents').subscribe({
      next: (components) => {
        this.componentOptions = buildParentOptions(components);
        this.assetIdByComponentId = buildParentIdMap(components, (component) => component.assetId);
        this.loadMeasurements();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private toMeasurementRow(measurement: Measurement): Measurement {
    const employer = resolveInheritedEmployer(
      measurement.componentId, this.employerByPlantId,
      this.assetIdByComponentId, this.systemIdByAssetId, this.unitIdBySystemId, this.plantIdByUnitId
    );
    return {
      ...measurement,
      tag: measurement.tag ?? null,
      employerName: employer?.name || '\u2014',
      employerId: employer?.id ?? null,
    };
  }

  private loadMeasurements(): void {
    this.listState.track(this.apiService.getAllMeasurements(), 'Unable to load measurements.', 'getAllMeasurements').subscribe({
      next: (measurements) => {
        this.table.setRows(measurements.map((measurement) => this.toMeasurementRow(measurement)), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    if (!this.canAdd) {
      return;
    }
    this.measurementForm = this.emptyForm();
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, measurement: Measurement): void {
    if (this.actionsDisabled || this.table.isDeleting(measurement)) {
      return;
    }
    this.measurementForm = {
      id: measurement.id,
      componentId: measurement.componentId,
      name: measurement.name,
      tag: measurement.tag ?? '',
      sensitivity: measurement.sensitivity,
    };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.measurementForm.name.trim() || !this.measurementForm.componentId ||
      this.measurementForm.sensitivity === null) {
      form.control.markAllAsTouched();
      this.alertService.show('error', 'Error!', 'Please fill in all required fields.');
      return;
    }
    if (!Number.isFinite(this.measurementForm.sensitivity)) {
      this.alertService.show('error', 'Error!', 'Please enter a valid number for sensitivity.');
      return;
    }
    const componentId = this.measurementForm.componentId;
    if (!this.componentOptions.some((component) => component.id === componentId)) {
      this.alertService.show('error', 'Error!', 'The selected component is no longer available. Please pick it again.');
      return;
    }
    const payload = {
      name: this.measurementForm.name.trim(),
      tag: this.measurementForm.tag ?? '',
      sensitivity: this.measurementForm.sensitivity,
      componentId,
    };
    const isEdit = !!this.measurementForm.id;
    const request = () => isEdit
      ? this.apiService.updateMeasurement({ id: this.measurementForm.id!, ...payload })
      : this.apiService.createMeasurement(payload);
    this.mutations.save(request, () => {
      modal.dismiss('saved');
      this.alertService.show('success', 'Success!', isEdit ? 'Measurement updated successfully!' : 'Measurement created successfully!');
      this.loadMeasurements();
    });
  }

  private deleteMeasurementConfirmed(measurement: Measurement): void {
    this.mutations.delete(measurement, this.table, (id) => this.apiService.deleteMeasurement(id), () => {
      this.alertService.show('success', 'Deleted!', 'You have deleted ' + measurement.name + '!.');
      this.loadMeasurements();
    }, 'Unable to delete the measurement.');
  }

  private emptyForm(): Measurement {
    return { componentId: null, name: '', tag: '', sensitivity: null };
  }

}
