import { ChangeDetectorRef, Component, Inject, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { MeasurementPayload } from 'src/app/core/models/asset.model';
import { AssetApiService } from '../services/asset-api.service';
import { ClientTable } from '../client-table';
import { MeasurementUiStateService } from './measurement-ui-state.service';
import type { MeasurementType } from './measurement-ui-state.service';

interface MeasurementRow extends Record<string, string> {
  id: string;
  employer: string;
  component: string;
  componentId: string;
  measurement: string;
  tag: string;
  type: string;
  unit: string;
  measurementTypeId: string;
  sensitivity: string;
}

interface TypeRow extends Record<string, string> {
  id: string;
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

  table = new ClientTable<MeasurementRow>(
    [],
    [
      { key: 'measurement', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'tag', title: 'Tag', class: 'min-w-125px' },
      { key: 'type', title: 'Type', class: 'min-w-125px' },
      { key: 'unit', title: 'Unit', class: 'min-w-100px' },
      { key: 'sensitivity', title: 'Sensitivity', class: 'min-w-125px' },
      { key: 'component', title: 'Component Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employer', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ]
  );

  types = new ClientTable<TypeRow>([], [
    { key: 'name', title: 'Name', class: 'min-w-125px' },
    { key: 'unit', title: 'Unit', class: 'min-w-100px' },
  ]);
  typeOptions: MeasurementType[] = [];
  typeFormModel: TypeFormModel = { name: '', unit: '' };
  typeFilter: number | null = null;

  // Options carry the backend hierarchy labels ("City - Plant - Unit -
  // System - Asset - Component"); the select binds the numeric component id.
  componentOptions: { id: number; label: string }[] = [];
  // Employer filter options (names of the Employer-role users, from the API).
  employers: string[] = [];
  employerFilter: string | null = null;
  componentFilter: number | null = null;
  measurementForm: MeasurementFormModel = this.emptyForm();
  saving = false;

  private assetIdByComponentId: Record<number, number> = {};
  private systemIdByAssetId: Record<number, number> = {};
  private unitIdBySystemId: Record<number, number> = {};
  private plantIdByUnitId: Record<number, number> = {};
  private employerByPlantId: Record<number, string> = {};

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    @Inject(MeasurementUiStateService) private uiState: MeasurementUiStateService,
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
        this.employers = users.map((user) => user.name);
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load employer users.'),
    });
  }

  filterByEmployer(employer: string | null): void {
    this.employerFilter = employer;
    this.table.setFilter('employer', employer);
  }

  filterByComponent(componentId: number | null): void {
    this.componentFilter = componentId;
    this.table.setFilter('componentId', componentId === null ? null : String(componentId));
  }

  filterByType(typeId: number | null): void {
    this.typeFilter = typeId;
    this.table.setFilter('measurementTypeId', typeId === null ? null : String(typeId));
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
          this.employerByPlantId[plant.id] = plant.employerName || '—';
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

  private employerOfComponent(componentId: number): string {
    const assetId = this.assetIdByComponentId[componentId];
    if (assetId === undefined) {
      return '—';
    }
    const systemId = this.systemIdByAssetId[assetId];
    const unitId = systemId !== undefined ? this.unitIdBySystemId[systemId] : undefined;
    const plantId = unitId !== undefined ? this.plantIdByUnitId[unitId] : undefined;
    return (plantId !== undefined && this.employerByPlantId[plantId]) || '—';
  }

  private toMeasurementRow(measurement: {
    id: number;
    name: string;
    tag?: string | null;
    componentId: number;
    componentLabel: string;
  }): MeasurementRow {
    const configuration = this.uiState.getConfiguration(measurement.id);
    const type = this.typeOptions.find((option) => option.id === configuration?.measurementTypeId);
    return {
      id: String(measurement.id),
      measurement: measurement.name,
      tag: measurement.tag ?? '',
      type: type?.name ?? '',
      unit: type?.unit ?? '',
      measurementTypeId: configuration ? String(configuration.measurementTypeId) : '',
      sensitivity: configuration ? String(configuration.sensitivity) : '',
      // Backend canonical label — identical to the select options, so the
      // edit prefill matches.
      component: measurement.componentLabel,
      componentId: String(measurement.componentId),
      employer: this.employerOfComponent(measurement.componentId),
    };
  }

  private loadMeasurements(): void {
    this.apiService.getAllMeasurements().subscribe({
      next: (measurements) => {
        this.uiState.reconcile(measurements);
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
      id: Number(measurement.id),
      componentId: Number(measurement.componentId),
      measurement: measurement.measurement,
      tag: measurement.tag,
      measurementTypeId: measurement.measurementTypeId ? Number(measurement.measurementTypeId) : null,
      sensitivity: measurement.sensitivity !== '' ? Number(measurement.sensitivity) : null,
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
    const payload: MeasurementPayload = { name: this.measurementForm.measurement.trim(), tag: this.measurementForm.tag, componentId };
    const configuration = { measurementTypeId, sensitivity: this.measurementForm.sensitivity };
    const measurementId = this.measurementForm.id;
    const existingIds = this.table.rows.map((row) => Number(row.id));
    const isEdit = !!measurementId;
    const request$ = isEdit
      ? this.apiService.updateMeasurement({ id: this.measurementForm.id!, ...payload })
      : this.apiService.createMeasurement(payload);
    request$.subscribe({
      next: () => {
        if (measurementId !== undefined) {
          this.uiState.setConfiguration(measurementId, configuration);
        } else {
          this.uiState.queueCreatedConfiguration(payload, existingIds, configuration);
        }
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
    this.apiService.deleteMeasurement(Number(measurement.id)).subscribe({
      next: () => {
        this.uiState.deleteConfiguration(Number(measurement.id));
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
    this.typeOptions = this.uiState.getTypes();
    this.types.rows = this.typeOptions.map((type) => ({ id: String(type.id), name: type.name, unit: type.unit }));
    this.types.page = Math.min(this.types.page, this.types.totalPages);
    this.table.rows = this.table.rows.map((row) => {
      const type = this.typeOptions.find((option) => String(option.id) === row.measurementTypeId);
      return { ...row, type: type?.name ?? '', unit: type?.unit ?? '' };
    });
    this.table.page = Math.min(this.table.page, this.table.totalPages);
  }

  get selectedTypeUnit(): string {
    return this.typeOptions.find((type) => type.id === this.measurementForm.measurementTypeId)?.unit ?? '';
  }

  openAddTypeModal(content: TemplateRef<any>): void {
    this.typeFormModel = { name: '', unit: '' };
    this.modalService.open(content, this.modalConfig);
  }

  openEditTypeModal(content: TemplateRef<any>, type: TypeRow): void {
    this.typeFormModel = { id: Number(type.id), name: type.name, unit: type.unit };
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
    const isEdit = this.typeFormModel.id !== undefined;
    this.uiState.saveType({ ...this.typeFormModel, name, unit });
    this.loadTypes();
    modal.dismiss('saved');
    this.showAlert('success', 'Success!', isEdit ? 'Type updated successfully!' : 'Type created successfully!');
  }

  deleteType(type: TypeRow): void {
    if (this.uiState.isTypeInUse(Number(type.id))) {
      this.showAlert('error', 'Error!', 'This type is used by a measurement. Change or delete the measurement first.');
      return;
    }
    this.types.confirmDelete(type, type.name);
  }

  private deleteTypeConfirmed(type: TypeRow): void {
    if (!this.uiState.deleteType(Number(type.id))) {
      this.showAlert('error', 'Error!', 'This type is used by a measurement. Change or delete the measurement first.');
      return;
    }
    if (this.typeFilter === Number(type.id)) {
      this.filterByType(null);
    }
    this.loadTypes();
    this.cdr.detectChanges();
    this.showAlert('success', 'Deleted!', 'You have deleted ' + type.name + '!.');
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
