import { Component, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ClientTable } from '../client-table';

interface SiteRow extends Record<string, string> {
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  location: string;
  elevation: string;
}

@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.scss'],
})
export class SiteComponent {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  // Demo rows ported from Mapna-UIUX/customize/site.html; to be replaced by the API.
  table = new ClientTable<SiteRow>(
    [
      { city: 'Tehran', address: 'Valiasr St., District 6', latitude: '35.6892', longitude: '51.3890', location: 'Tehran Province', elevation: '1,190 m' },
      { city: 'Karaj', address: 'Fardis Industrial Zone, Taleghani Blvd.', latitude: '35.8400', longitude: '50.9391', location: 'Alborz Province', elevation: '1,312 m' },
      { city: 'Isfahan', address: 'Chahar Bagh Abbasi St.', latitude: '32.6539', longitude: '51.6660', location: 'Isfahan Province', elevation: '1,574 m' },
      { city: 'Mashhad', address: 'Imam Reza St.', latitude: '36.2605', longitude: '59.6168', location: 'Razavi Khorasan Province', elevation: '995 m' },
      { city: 'Shiraz', address: 'Zand St.', latitude: '29.5918', longitude: '52.5837', location: 'Fars Province', elevation: '1,486 m' },
      { city: 'Tabriz', address: 'Imam Khomeini St.', latitude: '38.0800', longitude: '46.2919', location: 'East Azerbaijan Province', elevation: '1,351 m' },
      { city: 'Ahvaz', address: 'Naderi St.', latitude: '31.3183', longitude: '48.6706', location: 'Khuzestan Province', elevation: '18 m' },
      { city: 'Bandar Abbas', address: 'Imam Khomeini Blvd.', latitude: '27.1832', longitude: '56.2666', location: 'Hormozgan Province', elevation: '9 m' },
      { city: 'Asaluyeh', address: 'Pars Special Economic Energy Zone', latitude: '27.4750', longitude: '52.6081', location: 'Bushehr Province', elevation: '5 m' },
      { city: 'Yazd', address: 'Kashani St.', latitude: '31.8974', longitude: '54.3569', location: 'Yazd Province', elevation: '1,216 m' },
      { city: 'Kerman', address: 'Shariati St.', latitude: '30.2839', longitude: '57.0834', location: 'Kerman Province', elevation: '1,755 m' },
      { city: 'Arak', address: 'Shahid Beheshti St.', latitude: '34.0917', longitude: '49.6890', location: 'Markazi Province', elevation: '1,708 m' },
      { city: 'Qom', address: 'Eram St.', latitude: '34.6416', longitude: '50.8746', location: 'Qom Province', elevation: '936 m' },
      { city: 'Rasht', address: 'Motahari St.', latitude: '37.2808', longitude: '49.5832', location: 'Gilan Province', elevation: '5 m' },
      { city: 'Hamadan', address: 'Bu-Ali Sina St.', latitude: '34.7983', longitude: '48.5148', location: 'Hamadan Province', elevation: '1,850 m' },
    ],
    [
      { key: 'city', title: 'City', class: 'min-w-125px' },
      { key: 'address', title: 'Address', class: 'min-w-200px' },
      { key: 'latitude', title: 'Latitude', class: 'min-w-100px' },
      { key: 'longitude', title: 'Longitude', class: 'min-w-100px' },
      { key: 'location', title: 'Location', class: 'min-w-150px' },
      { key: 'elevation', title: 'Elevation above sea level', class: 'min-w-125px' },
    ]
  );

  constructor(private modalService: NgbModal) {}

  openModal(content: TemplateRef<any>): void {
    this.modalService.open(content, this.modalConfig);
  }

  deleteSite(site: SiteRow): void {
    this.table.confirmDelete(site, site.city);
  }
}
