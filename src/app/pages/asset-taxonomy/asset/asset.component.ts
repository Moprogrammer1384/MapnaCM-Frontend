import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import type { Asset, AssetSystem, TaxonomyParentOption, EmployerOption, InheritedEmployer } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/shared/components/data-table/pagination/table-pagination';

@Component({
  selector: 'app-asset',
  templateUrl: './asset.component.html',
  styleUrls: ['./asset.component.scss'],
})
export class AssetComponent implements OnInit {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  table = new TablePagination<Asset>(
    [],
    [
      { key: 'name', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'tag', title: 'Tag', class: 'min-w-125px' },
      { key: 'systemLabel', title: 'System Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employerName', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ] satisfies readonly TablePaginationColumn<Asset>[],
    { searchKeys: ['name', 'tag', 'systemLabel', 'employerName'] satisfies readonly Extract<keyof Asset, string>[] }
  );

  // Select values are IDs; hierarchy labels are for display only.
  systemOptions: TaxonomyParentOption[] = [];
  employers: EmployerOption[] = [];
  employerFilter: string | null = null;
  systemFilter: number | null = null;

  assetForm: Asset = this.emptyForm();
  saving = false;

  // unit id -> plant id (to inherit the plant's employer)
  private plantIdByUnitId: Record<number, number> = {};
  // system id -> unit id (to reach the plant's employer)
  private unitIdBySystemId: Record<number, number> = {};
  private employerByPlantId: Record<number, InheritedEmployer> = {};

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteAssetConfirmed(row);
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

  filterBySystem(systemId: number | null): void {
    this.systemFilter = systemId;
    this.table.setFilter('systemId', systemId);
  }

  refresh(): void {
    this.loadSystems();
  }

  private loadSystems(): void {
    this.apiService.getAllSystems().subscribe({
      next: (systems: AssetSystem[]) => {
        this.systemOptions = [];
        this.unitIdBySystemId = {};

        for (const system of systems) {
          if (system.id === undefined) {
            continue;
          }
          this.systemOptions.push({ id: system.id, label: system.hierarchyLabel ?? system.name });
          if (system.unitId !== null) {
            this.unitIdBySystemId[system.id] = system.unitId;
          }
        }
        this.systemOptions.sort((left, right) => left.label.localeCompare(right.label));

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
          if (unit.id === undefined) {
            continue;
          }
          if (unit.plantId !== null) {
            this.plantIdByUnitId[unit.id] = unit.plantId;
          }
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
          if (plant.id === undefined) {
            continue;
          }
          this.employerByPlantId[plant.id] = {
            id: plant.employerId ?? null,
            name: plant.employerName || '—',
          };
        }

        this.loadAssets();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load plants.'),
    });
  }

  private toAssetRow(asset: Asset): Asset {
    const employer = this.employerOfSystem(asset.systemId);
    return {
      ...asset,
      tag: asset.tag ?? null,
      employerName: employer?.name || '\u2014',
      employerId: employer?.id ?? null,
    };
  }

  private employerOfSystem(systemId: number | null): InheritedEmployer | undefined {
    if (systemId === null) {
      return undefined;
    }
    const unitId = this.unitIdBySystemId[systemId];
    const plantId = unitId !== undefined ? this.plantIdByUnitId[unitId] : undefined;
    return plantId !== undefined ? this.employerByPlantId[plantId] : undefined;
  }

  private loadAssets(): void {
    this.apiService.getAllAssets().subscribe({
      next: (assets) => {
        this.table.setRows(assets.map((asset) => this.toAssetRow(asset)), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load assets.'),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    this.assetForm = this.emptyForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, asset: Asset): void {
    this.assetForm = { id: asset.id, systemId: asset.systemId, name: asset.name, tag: asset.tag ?? '' };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.assetForm.name.trim() || this.assetForm.systemId === null) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    const systemId = this.assetForm.systemId;
    if (!this.systemOptions.some((system) => system.id === systemId)) {
      this.showAlert('error', 'Error!', 'The selected system is no longer available. Please pick it again.');
      return;
    }

    this.saving = true;
    const payload = { name: this.assetForm.name.trim(), tag: this.assetForm.tag ?? '', systemId };
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
  deleteAsset(asset: Asset): void {
    this.table.confirmDelete(asset, asset.name);
  }

  private deleteAssetConfirmed(asset: Asset): void {
    if (asset.id === undefined) {
      return;
    }
    this.apiService.deleteAsset(asset.id).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + asset.name + '!.');
        this.loadAssets();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the asset.'),
    });
  }

  private emptyForm(): Asset {
    return { systemId: null, name: '', tag: '' };
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
