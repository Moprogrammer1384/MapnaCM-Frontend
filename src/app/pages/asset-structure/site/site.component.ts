import { Component, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

interface SiteRow {
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
  sites: SiteRow[] = [
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
  ];

  // Client-side search / sort / paging state (DataTables-like, until the API takes over).
  searchText = '';
  pageSize = 10;
  pageSizes = [10, 25, 50, 100];
  page = 1;
  sortKey: keyof SiteRow = 'city';
  sortDir: 'asc' | 'desc' = 'asc';

  columns: { key: keyof SiteRow; title: string; class: string }[] = [
    { key: 'city', title: 'City', class: 'min-w-125px' },
    { key: 'address', title: 'Address', class: 'min-w-200px' },
    { key: 'latitude', title: 'Latitude', class: 'min-w-100px' },
    { key: 'longitude', title: 'Longitude', class: 'min-w-100px' },
    { key: 'location', title: 'Location', class: 'min-w-150px' },
    { key: 'elevation', title: 'Elevation above sea level', class: 'min-w-125px' },
  ];

  constructor(private modalService: NgbModal) {}

  get filteredSites(): SiteRow[] {
    const q = this.searchText.trim().toLowerCase();
    const rows = q
      ? this.sites.filter((s) => Object.values(s).some((v) => v.toLowerCase().includes(q)))
      : [...this.sites];
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => this.compare(a[this.sortKey], b[this.sortKey]) * dir);
  }

  // Numeric-aware compare so "995 m" sorts before "1,190 m".
  private compare(a: string, b: string): number {
    const na = parseFloat(a.replace(/,/g, ''));
    const nb = parseFloat(b.replace(/,/g, ''));
    if (!isNaN(na) && !isNaN(nb)) {
      return na - nb;
    }
    return a.localeCompare(b);
  }

  sortBy(key: keyof SiteRow): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  // DataTables 2 header classes: dt-ordering-asc/desc highlights the active arrow.
  sortClass(key: keyof SiteRow): string {
    return this.sortKey === key ? `dt-ordering-${this.sortDir}` : '';
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSites.length / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedSites(): SiteRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredSites.slice(start, start + this.pageSize);
  }

  get infoStart(): number {
    return this.filteredSites.length === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get infoEnd(): number {
    return Math.min(this.page * this.pageSize, this.filteredSites.length);
  }

  onSearch(value: string): void {
    this.searchText = value;
    this.page = 1;
  }

  onPageSizeChange(value: string): void {
    this.pageSize = Number(value);
    this.page = 1;
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
    }
  }

  openModal(content: TemplateRef<any>): void {
    this.modalService.open(content, this.modalConfig);
  }

  deleteSite(site: SiteRow): void {
    Swal.fire({
      text: 'Are you sure you want to delete ' + site.city + '?',
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'No, cancel',
      customClass: {
        confirmButton: 'btn fw-bold btn-danger',
        cancelButton: 'btn fw-bold btn-active-light-primary',
      },
    }).then((result) => {
      if (result.value) {
        Swal.fire({
          text: 'You have deleted ' + site.city + '!.',
          icon: 'success',
          buttonsStyling: false,
          confirmButtonText: 'Ok, got it!',
          customClass: {
            confirmButton: 'btn fw-bold btn-primary',
          },
        }).then(() => {
          this.sites = this.sites.filter((s) => s !== site);
          this.page = Math.min(this.page, this.totalPages);
        });
      }
    });
  }
}
