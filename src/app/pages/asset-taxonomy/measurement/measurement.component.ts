import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { MeasurementPayload, MeasurementType, TaxonomyMeasurement } from 'src/app/core/models/asset.model';
import { AssetApiService } from '../services/asset-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/_metronic/shared/Pagination/table-pagination';

interface MeasurementRow {
  id: number;
  employer: string;
  employerId: string | null;
  component: string;
  componentId: number;
  measurement: string;
  tag: string | null;
  type: string | null;
  unit: string | null;
  measurementTypeId: number | null;
  sensitivity: number | null;
}

interface TypeRow {
  id: number;
  name: string;
  unit: string;
}

interface TypeFormModel {
  id?: number;
  name: string;
  unit: string;
}

interface MeasurementFormModel {
  id?: number;
  componentId: number | null;
  measurement: string;
  tag: string;
  measurementTypeId: number | null;
  sensitivity: number | null;
}

@Component({
  selector: 'app-measurement',
  templateUrl: './measurement.component.html',
  styleUrls: ['./measurement.component.scss'],
})
export class MeasurementComponent implements OnInit {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  table = new TablePagination<MeasurementRow>(
    [],
    [
      // Widths are relaxed so the 8-column table fits the viewport like the
      // other taxonomy tables and the Actions column stays visible; long
      // hierarchy labels wrap instead of forcing horizontal overflow.
      { key: 'measurement', title: 'Name', class: 'min-w-100px' },
      { key: 'tag', title: 'Tag', class: '' },
      { key: 'type', title: 'Type', class: '' },
      { key: 'unit', title: 'Unit', class: '' },
      { key: 'sensitivity', title: 'Sensitivity', class: '' },
      { key: 'component', title: 'Component Name', class: 'min-w-150px' },
      { key: 'employer', title: 'Employer', class: 'min-w-125px' },
    ] satisfies readonly TablePaginationColumn<MeasurementRow>[]
  );

  types = new TablePagination<TypeRow>(
    [],
    [
      { key: 'name', title: 'Name', class: 'min-w-125px' },
      { key: 'unit', title: 'Unit', class: 'min-w-100px' },
    ] satisfies readonly TablePaginationColumn<TypeRow>[]
  );
  typeOptions: MeasurementType[] = [];
  typeFormModel: TypeFormModel = { name: '', unit: '' };
  typeFilter: number | null = null;

  // Options carry the backend hierarchy labels ("City - Plant - Unit -
  // System - Asset - Component"); the select binds the numeric component id.
  componentOptions: { id: number; label: string }[] = [];
  // Employer filter values are user IDs; names are for display only.
  employers: { id: string; name: string }[] = [];
  employerFilter: string | null = null;
  componentFilter: number | null = null;
  measurementForm: MeasurementFormModel = this.emptyForm();
  saving = false;

  private assetIdByComponentId: Record<number, number> = {};
  private systemIdByAssetId: Record<number, number> = {};
  private unitIdBySystemId: Record<number, number> = {};
  private plantIdByUnitId: Record<number, number> = {};
  private employerByPlantId: Record<number, { id: string | null; name: string }> = {};

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

  private loadEmployerOptions(): void {
    this.apiService.getEmployerOptions().subscribe({
      next: (users) => {
        this.employers = users;
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load employer users.'),
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
    this.loadAssets();
  }

  private loadAssets(): void {
    this.apiService.getAllAssets().subscribe({
      next: (assets) => {
        this.systemIdByAssetId = {};
        for (const asset of assets) {
          this.systemIdByAssetId[asset.id] = asset.systemId;
        }
        this.loadSystems();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load assets.'),
    });
  }

  private loadSystems(): void {
    this.apiService.getAllSystems().subscribe({
      next: (systems) => {
        this.unitIdBySystemId = {};
        for (const system of systems) {
          this.unitIdBySystemId[system.id] = system.unitId;
        }
        this.loadUnits();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load systems.'),
    });
  }

  private loadUnits(): void {
    this.apiService.getAllUnits().subscribe({
      next: (units) => {
        this.plantIdByUnitId = {};
        for (const unit of units) {
          this.plantIdByUnitId[unit.id] = unit.plantId;
        }
        this.loadPlants();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load units.'),
    });
  }

  private loadPlants(): void {
    this.apiService.getAllPlants().subscribe({
      next: (plants) => {
        this.employerByPlantId = {};
        for (const plant of plants) {
          this.employerByPlantId[plant.id] = {
            id: plant.employerId ?? null,
            name: plant.employerName || '—',
          };
        }
        this.loadComponents();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load plants.'),
    });
  }

  private loadComponents(): void {
    this.apiService.getAllComponents().subscribe({
      next: (components) => {
        this.componentOptions = [];
        this.assetIdByComponentId = {};
        for (const component of components) {
          // Backend hierarchy label: "City - Plant - Unit - System - Asset - Component".
          this.componentOptions.push({ id: component.id, label: component.hierarchyLabel });
          this.assetIdByComponentId[component.id] = component.assetId;
        }
        this.componentOptions.sort((left, right) => left.label.localeCompare(right.label));
        this.loadMeasurements();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load components.'),
    });
  }

  private employerOfComponent(componentId: number): { id: string | null; name: string } | undefined {
    const assetId = this.assetIdByComponentId[componentId];
    if (assetId === undefined) {
      return undefined;
    }
    const systemId = this.systemIdByAssetId[assetId];
    const unitId = systemId !== undefined ? this.unitIdBySystemId[systemId] : undefined;
    const plantId = unitId !== undefined ? this.plantIdByUnitId[unitId] : undefined;
    return plantId !== undefined ? this.employerByPlantId[plantId] : undefined;
  }

  private toMeasurementRow(measurement: TaxonomyMeasurement): MeasurementRow {
    const employer = this.employerOfComponent(measurement.componentId);
    return {
      id: measurement.id,
      measurement: measurement.name,
      tag: measurement.tag ?? null,
      type: measurement.typeName,
      unit: measurement.unit,
      measurementTypeId: measurement.measurementTypeId,
      sensitivity: measurement.sensitivity,
      // Parent labels are displayed independently of the selected component ID.
      component: measurement.componentLabel,
      componentId: measurement.componentId,
      employer: employer?.name || '—',
      employerId: employer?.id ?? null,
    };
  }

  private loadMeasurements(): void {
    this.apiService.getAllMeasurements().subscribe({
      next: (measurements) => {
        this.table.rows = measurements.map((measurement) => this.toMeasurementRow(measurement));
        this.table.page = 1;
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load measurements.'),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    this.measurementForm = this.emptyForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, measurement: MeasurementRow): void {
    this.measurementForm = {
      id: measurement.id,
      componentId: measurement.componentId,
      measurement: measurement.measurement,
      tag: measurement.tag ?? '',
      measurementTypeId: measurement.measurementTypeId,
      sensitivity: measurement.sensitivity,
    };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.measurementForm.measurement.trim() || !this.measurementForm.componentId ||
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
    const payload: MeasurementPayload = {
      name: this.measurementForm.measurement.trim(),
      tag: this.measurementForm.tag,
      measurementTypeId,
      sensitivity: this.measurementForm.sensitivity,
      componentId,
    };
    const isEdit = !!this.measurementForm.id;
    const request$ = isEdit
      ? this.apiService.updateMeasurement({ id: this.measurementForm.id!, ...payload })
      : this.apiService.createMeasurement(payload);
    request$.subscribe({
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

  private deleteMeasurementConfirmed(measurement: MeasurementRow): void {
    this.apiService.deleteMeasurement(measurement.id).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + measurement.measurement + '!.');
        this.loadMeasurements();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the measurement.'),
    });
  }

  private emptyForm(): MeasurementFormModel {
    return { componentId: null, measurement: '', tag: '', measurementTypeId: null, sensitivity: null };
  }

  private loadTypes(): void {
    this.apiService.getAllMeasurementTypes().subscribe({
      next: (types) => {
        this.typeOptions = types;
        this.types.rows = types.map((type) => ({ id: type.id, name: type.name, unit: type.unit }));
        this.types.page = Math.min(this.types.page, this.types.totalPages);
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load measurement types.'),
    });
  }

  get selectedTypeUnit(): string {
    return this.typeOptions.find((type) => type.id === this.measurementForm.measurementTypeId)?.unit ?? '';
  }

  openAddTypeModal(content: TemplateRef<any>): void {
    this.typeFormModel = { name: '', unit: '' };
    this.modalService.open(content, this.modalConfig);
  }

  openEditTypeModal(content: TemplateRef<any>, type: TypeRow): void {
    this.typeFormModel = { id: type.id, name: type.name, unit: type.unit };
    this.modalService.open(content, this.modalConfig);
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
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.loadTypes();
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

  deleteType(type: TypeRow): void {
    this.types.confirmDelete(type, type.name);
  }

  private deleteTypeConfirmed(type: TypeRow): void {
    this.apiService.deleteMeasurementType(type.id).subscribe({
      next: () => {
        if (this.typeFilter === type.id) {
          this.filterByType(null);
        }
        this.loadTypes();
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
