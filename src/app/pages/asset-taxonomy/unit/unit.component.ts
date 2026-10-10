import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Unit, UnitPayload } from 'src/app/core/models/asset.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/custom-components/data-table/Pagination/table-pagination';

interface UnitRow {
  id: number;
  employer: string;
  employerId: string | null;
  plant: string;
  plantId: number;
  unit: string;
}

interface UnitFormModel {
  id?: number;
  plantId: number | null;
  unit: string;
}

@Component({
  selector: 'app-unit',
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.scss'],
})
export class UnitComponent implements OnInit {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  table = new TablePagination<UnitRow>(
    [],
    [
      { key: 'unit', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'plant', title: 'Plant Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employer', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ] satisfies readonly TablePaginationColumn<UnitRow>[],
    { searchKeys: ['unit', 'plant', 'employer'] satisfies readonly Extract<keyof UnitRow, string>[] }
  );

  // Select values are IDs; hierarchy labels are for display only.
  plantOptions: { id: number; label: string }[] = [];
  employers: { id: string; name: string }[] = [];
  employerFilter: string | null = null;
  plantFilter: number | null = null;

  unitForm: UnitFormModel = this.emptyForm();
  saving = false;

  private employerByPlantId: Record<number, { id: string | null; name: string }> = {};

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteUnitConfirmed(row);
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

  filterByPlant(plantId: number | null): void {
    this.plantFilter = plantId;
    this.table.setFilter('plantId', plantId);
  }

  refresh(): void {
    this.loadPlants();
  }

  private loadPlants(): void {
    this.apiService.getAllPlants().subscribe({
      next: (plants) => {
        this.plantOptions = [];
        this.employerByPlantId = {};

        for (const plant of plants) {
          this.plantOptions.push({ id: plant.id, label: plant.hierarchyLabel });
          this.employerByPlantId[plant.id] = {
            id: plant.employerId ?? null,
            name: plant.employerName || '—',
          };
        }
        this.plantOptions.sort((left, right) => left.label.localeCompare(right.label));

        this.loadUnits();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load plants.'),
    });
  }

  private toUnitRow(unit: Unit): UnitRow {
    const employer = this.employerByPlantId[unit.plantId];
    return {
      id: unit.id,
      unit: unit.name,
      plant: unit.plantLabel,
      plantId: unit.plantId,
      employer: employer?.name || '—',
      employerId: employer?.id ?? null,
    };
  }

  private loadUnits(): void {
    this.apiService.getAllUnits().subscribe({
      next: (units) => {
        this.table.setRows(units.map((unit) => this.toUnitRow(unit)), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load units.'),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    this.unitForm = this.emptyForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, unit: UnitRow): void {
    this.unitForm = { id: unit.id, plantId: unit.plantId, unit: unit.unit };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || this.unitForm.plantId === null) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    const plantId = this.unitForm.plantId;
    if (!this.plantOptions.some((plant) => plant.id === plantId)) {
      this.showAlert('error', 'Error!', 'The selected plant is no longer available. Please pick it again.');
      return;
    }

    this.saving = true;
    const payload: UnitPayload = { name: this.unitForm.unit, plantId };
    const isEdit = !!this.unitForm.id;
    const request$ = isEdit
      ? this.apiService.updateUnit({ id: this.unitForm.id!, ...payload })
      : this.apiService.createUnit(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'Unit updated successfully!' : 'Unit created successfully!');
        this.loadUnitsOnly();
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
  deleteUnit(unit: UnitRow): void {
    this.table.confirmDelete(unit, unit.unit);
  }

  private deleteUnitConfirmed(unit: UnitRow): void {
    this.apiService.deleteUnit(unit.id).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + unit.unit + '!.');
        this.loadUnitsOnly();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the unit.'),
    });
  }

  // After a mutation only the unit list changes; the plant maps are current.
  private loadUnitsOnly(): void {
    this.apiService.getAllUnits().subscribe({
      next: (units) => {
        this.table.setRows(units.map((unit) => this.toUnitRow(unit)), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load units.'),
    });
  }

  private emptyForm(): UnitFormModel {
    return { plantId: null, unit: '' };
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
