import { Component, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ClientTable } from '../client-table';
import { EMPLOYERS, employerOf } from '../employers';

interface AssetRow extends Record<string, string> {
  employer: string;
  system: string;
  asset: string;
}

interface AssetFormModel {
  system: string | null;
  asset: string;
}

/**
 * Asset list, built on the same layout as the System page (no Mapna-UIUX
 * design exists for it yet). The backend has no Asset endpoints, so the rows
 * and the system options are static sample data; add / edit / delete only
 * change the in-memory rows.
 */
@Component({
  selector: 'app-asset',
  templateUrl: './asset.component.html',
  styleUrls: ['./asset.component.scss'],
})
export class AssetComponent {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  systemOptions = [
    'Gas Turbine System - Unit 1 - Parand Combined Cycle Power Plant',
    'Generator System - Unit 1 - Parand Combined Cycle Power Plant',
    'Steam Turbine System - Unit 2 - Parand Combined Cycle Power Plant',
    'Heat Recovery Steam Generator - Unit 1 - Isfahan Combined Cycle Power Plant',
    'Fuel Gas System - Unit 1 - Mashhad Gas Power Plant',
    'Cooling Water System - Unit 1 - Fars Combined Cycle Power Plant',
    'Boiler System - Unit 1 - Tabriz Thermal Power Plant',
    'Lube Oil System - Unit 1 - Ahvaz Zargan Power Plant',
    'Condensate System - Unit 1 - Bandar Abbas Steam Power Plant',
    'Control System - Unit 1 - Asaluyeh Combined Cycle Power Plant',
    'Inverter System - Unit 1 - Yazd Solar Power Plant',
    'Compressed Air System - Unit 1 - Kerman Combined Cycle Power Plant',
    'Fire Protection System - Unit 1 - Qom Combined Cycle Power Plant',
    'Pitch Control System - Unit 1 - Manjil Wind Farm',
  ];

  table = new ClientTable<AssetRow>(
    [
      { system: 'Gas Turbine System - Unit 1 - Parand Combined Cycle Power Plant', asset: 'Gas Turbine MGT-70' },
      { system: 'Gas Turbine System - Unit 1 - Parand Combined Cycle Power Plant', asset: 'Air Inlet Filter House' },
      { system: 'Generator System - Unit 1 - Parand Combined Cycle Power Plant', asset: 'Generator TRY-L' },
      { system: 'Steam Turbine System - Unit 2 - Parand Combined Cycle Power Plant', asset: 'HP/IP Steam Turbine' },
      { system: 'Heat Recovery Steam Generator - Unit 1 - Isfahan Combined Cycle Power Plant', asset: 'HP Drum' },
      { system: 'Fuel Gas System - Unit 1 - Mashhad Gas Power Plant', asset: 'Fuel Gas Compressor' },
      { system: 'Cooling Water System - Unit 1 - Fars Combined Cycle Power Plant', asset: 'Circulating Water Pump A' },
      { system: 'Boiler System - Unit 1 - Tabriz Thermal Power Plant', asset: 'Boiler Feed Pump' },
      { system: 'Lube Oil System - Unit 1 - Ahvaz Zargan Power Plant', asset: 'Main Lube Oil Pump' },
      { system: 'Condensate System - Unit 1 - Bandar Abbas Steam Power Plant', asset: 'Condensate Extraction Pump' },
      { system: 'Control System - Unit 1 - Asaluyeh Combined Cycle Power Plant', asset: 'DCS Controller Cabinet' },
      { system: 'Inverter System - Unit 1 - Yazd Solar Power Plant', asset: 'Central Inverter INV-01' },
      { system: 'Compressed Air System - Unit 1 - Kerman Combined Cycle Power Plant', asset: 'Instrument Air Compressor' },
      { system: 'Fire Protection System - Unit 1 - Qom Combined Cycle Power Plant', asset: 'Fire Water Pump' },
      { system: 'Pitch Control System - Unit 1 - Manjil Wind Farm', asset: 'Pitch Drive Motor' },
    ].map((r) => ({ ...r, employer: employerOf(r.system) })),
    [
      { key: 'asset', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'system', title: 'System Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employer', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ]
  );

  assetForm: AssetFormModel = this.emptyAssetForm();
  systemFilter: string | null = null;
  private editing: AssetRow | null = null;

  employers = EMPLOYERS;
  employerFilter: string | null = null;

  constructor(private modalService: NgbModal) {}

  filterByEmployer(employer: string | null): void {
    this.employerFilter = employer;
    this.table.setFilter('employer', employer);
  }

  filterBySystem(system: string | null): void {
    this.systemFilter = system;
    this.table.setFilter('system', system);
  }

  openAddModal(content: TemplateRef<any>): void {
    this.editing = null;
    this.assetForm = this.emptyAssetForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, asset: AssetRow): void {
    this.editing = asset;
    this.assetForm = { system: asset.system, asset: asset.asset };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (form.invalid || !this.assetForm.system) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    const row: AssetRow = { system: this.assetForm.system, asset: this.assetForm.asset, employer: employerOf(this.assetForm.system) };
    const isEdit = !!this.editing;
    this.table.rows = isEdit
      ? this.table.rows.map((r) => (r === this.editing ? row : r))
      : [...this.table.rows, row];
    modal.dismiss('saved');
    this.showAlert('success', 'Success!', isEdit ? 'Asset updated successfully!' : 'Asset created successfully!');
  }

  private emptyAssetForm(): AssetFormModel {
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
