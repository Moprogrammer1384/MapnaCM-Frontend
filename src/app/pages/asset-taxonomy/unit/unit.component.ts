import { Component, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ClientTable } from '../client-table';

interface UnitRow extends Record<string, string> {
  plant: string;
  unit: string;
}

interface UnitFormModel {
  plant: string | null;
  unit: string;
}

/**
 * Port of Mapna-UIUX customize/unit.html. The backend has no Unit endpoints
 * yet, so the rows and the plant options are the design's static data;
 * add / edit / delete only change the in-memory rows.
 */
@Component({
  selector: 'app-unit',
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.scss'],
})
export class UnitComponent {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  plantOptions = [
    'Parand Combined Cycle Power Plant - Tehran - Combined Cycle',
    'Mapna Turbine Engineering (TUGA) - Karaj - Manufacturing',
    'Pars Generator Plant - Karaj - Manufacturing',
    'Isfahan Combined Cycle Power Plant - Isfahan - Combined Cycle',
    'Mashhad Gas Power Plant - Mashhad - Gas Turbine',
    'Fars Combined Cycle Power Plant - Shiraz - Combined Cycle',
    'Tabriz Thermal Power Plant - Tabriz - Steam',
    'Ahvaz Zargan Power Plant - Ahvaz - Gas Turbine',
    'Bandar Abbas Steam Power Plant - Bandar Abbas - Steam',
    'Asaluyeh Combined Cycle Power Plant - Asaluyeh - Combined Cycle',
    'Yazd Solar Power Plant - Yazd - Solar',
    'Kerman Combined Cycle Power Plant - Kerman - Combined Cycle',
    'Shazand Power Plant - Arak - Steam',
    'Qom Combined Cycle Power Plant - Qom - Combined Cycle',
    'Manjil Wind Farm - Rasht - Wind',
  ];

  table = new ClientTable<UnitRow>(
    [
      { plant: 'Parand Combined Cycle Power Plant - Tehran - Combined Cycle', unit: 'Unit 1' },
      { plant: 'Parand Combined Cycle Power Plant - Tehran - Combined Cycle', unit: 'Unit 2' },
      { plant: 'Isfahan Combined Cycle Power Plant - Isfahan - Combined Cycle', unit: 'Unit 1' },
      { plant: 'Mashhad Gas Power Plant - Mashhad - Gas Turbine', unit: 'Unit 1' },
      { plant: 'Fars Combined Cycle Power Plant - Shiraz - Combined Cycle', unit: 'Unit 1' },
      { plant: 'Tabriz Thermal Power Plant - Tabriz - Steam', unit: 'Unit 1' },
      { plant: 'Ahvaz Zargan Power Plant - Ahvaz - Gas Turbine', unit: 'Unit 1' },
      { plant: 'Bandar Abbas Steam Power Plant - Bandar Abbas - Steam', unit: 'Unit 1' },
      { plant: 'Asaluyeh Combined Cycle Power Plant - Asaluyeh - Combined Cycle', unit: 'Unit 1' },
      { plant: 'Yazd Solar Power Plant - Yazd - Solar', unit: 'Unit 1' },
      { plant: 'Kerman Combined Cycle Power Plant - Kerman - Combined Cycle', unit: 'Unit 1' },
      { plant: 'Shazand Power Plant - Arak - Steam', unit: 'Unit 1' },
      { plant: 'Qom Combined Cycle Power Plant - Qom - Combined Cycle', unit: 'Unit 1' },
      { plant: 'Manjil Wind Farm - Rasht - Wind', unit: 'Unit 1' },
    ],
    [
      { key: 'unit', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'plant', title: 'Plant Name', class: 'min-w-175px min-w-md-250px' },
    ]
  );

  unitForm: UnitFormModel = this.emptyUnitForm();
  plantFilter: string | null = null;
  private editing: UnitRow | null = null;

  constructor(private modalService: NgbModal) {}

  filterByPlant(plant: string | null): void {
    this.plantFilter = plant;
    this.table.setFilter('plant', plant);
  }

  openAddModal(content: TemplateRef<any>): void {
    this.editing = null;
    this.unitForm = this.emptyUnitForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, unit: UnitRow): void {
    this.editing = unit;
    this.unitForm = { plant: unit.plant, unit: unit.unit };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (form.invalid || !this.unitForm.plant) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    const row: UnitRow = { plant: this.unitForm.plant, unit: this.unitForm.unit };
    const isEdit = !!this.editing;
    this.table.rows = isEdit
      ? this.table.rows.map((r) => (r === this.editing ? row : r))
      : [...this.table.rows, row];
    modal.dismiss('saved');
    this.showAlert('success', 'Success!', isEdit ? 'Unit updated successfully!' : 'Unit created successfully!');
  }

  private emptyUnitForm(): UnitFormModel {
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
