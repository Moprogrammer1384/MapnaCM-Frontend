import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RequestState } from 'src/app/shared/components/request-state/request-state';
import type { Site } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/shared/components/data-table/pagination/table-pagination';
import { compareNumericText } from 'src/app/shared/components/data-table/pagination/table-pagination-comparators';

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
      { key: 'latitude', title: 'Latitude', class: 'min-w-100px', compare: (left, right) => compareNumericText(left.latitude, right.latitude) },
      { key: 'longitude', title: 'Longitude', class: 'min-w-100px', compare: (left, right) => compareNumericText(left.longitude, right.longitude) },
      { key: 'location', title: 'Location', class: 'min-w-150px' },
      { key: 'elevation', title: 'Elevation above sea level', class: 'min-w-125px' },
    ] satisfies readonly TablePaginationColumn<Site>[],
    { searchKeys: ['city', 'address', 'latitude', 'longitude', 'location', 'elevation'] satisfies readonly Extract<keyof Site, string>[] }
  );

  siteForm: Site = this.emptySiteForm();
  saving = false;

  readonly listState = new RequestState();
  private readonly destroyRef = inject(DestroyRef);
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
  ) {}

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
          location: site.location,
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
      location: site.location,
      elevation: site.elevation,
    };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.siteForm.city.trim() || !this.siteForm.address.trim() ||
      !this.siteForm.latitude.trim() || !this.siteForm.longitude.trim()) {
      form.control.markAllAsTouched();
      this.alertService.show('error', 'Error!', 'Please fill in all required fields.');
      return;
    }
    const elevation = this.siteForm.elevation;
    if (typeof elevation !== 'number' || !Number.isFinite(elevation)) {
      form.control.markAllAsTouched();
      this.alertService.show('error', 'Error!', 'Please enter a valid elevation.');
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

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.alertService.show('success', 'Success!', isEdit ? 'Site updated successfully!' : 'Site created successfully!');
        this.loadSites();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.alertService.show('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  // Opens the Metronic confirmation dialog; the API delete only runs from
  // the onConfirmedDelete callback after the admin confirms.
  deleteSite(site: Site): void {
    this.table.confirmDelete(site, site.city);
  }

  private deleteSiteConfirmed(site: Site): void {
    if (this.saving || site.id === undefined || !this.table.beginDelete(site)) {
      return;
    }
    this.apiService.deleteSite(site.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.table.endDelete(site))
    ).subscribe({
      next: () => {
        this.alertService.show('success', 'Deleted!', 'You have deleted ' + site.city + '!.');
        this.loadSites();
      },
      error: (error) => this.alertService.show('error', 'Error!', error?.message || 'Unable to delete the site.'),
    });
  }

  private emptySiteForm(): Site {
    return { city: '', address: '', latitude: '', longitude: '', location: '', elevation: null };
  }
}
