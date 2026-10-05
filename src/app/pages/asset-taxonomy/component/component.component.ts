import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ComponentPayload } from 'src/app/core/models/asset.model';
import { AssetApiService } from '../services/asset-api.service';
import { TablePagination } from 'src/app/_metronic/shared/Pagination/table-pagination';

interface ComponentRow extends Record<string, string> {
  id: string;
  employer: string;
  asset: string;
  component: string;
  tag: string;
}

interface ComponentFormModel {
  id?: number;
  asset: string | null;
  component: string;
  tag: string;
}

@Component({
  selector: 'app-component',
  templateUrl: './component.component.html',
  styleUrls: ['./component.component.scss'],
})
export class ComponentComponent implements OnInit {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  table = new TablePagination<ComponentRow>(
    [],
    [
      { key: 'component', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'tag', title: 'Tag', class: 'min-w-125px' },
      { key: 'asset', title: 'Asset Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employer', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ]
  );

  // Dropdown options are the backend hierarchy labels ("City - Plant - Unit -
  // System - Asset"); ids resolve through the label -> id map.
  assetOptions: string[] = [];
  // Employer filter options (names of the Employer-role users, from the API).
  employers: string[] = [];
  employerFilter: string | null = null;
  assetFilter: string | null = null;
  componentForm: ComponentFormModel = this.emptyForm();
  saving = false;

  private assetIdByLabel: Record<string, number> = {};
  private systemIdByAssetId: Record<number, number> = {};
  private unitIdBySystemId: Record<number, number> = {};
  private plantIdByUnitId: Record<number, number> = {};
  private employerByPlantId: Record<number, string> = {};

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteComponentConfirmed(row);
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

  filterByAsset(asset: string | null): void {
    this.assetFilter = asset;
    this.table.setFilter('asset', asset);
  }

  refresh(): void {
    this.loadAssets();
  }

  private loadAssets(): void {
    this.apiService.getAllAssets().subscribe({
      next: (assets) => {
        this.assetOptions = [];
        this.assetIdByLabel = {};
        this.systemIdByAssetId = {};
        for (const asset of assets) {
          // Backend hierarchy label: "City - Plant - Unit - System - Asset".
          const label = asset.hierarchyLabel;
          this.assetOptions.push(label);
          this.assetIdByLabel[label] = asset.id;
          this.systemIdByAssetId[asset.id] = asset.systemId;
        }
        this.assetOptions.sort();
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

  private employerOfAsset(assetId: number): string {
    const systemId = this.systemIdByAssetId[assetId];
    const unitId = systemId !== undefined ? this.unitIdBySystemId[systemId] : undefined;
    const plantId = unitId !== undefined ? this.plantIdByUnitId[unitId] : undefined;
    return (plantId !== undefined && this.employerByPlantId[plantId]) || '—';
  }

  private toComponentRow(component: { id: number; name: string; tag?: string | null; assetId: number; assetLabel: string }): ComponentRow {
    return {
      id: String(component.id),
      component: component.name,
      tag: component.tag ?? '',
      // Backend canonical label — identical to the select options, so the
      // edit prefill matches by string.
      asset: component.assetLabel,
      assetId: String(component.assetId),
      employer: this.employerOfAsset(component.assetId),
    };
  }

  private loadComponents(): void {
    this.apiService.getAllComponents().subscribe({
      next: (components) => {
        this.table.rows = components.map((component) => this.toComponentRow(component));
        this.table.page = 1;
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load components.'),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    this.componentForm = this.emptyForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, component: ComponentRow): void {
    this.componentForm = {
      id: Number(component.id), asset: component.asset, component: component.component, tag: component.tag,
    };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.componentForm.asset) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }
    const assetId = this.assetIdByLabel[this.componentForm.asset];
    if (!assetId) {
      this.showAlert('error', 'Error!', 'The selected asset is no longer available. Please pick it again.');
      return;
    }

    this.saving = true;
    const payload: ComponentPayload = { name: this.componentForm.component, tag: this.componentForm.tag, assetId };
    const isEdit = !!this.componentForm.id;
    const request$ = isEdit
      ? this.apiService.updateComponent({ id: this.componentForm.id!, ...payload })
      : this.apiService.createComponent(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'Component updated successfully!' : 'Component created successfully!');
        this.loadComponents();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.showAlert('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  private deleteComponentConfirmed(component: ComponentRow): void {
    this.apiService.deleteComponent(Number(component.id)).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + component.component + '!.');
        this.loadComponents();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the component.'),
    });
  }

  private emptyForm(): ComponentFormModel {
    return { asset: null, component: '', tag: '' };
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
