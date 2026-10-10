import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import type { Unit, TaxonomyParentOption, EmployerOption, InheritedEmployer } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/shared/components/data-table/pagination/table-pagination';

@Component({
  selector: 'app-unit',
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.scss'],
})
export class UnitComponent implements OnInit {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  table = new TablePagination<Unit>(
    [],
    [
      { key: 'name', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'plantLabel', title: 'Plant Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employerName', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ] satisfies readonly TablePaginationColumn<Unit>[],
    { searchKeys: ['name', 'plantLabel', 'employerName'] satisfies readonly Extract<keyof Unit, string>[] }
  );

  // Select values are IDs; hierarchy labels are for display only.
  plantOptions: TaxonomyParentOption[] = [];
  employers: EmployerOption[] = [];
  employerFilter: string | null = null;
  plantFilter: number | null = null;

  unitForm: Unit = this.emptyForm();
  saving = false;

  private employerByPlantId: Record<number, InheritedEmployer> = {};

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
          if (plant.id === undefined) {
            continue;
          }
          this.plantOptions.push({ id: plant.id, label: plant.hierarchyLabel ?? plant.name });
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

  private toUnitRow(unit: Unit): Unit {
    const employer = unit.plantId === null ? undefined : this.employerByPlantId[unit.plantId];
    return {
      ...unit,
      employerName: employer?.name || '\u2014',
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

  openEditModal(content: TemplateRef<any>, unit: Unit): void {
    this.unitForm = { id: unit.id, plantId: unit.plantId, name: unit.name };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.unitForm.name.trim() || this.unitForm.plantId === null) {
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
    const payload = { name: this.unitForm.name.trim(), plantId };
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
  deleteUnit(unit: Unit): void {
    this.table.confirmDelete(unit, unit.name);
  }

  private deleteUnitConfirmed(unit: Unit): void {
    if (unit.id === undefined) {
      return;
    }
    this.apiService.deleteUnit(unit.id).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + unit.name + '!.');
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

  private emptyForm(): Unit {
    return { plantId: null, name: '' };
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
