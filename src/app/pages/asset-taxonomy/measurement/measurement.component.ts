import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RequestState } from 'src/app/shared/components/request-state/request-state';
import type { Measurement, MeasurementType, TaxonomyParentOption, EmployerOption, InheritedEmployer } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
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
      // Widths are relaxed so the 8-column table fits the viewport like the
      // other taxonomy tables and the Actions column stays visible; long
      // hierarchy labels wrap instead of forcing horizontal overflow.
      { key: 'name', title: 'Name', class: 'min-w-100px' },
      { key: 'tag', title: 'Tag', class: '' },
      { key: 'typeName', title: 'Type', class: '' },
      { key: 'unit', title: 'Unit', class: '' },
      { key: 'sensitivity', title: 'Sensitivity', class: '' },
      { key: 'componentLabel', title: 'Component Name', class: 'min-w-150px' },
      { key: 'employerName', title: 'Employer', class: 'min-w-125px' },
    ] satisfies readonly TablePaginationColumn<Measurement>[],
    { searchKeys: ['name', 'tag', 'typeName', 'unit', 'sensitivity', 'componentLabel', 'employerName'] satisfies readonly Extract<keyof Measurement, string>[] }
  );

  types = new TablePagination<MeasurementType>(
    [],
    [
      { key: 'name', title: 'Name', class: 'min-w-125px' },
      { key: 'unit', title: 'Unit', class: 'min-w-100px' },
    ] satisfies readonly TablePaginationColumn<MeasurementType>[],
    { searchKeys: ['name', 'unit'] satisfies readonly Extract<keyof MeasurementType, string>[] }
  );
  typeOptions: MeasurementType[] = [];
  typeFormModel: MeasurementType = { name: '', unit: '' };
  typeFilter: number | null = null;

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
  readonly typesState = new RequestState();
  private readonly destroyRef = inject(DestroyRef);
  private activeModal?: NgbModalRef;

  get canAdd(): boolean {
    return !this.saving && this.listState.ready && this.componentOptions.length > 0 && this.typesState.ready && this.typeOptions.length > 0;
  }

  get actionsDisabled(): boolean {
    return this.saving || this.listState.loading() || !this.typesState.ready;
  }

  ngOnDestroy(): void {
    this.listState.destroy();
    this.employersState.destroy();
    this.typesState.destroy();
    this.saving = false;
    this.activeModal?.dismiss('page destroyed');
  }

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteMeasurementConfirmed(row);
    this.types.onConfirmedDelete = (row) => this.deleteTypeConfirmed(row);
    this.loadTypes();
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

  filterByType(typeId: number | null): void {
    this.typeFilter = typeId;
    this.table.setFilter('measurementTypeId', typeId);
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
        this.systemIdByAssetId = {};
        for (const asset of assets) {
          if (asset.id === undefined) {
            continue;
          }
          if (asset.systemId !== null) {
            this.systemIdByAssetId[asset.id] = asset.systemId;
          }
        }
        this.loadSystems();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private loadSystems(): void {
    this.listState.track(this.apiService.getAllSystems(), 'Unable to load systems.', 'getAllSystems').subscribe({
      next: (systems) => {
        this.unitIdBySystemId = {};
        for (const system of systems) {
          if (system.id === undefined) {
            continue;
          }
          if (system.unitId !== null) {
            this.unitIdBySystemId[system.id] = system.unitId;
          }
        }
        this.loadUnits();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private loadUnits(): void {
    this.listState.track(this.apiService.getAllUnits(), 'Unable to load units.', 'getAllUnits').subscribe({
      next: (units) => {
        this.plantIdByUnitId = {};
        for (const unit of units) {
          if (unit.id === undefined) {
            continue;
          }
          if (unit.plantId !== null) {
            this.plantIdByUnitId[unit.id] = unit.plantId;
          }
        }
        this.loadPlants();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private loadPlants(): void {
    this.listState.track(this.apiService.getAllPlants(), 'Unable to load plants.', 'getAllPlants').subscribe({
      next: (plants) => {
        this.employerByPlantId = {};
        for (const plant of plants) {
          if (plant.id === undefined) {
            continue;
          }
          this.employerByPlantId[plant.id] = {
            id: plant.employerId ?? null,
            name: plant.employerName || '—',
          };
        }
        this.loadComponents();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private loadComponents(): void {
    this.listState.track(this.apiService.getAllComponents(), 'Unable to load components.', 'getAllComponents').subscribe({
      next: (components) => {
        this.componentOptions = [];
        this.assetIdByComponentId = {};
        for (const component of components) {
          if (component.id === undefined) {
            continue;
          }
          // Backend hierarchy label: "City - Plant - Unit - System - Asset - Component".
          this.componentOptions.push({ id: component.id, label: component.hierarchyLabel ?? component.name });
          if (component.assetId !== null) {
            this.assetIdByComponentId[component.id] = component.assetId;
          }
        }
        this.componentOptions.sort((left, right) => left.label.localeCompare(right.label));
        this.loadMeasurements();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private employerOfComponent(componentId: number | null): InheritedEmployer | undefined {
    if (componentId === null) {
      return undefined;
    }
    const assetId = this.assetIdByComponentId[componentId];
    if (assetId === undefined) {
      return undefined;
    }
    const systemId = this.systemIdByAssetId[assetId];
    const unitId = systemId !== undefined ? this.unitIdBySystemId[systemId] : undefined;
    const plantId = unitId !== undefined ? this.plantIdByUnitId[unitId] : undefined;
    return plantId !== undefined ? this.employerByPlantId[plantId] : undefined;
  }

  private toMeasurementRow(measurement: Measurement): Measurement {
    const employer = this.employerOfComponent(measurement.componentId);
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
      measurementTypeId: measurement.measurementTypeId,
      sensitivity: measurement.sensitivity,
    };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.measurementForm.name.trim() || !this.measurementForm.componentId ||
      this.measurementForm.measurementTypeId === null || this.measurementForm.sensitivity === null) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }
    if (!Number.isFinite(this.measurementForm.sensitivity)) {
      this.showAlert('error', 'Error!', 'Please enter a valid number for sensitivity.');
      return;
    }
    const componentId = this.measurementForm.componentId;
    if (!this.componentOptions.some((component) => component.id === componentId)) {
      this.showAlert('error', 'Error!', 'The selected component is no longer available. Please pick it again.');
      return;
    }
    const measurementTypeId = this.measurementForm.measurementTypeId;
    if (!this.typeOptions.some((type) => type.id === measurementTypeId)) {
      this.showAlert('error', 'Error!', 'The selected measurement type is no longer available. Please pick it again.');
      return;
    }

    this.saving = true;
    const payload = {
      name: this.measurementForm.name.trim(),
      tag: this.measurementForm.tag ?? '',
      measurementTypeId,
      sensitivity: this.measurementForm.sensitivity,
      componentId,
    };
    const isEdit = !!this.measurementForm.id;
    const request$ = isEdit
      ? this.apiService.updateMeasurement({ id: this.measurementForm.id!, ...payload })
      : this.apiService.createMeasurement(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'Measurement updated successfully!' : 'Measurement created successfully!');
        this.loadMeasurements();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.showAlert('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  private deleteMeasurementConfirmed(measurement: Measurement): void {
    if (this.saving || measurement.id === undefined || !this.table.beginDelete(measurement)) {
      return;
    }
    this.apiService.deleteMeasurement(measurement.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.table.endDelete(measurement))
    ).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + measurement.name + '!.');
        this.loadMeasurements();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the measurement.'),
    });
  }

  private emptyForm(): Measurement {
    return { componentId: null, name: '', tag: '', measurementTypeId: null, sensitivity: null };
  }

  loadTypes(): void {
    this.typesState.track(this.apiService.getAllMeasurementTypes(), 'Unable to load measurement types.', 'getAllMeasurementTypes').subscribe({
      next: (types) => {
        this.typeOptions = types;
        this.types.setRows(types.map((type) => ({ id: type.id, name: type.name, unit: type.unit })));
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  get selectedTypeUnit(): string {
    return this.typeOptions.find((type) => type.id === this.measurementForm.measurementTypeId)?.unit ?? '';
  }

  openAddTypeModal(content: TemplateRef<any>): void {
    if (this.saving || this.typesState.loading()) {
      return;
    }
    this.typeFormModel = { name: '', unit: '' };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  openEditTypeModal(content: TemplateRef<any>, type: MeasurementType): void {
    if (this.saving || this.typesState.loading() || this.types.isDeleting(type)) {
      return;
    }
    this.typeFormModel = { id: type.id, name: type.name, unit: type.unit };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  submitType(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    const name = this.typeFormModel.name.trim();
    const unit = this.typeFormModel.unit.trim();
    if (form.invalid || !name || !unit) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }
    this.saving = true;
    const isEdit = this.typeFormModel.id !== undefined;
    const payload = { name, unit };
    const request$ = isEdit
      ? this.apiService.updateMeasurementType({ id: this.typeFormModel.id!, ...payload })
      : this.apiService.createMeasurementType(payload);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving = false;
        this.loadTypes();
        this.loadMeasurements();
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'Type updated successfully!' : 'Type created successfully!');
      },
      error: (error) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.showAlert('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  deleteType(type: MeasurementType): void {
    this.types.confirmDelete(type, type.name);
  }

  private deleteTypeConfirmed(type: MeasurementType): void {
    if (this.saving || type.id === undefined || !this.types.beginDelete(type)) {
      return;
    }
    this.apiService.deleteMeasurementType(type.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.types.endDelete(type))
    ).subscribe({
      next: () => {
        if (this.typeFilter === type.id) {
          this.filterByType(null);
        }
        this.loadTypes();
        this.loadMeasurements();
        this.cdr.detectChanges();
        this.showAlert('success', 'Deleted!', 'You have deleted ' + type.name + '!.');
      },
      // The backend rejects types still used by measurements.
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the measurement type.'),
    });
  }

  private showAlert(icon: 'success' | 'error', title: string, text: string): void {
    Swal.fire({
      icon,
      title,
      text,
      buttonsStyling: false,
      confirmButtonText: 'Ok, got it!',
      customClass: {
        confirmButton: 'btn fw-bold btn-' + (icon === 'error' ? 'danger' : 'primary'),
      },
    });
  }
}
