import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ComponentPayload, TaxonomyComponent } from 'src/app/core/models/asset.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/shared/component/data-table/pagination/table-pagination';

interface ComponentRow {
  id: number;
  employer: string;
  employerId: string | null;
  asset: string;
  assetId: number;
  component: string;
  tag: string | null;
}

interface ComponentFormModel {
  id?: number;
  assetId: number | null;
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
    ] satisfies readonly TablePaginationColumn<ComponentRow>[],
    { searchKeys: ['component', 'tag', 'asset', 'employer'] satisfies readonly Extract<keyof ComponentRow, string>[] }
  );

  // Select values are IDs; hierarchy labels are for display only.
  assetOptions: { id: number; label: string }[] = [];
  employers: { id: string; name: string }[] = [];
  employerFilter: string | null = null;
  assetFilter: number | null = null;
  componentForm: ComponentFormModel = this.emptyForm();
  saving = false;

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
    this.table.onConfirmedDelete = (row) => this.deleteComponentConfirmed(row);
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

  filterByAsset(assetId: number | null): void {
    this.assetFilter = assetId;
    this.table.setFilter('assetId', assetId);
  }

  refresh(): void {
    this.loadAssets();
  }

  private loadAssets(): void {
    this.apiService.getAllAssets().subscribe({
      next: (assets) => {
        this.assetOptions = [];
        this.systemIdByAssetId = {};
        for (const asset of assets) {
          this.assetOptions.push({ id: asset.id, label: asset.hierarchyLabel });
          this.systemIdByAssetId[asset.id] = asset.systemId;
        }
        this.assetOptions.sort((left, right) => left.label.localeCompare(right.label));
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

  private employerOfAsset(assetId: number): { id: string | null; name: string } | undefined {
    const systemId = this.systemIdByAssetId[assetId];
    const unitId = systemId !== undefined ? this.unitIdBySystemId[systemId] : undefined;
    const plantId = unitId !== undefined ? this.plantIdByUnitId[unitId] : undefined;
    return plantId !== undefined ? this.employerByPlantId[plantId] : undefined;
  }

  private toComponentRow(component: TaxonomyComponent): ComponentRow {
    const employer = this.employerOfAsset(component.assetId);
    return {
      id: component.id,
      component: component.name,
      tag: component.tag ?? null,
      // Parent labels are displayed independently of the selected asset ID.
      asset: component.assetLabel,
      assetId: component.assetId,
      employer: employer?.name || '—',
      employerId: employer?.id ?? null,
    };
  }

  private loadComponents(): void {
    this.apiService.getAllComponents().subscribe({
      next: (components) => {
        this.table.setRows(components.map((component) => this.toComponentRow(component)), { resetPage: true });
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
      id: component.id, assetId: component.assetId, component: component.component, tag: component.tag ?? '',
    };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || this.componentForm.assetId === null) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }
    const assetId = this.componentForm.assetId;
    if (!this.assetOptions.some((asset) => asset.id === assetId)) {
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
    this.apiService.deleteComponent(component.id).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + component.component + '!.');
        this.loadComponents();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the component.'),
    });
  }

  private emptyForm(): ComponentFormModel {
    return { assetId: null, component: '', tag: '' };
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
