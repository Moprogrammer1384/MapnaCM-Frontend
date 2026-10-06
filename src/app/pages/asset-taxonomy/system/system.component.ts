import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AssetSystem, SystemPayload, Unit } from 'src/app/core/models/asset.model';
import { AssetApiService } from '../services/asset-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/_metronic/shared/Pagination/table-pagination';

interface SystemRow {
  id: number;
  employer: string;
  employerId: string | null;
  unit: string;
  unitId: number;
  system: string;
}

interface SystemFormModel {
  id?: number;
  unitId: number | null;
  system: string;
}

@Component({
  selector: 'app-system',
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss'],
})
export class SystemComponent implements OnInit {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  table = new TablePagination<SystemRow>(
    [],
    [
      { key: 'system', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'unit', title: 'Unit Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employer', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ] satisfies readonly TablePaginationColumn<SystemRow>[]
  );

  // Select values are IDs; hierarchy labels are for display only.
  unitOptions: { id: number; label: string }[] = [];
  employers: { id: string; name: string }[] = [];
  employerFilter: string | null = null;
  unitFilter: number | null = null;

  systemForm: SystemFormModel = this.emptyForm();
  saving = false;

  private employerByPlantId: Record<number, { id: string | null; name: string }> = {};
  // unit id -> plant id (to inherit the plant's employer)
  private plantIdByUnitId: Record<number, number> = {};

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteSystemConfirmed(row);
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

  filterByUnit(unitId: number | null): void {
    this.unitFilter = unitId;
    this.table.setFilter('unitId', unitId);
  }

  refresh(): void {
    this.loadUnits();
  }

  private loadUnits(): void {
    this.apiService.getAllUnits().subscribe({
      next: (units: Unit[]) => {
        this.unitOptions = [];
        this.plantIdByUnitId = {};

        for (const unit of units) {
          this.unitOptions.push({ id: unit.id, label: unit.hierarchyLabel });
          this.plantIdByUnitId[unit.id] = unit.plantId;
        }
        this.unitOptions.sort((left, right) => left.label.localeCompare(right.label));

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

        this.loadSystems();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load plants.'),
    });
  }

  private toSystemRow(system: AssetSystem): SystemRow {
    const employer = this.employerOfUnit(system.unitId);
    return {
      id: system.id,
      system: system.name,
      unit: system.unitLabel,
      unitId: system.unitId,
      employer: employer?.name || '—',
      employerId: employer?.id ?? null,
    };
  }

  private employerOfUnit(unitId: number): { id: string | null; name: string } | undefined {
    const plantId = this.plantIdByUnitId[unitId];
    return plantId !== undefined ? this.employerByPlantId[plantId] : undefined;
  }

  private loadSystems(): void {
    this.apiService.getAllSystems().subscribe({
      next: (systems) => {
        this.table.setRows(systems.map((system) => this.toSystemRow(system)), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load systems.'),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    this.systemForm = this.emptyForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, system: SystemRow): void {
    this.systemForm = { id: system.id, unitId: system.unitId, system: system.system };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || this.systemForm.unitId === null) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    const unitId = this.systemForm.unitId;
    if (!this.unitOptions.some((unit) => unit.id === unitId)) {
      this.showAlert('error', 'Error!', 'The selected unit is no longer available. Please pick it again.');
      return;
    }

    this.saving = true;
    const payload: SystemPayload = { name: this.systemForm.system, unitId };
    const isEdit = !!this.systemForm.id;
    const request$ = isEdit
      ? this.apiService.updateSystem({ id: this.systemForm.id!, ...payload })
      : this.apiService.createSystem(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'System updated successfully!' : 'System created successfully!');
        this.loadSystems();
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
  deleteSystem(system: SystemRow): void {
    this.table.confirmDelete(system, system.system);
  }

  private deleteSystemConfirmed(system: SystemRow): void {
    this.apiService.deleteSystem(system.id).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + system.system + '!.');
        this.loadSystems();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the system.'),
    });
  }

  private emptyForm(): SystemFormModel {
    return { unitId: null, system: '' };
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
