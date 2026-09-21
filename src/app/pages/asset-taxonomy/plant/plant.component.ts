import { Component, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ClientTable } from '../client-table';

interface PlantRow extends Record<string, string> {
  name: string;
  type: string;
  site: string;
}

interface TypeRow extends Record<string, string> {
  name: string;
}

@Component({
  selector: 'app-plant',
  templateUrl: './plant.component.html',
  styleUrls: ['./plant.component.scss'],
})
export class PlantComponent {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  // Demo rows ported from Mapna-UIUX/customize/plant.html; to be replaced by the API.
  plants = new ClientTable<PlantRow>(
    [
      { name: 'Parand Combined Cycle Power Plant', type: 'Combined Cycle', site: 'Tehran (35.6892, 51.3890)' },
      { name: 'Mapna Turbine Engineering (TUGA)', type: 'Manufacturing', site: 'Karaj (35.8400, 50.9391)' },
      { name: 'Pars Generator Plant', type: 'Manufacturing', site: 'Karaj (35.8400, 50.9391)' },
      { name: 'Isfahan Combined Cycle Power Plant', type: 'Combined Cycle', site: 'Isfahan (32.6539, 51.6660)' },
      { name: 'Mashhad Gas Power Plant', type: 'Gas Turbine', site: 'Mashhad (36.2605, 59.6168)' },
      { name: 'Fars Combined Cycle Power Plant', type: 'Combined Cycle', site: 'Shiraz (29.5918, 52.5837)' },
      { name: 'Tabriz Thermal Power Plant', type: 'Steam', site: 'Tabriz (38.0800, 46.2919)' },
      { name: 'Ahvaz Zargan Power Plant', type: 'Gas Turbine', site: 'Ahvaz (31.3183, 48.6706)' },
      { name: 'Bandar Abbas Steam Power Plant', type: 'Steam', site: 'Bandar Abbas (27.1832, 56.2666)' },
      { name: 'Asaluyeh Combined Cycle Power Plant', type: 'Combined Cycle', site: 'Asaluyeh (27.4750, 52.6081)' },
      { name: 'Yazd Solar Power Plant', type: 'Solar', site: 'Yazd (31.8974, 54.3569)' },
      { name: 'Kerman Combined Cycle Power Plant', type: 'Combined Cycle', site: 'Kerman (30.2839, 57.0834)' },
      { name: 'Shazand Power Plant', type: 'Steam', site: 'Arak (34.0917, 49.6890)' },
      { name: 'Qom Combined Cycle Power Plant', type: 'Combined Cycle', site: 'Qom (34.6416, 50.8746)' },
      { name: 'Manjil Wind Farm', type: 'Wind', site: 'Rasht (37.2808, 49.5832)' },
    ],
    [
      { key: 'name', title: 'Name', class: 'min-w-250px' },
      { key: 'type', title: 'Type', class: 'min-w-150px' },
      { key: 'site', title: 'Site', class: 'min-w-150px' },
    ]
  );

  types = new ClientTable<TypeRow>(
    [
      { name: 'Combined Cycle' },
      { name: 'Gas Turbine' },
      { name: 'Steam' },
      { name: 'Solar' },
      { name: 'Wind' },
      { name: 'Hydro' },
      { name: 'Manufacturing' },
    ],
    [{ key: 'name', title: 'Name', class: 'min-w-150px' }]
  );

  // Options for the Type / Site selects in the plant modals.
  typeOptions = ['Combined Cycle', 'Gas Turbine', 'Steam', 'Solar', 'Wind', 'Hydro', 'Manufacturing'];
  // Sites are shown as "name (latitude, longitude)", taken from the Site page data.
  siteOptions = [
    'Tehran (35.6892, 51.3890)',
    'Karaj (35.8400, 50.9391)',
    'Isfahan (32.6539, 51.6660)',
    'Mashhad (36.2605, 59.6168)',
    'Shiraz (29.5918, 52.5837)',
    'Tabriz (38.0800, 46.2919)',
    'Ahvaz (31.3183, 48.6706)',
    'Bandar Abbas (27.1832, 56.2666)',
    'Asaluyeh (27.4750, 52.6081)',
    'Yazd (31.8974, 54.3569)',
    'Kerman (30.2839, 57.0834)',
    'Arak (34.0917, 49.6890)',
    'Qom (34.6416, 50.8746)',
    'Rasht (37.2808, 49.5832)',
    'Hamadan (34.7983, 48.5148)',
  ];

  constructor(private modalService: NgbModal) {}

  openModal(content: TemplateRef<any>): void {
    this.modalService.open(content, this.modalConfig);
  }

  deletePlant(plant: PlantRow): void {
    this.plants.confirmDelete(plant, plant.name);
  }

  deleteType(type: TypeRow): void {
    this.types.confirmDelete(type, type.name);
  }
}
