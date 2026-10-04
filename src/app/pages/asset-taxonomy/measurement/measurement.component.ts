import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { MeasurementPayload } from 'src/app/core/models/asset.model';
import { AssetApiService } from '../services/asset-api.service';
import { MeasurementStorageService } from '../services/measurement-storage.service';
import { ComponentStorageService } from '../services/component-storage.service';
import { ClientTable } from '../client-table';
import { EMPLOYERS, employerOf } from '../employers';

interface MeasurementRow extends Record<string, string> {
  id: string;
  employer: string;
  component: string;
  componentId: string;
  measurement: string;
}

interface MeasurementFormModel {
  id?: number;
  componentId: number | null;
  measurement: string;
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
      { key: 'component', title: 'Component Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employer', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ]
  );

  componentOptions: { id: number; label: string }[] = [];
  employers: string[] = EMPLOYERS;
  employerFilter: string | null = null;
  componentFilter: number | null = null;
  measurementForm: MeasurementFormModel = this.emptyForm();
  saving = false;

  private componentLabelById: Record<number, string> = {};
  private assetIdByComponentId: Record<number, number> = {};
  private assetLabelById: Record<number, string> = {};
  private systemIdByAssetId: Record<number, number> = {};
  private unitIdBySystemId: Record<number, number> = {};
  private plantIdByUnitId: Record<number, number> = {};
  private employerByPlantId: Record<number, string> = {};

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private measurementStorage: MeasurementStorageService,
    private componentStorage: ComponentStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteMeasurementConfirmed(row);
    this.refresh();
  }

  filterByEmployer(employer: string | null): void {
    this.employerFilter = employer;
    this.table.setFilter('employer', employer);
  }

  filterByComponent(componentId: number | null): void {
    this.componentFilter = componentId;
    this.table.setFilter('componentId', componentId === null ? null : String(componentId));
  }

  refresh(): void {
    this.loadAssets();
  }

  private loadAssets(): void {
    this.apiService.getAllAssets().subscribe({
      next: (assets) => {
        this.assetLabelById = {};
        this.systemIdByAssetId = {};
        for (const asset of assets) {
          const label = `${asset.name} - ${asset.systemLabel}`;
          this.assetLabelById[asset.id] = label;
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
          this.employerByPlantId[plant.id] = plant.employerName || employerOf(plant.name);
        }
        this.loadComponents();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load plants.'),
    });
  }

  private employerOfAsset(assetId: number, fallbackLabel: string): string {
    const systemId = this.systemIdByAssetId[assetId];
    const unitId = systemId !== undefined ? this.unitIdBySystemId[systemId] : undefined;
    const plantId = unitId !== undefined ? this.plantIdByUnitId[unitId] : undefined;
    return (plantId !== undefined && this.employerByPlantId[plantId]) || employerOf(fallbackLabel);
  }

  private loadComponents(): void {
    this.componentStorage.getAllComponents().subscribe({
      next: (components) => {
        this.componentLabelById = {};
        this.assetIdByComponentId = {};
        this.componentOptions = components.map((component) => {
          const assetLabel = this.assetLabelById[component.assetId] || `Asset #${component.assetId}`;
          const label = `${component.name} - ${assetLabel}`;
          this.componentLabelById[component.id] = label;
          this.assetIdByComponentId[component.id] = component.assetId;
          return { id: component.id, label };
        }).sort((left, right) => left.label.localeCompare(right.label));
        this.loadMeasurements();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load components.'),
    });
  }

  private loadMeasurements(): void {
    this.measurementStorage.getAllMeasurements().subscribe({
      next: (measurements) => {
        this.table.rows = measurements.map((measurement) => {
          const componentLabel = this.componentLabelById[measurement.componentId] || `Component #${measurement.componentId}`;
          const assetId = this.assetIdByComponentId[measurement.componentId];
          return {
            id: String(measurement.id),
            measurement: measurement.name,
            component: componentLabel,
            componentId: String(measurement.componentId),
            employer: assetId !== undefined ? this.employerOfAsset(assetId, componentLabel) : '',
          };
        });
        this.table.page = 1;
        this.employers = [...new Set([...EMPLOYERS, ...this.table.rows.map((row) => row.employer)])]
          .filter(Boolean)
          .sort();
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
    };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.measurementForm.componentId) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }
    const componentId = this.measurementForm.componentId;
    if (!this.componentOptions.some((component) => component.id === componentId)) {
      this.showAlert('error', 'Error!', 'The selected component is no longer available. Please pick it again.');
      return;
    }

    this.saving = true;
    const payload: MeasurementPayload = { name: this.measurementForm.measurement, componentId };
    const isEdit = !!this.measurementForm.id;
    const request$ = isEdit
      ? this.measurementStorage.updateMeasurement({ id: this.measurementForm.id!, ...payload })
      : this.measurementStorage.createMeasurement(payload);
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
    this.measurementStorage.deleteMeasurement(Number(measurement.id)).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + measurement.measurement + '!.');
        this.loadMeasurements();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the measurement.'),
    });
  }

  private emptyForm(): MeasurementFormModel {
    return { componentId: null, measurement: '' };
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
