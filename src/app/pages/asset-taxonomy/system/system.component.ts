import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AssetSystem, SystemPayload, Unit } from 'src/app/core/models/asset.model';
import { AssetApiService } from '../services/asset-api.service';
import { TablePagination } from 'src/app/_metronic/shared/Pagination/table-pagination';

interface SystemRow extends Record<string, string> {
  id: string;
  employer: string;
  unit: string;
  system: string;
}

interface SystemFormModel {
  id?: number;
  unit: string | null;
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
    ]
  );

  // Dropdown options are the display labels; ids are resolved through the
  // label -> id map filled when the units load.
  unitOptions: string[] = [];
  // Employer filter options (names of the Employer-role users, from the API).
  employers: string[] = [];
  employerFilter: string | null = null;
  unitFilter: string | null = null;

  systemForm: SystemFormModel = this.emptyForm();
  saving = false;

  private unitIdByLabel: Record<string, number> = {};
  // plant id -> employer display name (backend value or placeholder fallback)
  private employerByPlantId: Record<number, string> = {};
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

  filterByUnit(unit: string | null): void {
    this.unitFilter = unit;
    this.table.setFilter('unit', unit);
  }

  refresh(): void {
    this.loadUnits();
  }

  private loadUnits(): void {
    this.apiService.getAllUnits().subscribe({
      next: (units: Unit[]) => {
        this.unitOptions = [];
        this.unitIdByLabel = {};

        for (const unit of units) {
          // Backend hierarchy label: "City - Plant - Unit" (top-down).
          const label = unit.hierarchyLabel;
          this.unitOptions.push(label);
          this.unitIdByLabel[label] = unit.id;
          this.plantIdByUnitId[unit.id] = unit.plantId;
        }
        this.unitOptions.sort();

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

        this.loadSystems();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load plants.'),
    });
  }

  private toSystemRow(system: AssetSystem): SystemRow {
    return {
      id: String(system.id),
      system: system.name,
      unit: system.unitLabel,
      unitId: String(system.unitId),
      employer: this.employerOfUnit(system.unitId),
    };
  }

  private employerOfUnit(unitId: number): string {
    const plantId = this.plantIdByUnitId[unitId];
    return (plantId && this.employerByPlantId[plantId]) || '—';
  }

  private loadSystems(): void {
    this.apiService.getAllSystems().subscribe({
      next: (systems) => {
        this.table.rows = systems.map((system) => this.toSystemRow(system));
        this.table.page = 1;
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
    this.systemForm = { id: Number(system.id), unit: system.unit, system: system.system };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.systemForm.unit) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    const unitId = this.unitIdByLabel[this.systemForm.unit];
    if (!unitId) {
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
    this.apiService.deleteSystem(Number(system.id)).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + system.system + '!.');
        this.loadSystems();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the system.'),
    });
  }

  private emptyForm(): SystemFormModel {
    return { unit: null, system: '' };
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
