import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { SitePayload } from 'src/app/core/models/asset.model';
import { AssetApiService } from '../services/asset-api.service';
import { ClientTable } from '../client-table';

interface SiteRow extends Record<string, string> {
  id: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  location: string;
  elevation: string;
}

interface SiteFormModel {
  id?: number;
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
export class SiteComponent implements OnInit {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  table = new ClientTable<SiteRow>(
    [],
    [
      { key: 'city', title: 'City', class: 'min-w-125px' },
      { key: 'address', title: 'Address', class: 'min-w-200px' },
      { key: 'latitude', title: 'Latitude', class: 'min-w-100px' },
      { key: 'longitude', title: 'Longitude', class: 'min-w-100px' },
      { key: 'location', title: 'Location', class: 'min-w-150px' },
      { key: 'elevation', title: 'Elevation above sea level', class: 'min-w-125px' },
    ]
  );

  siteForm: SiteFormModel = this.emptySiteForm();
  saving = false;

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteSite(row);
    this.loadSites();
  }

  loadSites(): void {
    this.apiService.getAllSites().subscribe({
      next: (sites) => {
        this.table.rows = sites.map((site) => ({
          id: String(site.id),
          city: site.city,
          address: site.address,
          latitude: site.latitude,
          longitude: site.longitude,
          location: site.location,
          elevation: site.elevation,
        }));
        this.table.page = 1;
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load sites.'),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    this.siteForm = this.emptySiteForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, site: SiteRow): void {
    this.siteForm = {
      id: Number(site.id),
      city: site.city,
      address: site.address,
      latitude: site.latitude,
      longitude: site.longitude,
      location: site.location,
      elevation: site.elevation,
    };
    this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    this.saving = true;
    const payload: SitePayload = {
      city: this.siteForm.city,
      address: this.siteForm.address,
      latitude: this.siteForm.latitude,
      longitude: this.siteForm.longitude,
      location: this.siteForm.location,
      elevation: this.siteForm.elevation,
    };
    const isEdit = !!this.siteForm.id;
    const request$ = isEdit
      ? this.apiService.updateSite({ id: this.siteForm.id!, ...payload })
      : this.apiService.createSite(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'Site updated successfully!' : 'Site created successfully!');
        this.loadSites();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.showAlert('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  deleteSite(site: SiteRow): void {
    this.apiService.deleteSite(Number(site.id)).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + site.city + '!.');
        this.loadSites();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the site.'),
    });
  }

  private emptySiteForm(): SiteFormModel {
    return { city: '', address: '', latitude: '', longitude: '', location: '', elevation: '' };
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
