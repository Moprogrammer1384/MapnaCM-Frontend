import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { Unit, UnitPayload } from 'src/app/core/models/asset.model';
import { AssetApiService } from '../services/asset-api.service';
import { ClientTable } from '../client-table';

interface UnitRow extends Record<string, string> {
  id: string;
  employer: string;
  plant: string;
  unit: string;
}

interface UnitFormModel {
  id?: number;
  plant: string | null;
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

  table = new ClientTable<UnitRow>(
    [],
    [
      { key: 'unit', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'plant', title: 'Plant Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employer', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ]
  );

  // Dropdown options are the display labels; ids are resolved through the
  // label -> id map filled when the plants load.
  plantOptions: string[] = [];
  // Employer filter options (names of the Employer-role users, from the API).
  employers: string[] = [];
  employerFilter: string | null = null;
  plantFilter: string | null = null;

  unitForm: UnitFormModel = this.emptyForm();
  saving = false;

  private plantIdByLabel: Record<string, number> = {};
  // plant id -> employer display name (backend value or placeholder fallback)
  private employerByPlantId: Record<number, string> = {};

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

  filterByPlant(plant: string | null): void {
    this.plantFilter = plant;
    this.table.setFilter('plant', plant);
  }

  refresh(): void {
    this.loadPlants();
  }

  private loadPlants(): void {
    this.apiService.getAllPlants().subscribe({
      next: (plants) => {
        this.plantOptions = [];
        this.plantIdByLabel = {};
        this.employerByPlantId = {};

        for (const plant of plants) {
          // Backend hierarchy label: "City - PlantName" (top-down).
          const label = plant.hierarchyLabel;
          this.plantOptions.push(label);
          this.plantIdByLabel[label] = plant.id;
          this.employerByPlantId[plant.id] = plant.employerName || '—';
        }
        this.plantOptions.sort();

        this.loadUnits();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load plants.'),
    });
  }

  private toUnitRow(unit: Unit): UnitRow {
    return {
      id: String(unit.id),
      unit: unit.name,
      plant: unit.plantLabel,
      plantId: String(unit.plantId),
      employer: this.employerByPlantId[unit.plantId] || '—',
    };
  }

  private loadUnits(): void {
    this.apiService.getAllUnits().subscribe({
      next: (units) => {
        this.table.rows = units.map((unit) => this.toUnitRow(unit));
        this.table.page = 1;
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
    this.unitForm = { id: Number(unit.id), plant: unit.plant, unit: unit.unit };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.unitForm.plant) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    const plantId = this.plantIdByLabel[this.unitForm.plant];
    if (!plantId) {
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
    this.apiService.deleteUnit(Number(unit.id)).subscribe({
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
        this.table.rows = units.map((unit) => this.toUnitRow(unit));
        this.table.page = 1;
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load units.'),
    });
  }

  private emptyForm(): UnitFormModel {
    return { plant: null, unit: '' };
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
