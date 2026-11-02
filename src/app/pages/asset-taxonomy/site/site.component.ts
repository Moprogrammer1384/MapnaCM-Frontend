import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { AssetTaxonomyMutations } from 'src/app/core/utils/asset-taxonomy-mutations';
import { formatLatitude, formatLongitude } from 'src/app/core/utils/geo-coordinate-display';
import { RequestState } from 'src/app/shared/components/request-state/request-state';
import type { Site } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/shared/components/data-table/pagination/table-pagination';

@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.scss'],
})
export class SiteComponent implements OnInit, OnDestroy {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
    beforeDismiss: () => !this.saving,
  };

  table = new TablePagination<Site>(
    [],
    [
      { key: 'city', title: 'City', class: 'min-w-125px' },
      { key: 'address', title: 'Address', class: 'min-w-200px' },
      { key: 'latitude', title: 'Latitude', class: 'min-w-100px', format: site => formatLatitude(site.latitude) },
      { key: 'longitude', title: 'Longitude', class: 'min-w-100px', format: site => formatLongitude(site.longitude) },
      { key: 'elevation', title: 'Elevation above sea level', class: 'min-w-125px' },
    ] satisfies readonly TablePaginationColumn<Site>[],
    { searchKeys: ['city', 'address', 'latitude', 'longitude', 'elevation'] satisfies readonly Extract<keyof Site, string>[] }
  );

  siteForm: Site = this.emptySiteForm();
  saving = false;

  readonly listState = new RequestState();
  private readonly mutations: AssetTaxonomyMutations;
  private activeModal?: NgbModalRef;

  get canAdd(): boolean {
    return !this.saving && !this.listState.loading();
  }

  get actionsDisabled(): boolean {
    return this.saving || this.listState.loading();
  }

  ngOnDestroy(): void {
    this.listState.destroy();
    this.saving = false;
    this.activeModal?.dismiss('page destroyed');
  }

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private alertService: MetronicAlertService,
    private cdr: ChangeDetectorRef
  ) {
    this.mutations = new AssetTaxonomyMutations(this, inject(DestroyRef), alertService, cdr);
  }

  ngOnInit(): void {
    this.table.onConfirmedDelete = (row) => this.deleteSiteConfirmed(row);
    this.loadSites();
  }

  loadSites(): void {
    this.listState.track(this.apiService.getAllSites(), 'Unable to load sites.', 'getAllSites').subscribe({
      next: (sites) => {
        this.table.setRows(sites.map((site) => ({
          id: site.id,
          city: site.city,
          address: site.address,
          latitude: site.latitude,
          longitude: site.longitude,
          elevation: site.elevation,
        })), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    if (!this.canAdd) {
      return;
    }
    this.siteForm = this.emptySiteForm();
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, site: Site): void {
    if (this.actionsDisabled || this.table.isDeleting(site)) {
      return;
    }
    this.siteForm = {
      id: site.id,
      city: site.city,
      address: site.address,
      latitude: site.latitude,
      longitude: site.longitude,
      elevation: site.elevation,
    };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.siteForm.city.trim() || !this.siteForm.address.trim()) {
      form.control.markAllAsTouched();
      this.alertService.show('error', 'Error!', 'Please fill in all required fields.');
      return;
    }
    const { latitude, longitude, elevation } = this.siteForm;
    if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      form.control.markAllAsTouched();
      this.alertService.show('error', 'Error!', 'Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    if (typeof elevation !== 'number' || !Number.isFinite(elevation)) {
      form.control.markAllAsTouched();
      this.alertService.show('error', 'Error!', 'Please enter a valid elevation.');
      return;
    }

    const payload = {
      city: this.siteForm.city,
      address: this.siteForm.address,
      latitude,
      longitude,
      elevation,
    };
    const isEdit = !!this.siteForm.id;
    const request = () => isEdit
      ? this.apiService.updateSite({ id: this.siteForm.id!, ...payload })
      : this.apiService.createSite(payload);

    this.mutations.save(request, () => {
      modal.dismiss('saved');
      this.alertService.show('success', 'Success!', isEdit ? 'Site updated successfully!' : 'Site created successfully!');
      this.loadSites();
    });
  }

  // Opens the Metronic confirmation dialog; the API delete only runs from
  // the onConfirmedDelete callback after the admin confirms.
  deleteSite(site: Site): void {
    this.table.confirmDelete(site, site.city);
  }

  private deleteSiteConfirmed(site: Site): void {
    this.mutations.delete(site, this.table, (id) => this.apiService.deleteSite(id), () => {
      this.alertService.show('success', 'Deleted!', 'You have deleted ' + site.city + '!.');
      this.loadSites();
    }, 'Unable to delete the site.');
  }

  private emptySiteForm(): Site {
    return { city: '', address: '', latitude: null, longitude: null, elevation: null };
  }
}
