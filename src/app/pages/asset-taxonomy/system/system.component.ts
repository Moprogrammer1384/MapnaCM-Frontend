import { Component, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ClientTable } from '../client-table';

interface SystemRow extends Record<string, string> {
  unit: string;
  system: string;
}

interface SystemFormModel {
  unit: string | null;
  system: string;
}

/**
 * Port of Mapna-UIUX customize/system.html. The backend has no System endpoints
 * yet, so the rows and the unit options are the design's static data;
 * add / edit / delete only change the in-memory rows.
 */
@Component({
  selector: 'app-system',
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss'],
})
export class SystemComponent {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  unitOptions = [
    'Unit 1 - Parand Combined Cycle Power Plant',
    'Unit 2 - Parand Combined Cycle Power Plant',
    'Unit 1 - Isfahan Combined Cycle Power Plant',
    'Unit 1 - Mashhad Gas Power Plant',
    'Unit 1 - Fars Combined Cycle Power Plant',
    'Unit 1 - Tabriz Thermal Power Plant',
    'Unit 1 - Ahvaz Zargan Power Plant',
    'Unit 1 - Bandar Abbas Steam Power Plant',
    'Unit 1 - Asaluyeh Combined Cycle Power Plant',
    'Unit 1 - Yazd Solar Power Plant',
    'Unit 1 - Kerman Combined Cycle Power Plant',
    'Unit 1 - Shazand Power Plant',
    'Unit 1 - Qom Combined Cycle Power Plant',
    'Unit 1 - Manjil Wind Farm',
  ];

  table = new ClientTable<SystemRow>(
    [
      { unit: 'Unit 1 - Parand Combined Cycle Power Plant', system: 'Gas Turbine System' },
      { unit: 'Unit 1 - Parand Combined Cycle Power Plant', system: 'Generator System' },
      { unit: 'Unit 2 - Parand Combined Cycle Power Plant', system: 'Steam Turbine System' },
      { unit: 'Unit 1 - Isfahan Combined Cycle Power Plant', system: 'Heat Recovery Steam Generator' },
      { unit: 'Unit 1 - Mashhad Gas Power Plant', system: 'Fuel Gas System' },
      { unit: 'Unit 1 - Fars Combined Cycle Power Plant', system: 'Cooling Water System' },
      { unit: 'Unit 1 - Tabriz Thermal Power Plant', system: 'Boiler System' },
      { unit: 'Unit 1 - Ahvaz Zargan Power Plant', system: 'Lube Oil System' },
      { unit: 'Unit 1 - Bandar Abbas Steam Power Plant', system: 'Condensate System' },
      { unit: 'Unit 1 - Asaluyeh Combined Cycle Power Plant', system: 'Control System' },
      { unit: 'Unit 1 - Yazd Solar Power Plant', system: 'Inverter System' },
      { unit: 'Unit 1 - Kerman Combined Cycle Power Plant', system: 'Compressed Air System' },
      { unit: 'Unit 1 - Qom Combined Cycle Power Plant', system: 'Fire Protection System' },
      { unit: 'Unit 1 - Manjil Wind Farm', system: 'Pitch Control System' },
    ],
    [
      { key: 'system', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'unit', title: 'Unit Name', class: 'min-w-175px min-w-md-250px' },
    ]
  );

  systemForm: SystemFormModel = this.emptySystemForm();
  unitFilter: string | null = null;
  private editing: SystemRow | null = null;

  constructor(private modalService: NgbModal) {}

  filterByUnit(unit: string | null): void {
    this.unitFilter = unit;
    this.table.setFilter('unit', unit);
  }

  openAddModal(content: TemplateRef<any>): void {
    this.editing = null;
    this.systemForm = this.emptySystemForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, system: SystemRow): void {
    this.editing = system;
    this.systemForm = { unit: system.unit, system: system.system };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (form.invalid || !this.systemForm.unit) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    const row: SystemRow = { unit: this.systemForm.unit, system: this.systemForm.system };
    const isEdit = !!this.editing;
    this.table.rows = isEdit
      ? this.table.rows.map((r) => (r === this.editing ? row : r))
      : [...this.table.rows, row];
    modal.dismiss('saved');
    this.showAlert('success', 'Success!', isEdit ? 'System updated successfully!' : 'System created successfully!');
  }

  private emptySystemForm(): SystemFormModel {
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
