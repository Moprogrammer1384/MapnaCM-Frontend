import { ChangeDetectorRef, Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import type { Site } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/shared/components/data-table/pagination/table-pagination';
import { compareNumericText } from 'src/app/shared/components/data-table/pagination/table-pagination-comparators';

@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.scss'],
})
export class SiteComponent implements OnInit {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  table = new TablePagination<Site>(
    [],
    [
      { key: 'city', title: 'City', class: 'min-w-125px' },
      { key: 'address', title: 'Address', class: 'min-w-200px' },
      { key: 'latitude', title: 'Latitude', class: 'min-w-100px', compare: (left, right) => compareNumericText(left.latitude, right.latitude) },
      { key: 'longitude', title: 'Longitude', class: 'min-w-100px', compare: (left, right) => compareNumericText(left.longitude, right.longitude) },
      { key: 'location', title: 'Location', class: 'min-w-150px' },
      { key: 'elevation', title: 'Elevation above sea level', class: 'min-w-125px' },
    ] satisfies readonly TablePaginationColumn<Site>[],
    { searchKeys: ['city', 'address', 'latitude', 'longitude', 'location', 'elevation'] satisfies readonly Extract<keyof Site, string>[] }
  );

  siteForm: Site = this.emptySiteForm();
  saving = false;

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteSiteConfirmed(row);
    this.loadSites();
  }

  loadSites(): void {
    this.apiService.getAllSites().subscribe({
      next: (sites) => {
        this.table.setRows(sites.map((site) => ({
          id: site.id,
          city: site.city,
          address: site.address,
          latitude: site.latitude,
          longitude: site.longitude,
          location: site.location,
          elevation: site.elevation,
        })), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to load sites.'),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    this.siteForm = this.emptySiteForm();
    this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, site: Site): void {
    this.siteForm = {
      id: site.id,
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
    const elevation = this.siteForm.elevation;
    if (typeof elevation !== 'number' || !Number.isFinite(elevation)) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please enter a valid elevation.');
      return;
    }

    this.saving = true;
    const payload = {
      city: this.siteForm.city,
      address: this.siteForm.address,
      latitude: this.siteForm.latitude,
      longitude: this.siteForm.longitude,
      location: this.siteForm.location,
      elevation,
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

  // Opens the Metronic confirmation dialog; the API delete only runs from
  // the onConfirmedDelete callback after the admin confirms.
  deleteSite(site: Site): void {
    this.table.confirmDelete(site, site.city);
  }

  private deleteSiteConfirmed(site: Site): void {
    if (site.id === undefined) {
      return;
    }
    this.apiService.deleteSite(site.id).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + site.city + '!.');
        this.loadSites();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the site.'),
    });
  }

  private emptySiteForm(): Site {
    return { city: '', address: '', latitude: '', longitude: '', location: '', elevation: null };
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
