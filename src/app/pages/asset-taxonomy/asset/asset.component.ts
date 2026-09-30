import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AssetPayload } from 'src/app/core/models/asset.model';
import { AssetApiService } from '../services/asset-api.service';
import { ClientTable } from '../client-table';
import { EMPLOYERS, employerOf } from '../employers';

interface AssetRow extends Record<string, string> {
  id: string;
  employer: string;
  system: string;
  asset: string;
}

interface AssetFormModel {
  id?: number;
  system: string | null;
  asset: string;
}

@Component({
  selector: 'app-asset',
  templateUrl: './asset.component.html',
  styleUrls: ['./asset.component.scss'],
})
export class AssetComponent implements OnInit {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  table = new ClientTable<AssetRow>(
    [],
    [
      { key: 'asset', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'system', title: 'System Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employer', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ]
  );

  // Dropdown options are the display labels; ids are resolved through the
  // label -> id map filled when the systems load.
  systemOptions: string[] = [];
  employers: string[] = EMPLOYERS;
  employerFilter: string | null = null;
  systemFilter: string | null = null;

  assetForm: AssetFormModel = this.emptyForm();
  saving = false;

  private systemIdByLabel: Record<string, number> = {};
  // unit id -> plant id (to inherit the plant's employer)
  private plantIdByUnitId: Record<number, number> = {};
  // system id -> unit id (to reach the plant's employer)
  private unitIdBySystemId: Record<number, number> = {};
  // plant id -> employer display name (backend value or placeholder fallback)
  private employerByPlantId: Record<number, string> = {};

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteAssetConfirmed(row);
    this.refresh();
  }

  filterByEmployer(employer: string | null): void {
    this.employerFilter = employer;
    this.table.setFilter('employer', employer);
  }

  filterBySystem(system: string | null): void {
    this.systemFilter = system;
    this.table.setFilter('system', system);
  }

  refresh(): void {
    this.loadSystems();
  }

  private loadSystems(): void {
    this.apiService.getAllSystems().subscribe({
      next: (systems) => {
        this.systemOptions = [];
        this.systemIdByLabel = {};
        this.unitIdBySystemId = {};

        for (const system of systems) {
          const label = `${system.name} - ${system.unitLabel}`;
          this.systemOptions.push(label);
          this.systemIdByLabel[label] = system.id;
          this.unitIdBySystemId[system.id] = system.unitId;
        }
        this.systemOptions.sort();

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

        this.loadAssets();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load plants.'),
    });
  }

  private employerOfSystem(systemId: number, fallbackLabel: string): string {
    const unitId = this.unitIdBySystemId[systemId];
    const plantId = unitId !== undefined ? this.plantIdByUnitId[unitId] : undefined;
    return (plantId && this.employerByPlantId[plantId]) || employerOf(fallbackLabel);
  }

  private loadAssets(): void {
    this.apiService.getAllAssets().subscribe({
      next: (assets) => {
        this.table.rows = assets.map((asset) => ({
          id: String(asset.id),
          asset: asset.name,
          system: asset.systemLabel,
          systemId: String(asset.systemId),
          employer: this.employerOfSystem(asset.systemId, asset.systemLabel),
        }));
        this.table.page = 1;
        this.employers = [...new Set([...EMPLOYERS, ...this.table.rows.map((row) => row.employer)])]
          .filter(Boolean)
          .sort();
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load assets.'),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    this.assetForm = this.emptyForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, asset: AssetRow): void {
    this.assetForm = { id: Number(asset.id), system: asset.system, asset: asset.asset };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.assetForm.system) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    const systemId = this.systemIdByLabel[this.assetForm.system];
    if (!systemId) {
      this.showAlert('error', 'Error!', 'The selected system is no longer available. Please pick it again.');
      return;
    }

    this.saving = true;
    const payload: AssetPayload = { name: this.assetForm.asset, systemId };
    const isEdit = !!this.assetForm.id;
    const request$ = isEdit
      ? this.apiService.updateAsset({ id: this.assetForm.id!, ...payload })
      : this.apiService.createAsset(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'Asset updated successfully!' : 'Asset created successfully!');
        this.loadAssets();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.showAlert('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  // Opens the Metronic confirmation dialog; the API delete only runs from
  // the onConfirmedDelete callback after the admin confirms.
  deleteAsset(asset: AssetRow): void {
    this.table.confirmDelete(asset, asset.asset);
  }

  private deleteAssetConfirmed(asset: AssetRow): void {
    this.apiService.deleteAsset(Number(asset.id)).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + asset.asset + '!.');
        this.loadAssets();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the asset.'),
    });
  }

  private emptyForm(): AssetFormModel {
    return { system: null, asset: '' };
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
