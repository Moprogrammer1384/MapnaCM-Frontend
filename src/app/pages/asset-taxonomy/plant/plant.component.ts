import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RequestState } from 'src/app/shared/components/request-state/request-state';
import type { Plant, PlantType, TaxonomyParentOption, EmployerOption } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/shared/components/data-table/pagination/table-pagination';

@Component({
  selector: 'app-plant',
  templateUrl: './plant.component.html',
  styleUrls: ['./plant.component.scss'],
})
export class PlantComponent implements OnInit, OnDestroy {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
    beforeDismiss: () => !this.saving,
  };

  plants = new TablePagination<Plant>(
    [],
    [
      { key: 'name', title: 'Name', class: 'min-w-150px' },
      { key: 'typeName', title: 'Type', class: 'min-w-150px' },
      { key: 'siteLabel', title: 'Site', class: 'min-w-175px min-w-md-250px' },
      { key: 'employerName', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ] satisfies readonly TablePaginationColumn<Plant>[],
    { searchKeys: ['name', 'typeName', 'siteLabel', 'employerName'] satisfies readonly Extract<keyof Plant, string>[] }
  );

  types = new TablePagination<PlantType>(
    [],
    [{ key: 'name', title: 'Name', class: 'min-w-150px' }] satisfies readonly TablePaginationColumn<PlantType>[],
    { searchKeys: ['name'] satisfies readonly Extract<keyof PlantType, string>[] }
  );

  // Options for the Type / Site selects in the plant modals, loaded from the
  // backend (sites keep the "City (lat, lng)" display label).
  typeOptions: PlantType[] = [];
  siteOptions: TaxonomyParentOption[] = [];

  plantFormModel: Plant = this.emptyPlantForm();
  typeFormModel: PlantType = this.emptyTypeForm();
  saving = false;
  // Employer filter values are user IDs; names are for display only.
  employers: EmployerOption[] = [];
  employerFilter: string | null = null;

  // Identity users carrying the Employer role — the only valid assignments.
  employerUsers: EmployerOption[] = [];

  readonly listState = new RequestState();
  readonly employersState = new RequestState();
  readonly typesState = new RequestState();
  readonly sitesState = new RequestState();
  private readonly destroyRef = inject(DestroyRef);
  private activeModal?: NgbModalRef;

  get canAdd(): boolean {
    return !this.saving && !this.listState.loading() && this.sitesState.ready && this.typesState.ready && this.employersState.ready && this.siteOptions.length > 0 && this.typeOptions.length > 0;
  }

  get actionsDisabled(): boolean {
    return this.saving || this.listState.loading() || !this.sitesState.ready || !this.typesState.ready || !this.employersState.ready;
  }

  ngOnDestroy(): void {
    this.listState.destroy();
    this.employersState.destroy();
    this.typesState.destroy();
    this.sitesState.destroy();
    this.saving = false;
    this.activeModal?.dismiss('page destroyed');
  }

  constructor(
    private modalService: NgbModal,
    private apiService: AssetApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.plants.onConfirmedDelete = (row) => this.deletePlantConfirmed(row);
    this.types.onConfirmedDelete = (row) => this.deleteTypeConfirmed(row);
    this.loadEmployerUsers();
    this.loadAll();
  }

  filterByEmployer(employerId: string | null): void {
    this.employerFilter = employerId;
    this.plants.setFilter('employerId', employerId);
  }

  loadAll(): void {
    this.loadSites();
    this.loadTypes();
    this.loadPlants();
  }

  loadSites(): void {
    this.sitesState.track(this.apiService.getAllSites(), 'Unable to load sites.', 'getAllSites').subscribe({
      next: (sites) => {
        this.siteOptions = [];
        for (const site of sites) {
          if (site.id !== undefined) {
            this.siteOptions.push({
              id: site.id,
              label: `${site.city} (${site.latitude}, ${site.longitude})`,
            });
          }
        }
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  loadTypes(): void {
    this.typesState.track(this.apiService.getAllPlantTypes(), 'Unable to load plant types.', 'getAllPlantTypes').subscribe({
      next: (types) => {
        this.typeOptions = types;
        this.types.setRows(types.map((type) => ({ id: type.id, name: type.name })), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  loadEmployerUsers(): void {
    this.employersState.track(this.apiService.getEmployerOptions(), 'Unable to load employer users.', 'getEmployerOptions').subscribe({
      next: (users) => {
        this.employerUsers = users;
        this.employers = users;
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  loadPlants(): void {
    this.listState.track(this.apiService.getAllPlants(), 'Unable to load plants.', 'getAllPlants').subscribe({
      next: (plants) => {
        this.plants.setRows(plants.map((plant) => ({
          ...plant,
          employerName: plant.employerName || '\u2014',
          employerId: plant.employerId ?? null,
        })), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  // ---- Plant modal ----------------------------------------------------

  openAddPlantModal(content: TemplateRef<any>): void {
    if (!this.canAdd) {
      return;
    }
    this.plantFormModel = this.emptyPlantForm();
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  openEditPlantModal(content: TemplateRef<any>, plant: Plant): void {
    if (this.actionsDisabled || this.plants.isDeleting(plant)) {
      return;
    }
    this.plantFormModel = {
      id: plant.id,
      name: plant.name,
      plantTypeId: plant.plantTypeId,
      siteId: plant.siteId,
      employerId: plant.employerId || null,
    };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  submitPlant(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.plantFormModel.name.trim() || !this.plantFormModel.plantTypeId || !this.plantFormModel.siteId) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    this.saving = true;
    // Employer is optional: a null id clears the assignment.
    const employer = this.employerUsers.find((user) => user.id === this.plantFormModel.employerId);
    const payload = {
      name: this.plantFormModel.name.trim(),
      siteId: this.plantFormModel.siteId,
      plantTypeId: this.plantFormModel.plantTypeId,
      employerId: this.plantFormModel.employerId ?? null,
      employerName: employer?.name ?? null,
    };
    const isEdit = !!this.plantFormModel.id;
    const request$ = isEdit
      ? this.apiService.updatePlant({ id: this.plantFormModel.id!, ...payload })
      : this.apiService.createPlant(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'Plant updated successfully!' : 'Plant created successfully!');
        this.loadPlants();
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
  deletePlant(plant: Plant): void {
    this.plants.confirmDelete(plant, plant.name);
  }

  private deletePlantConfirmed(plant: Plant): void {
    if (this.saving || plant.id === undefined || !this.plants.beginDelete(plant)) {
      return;
    }
    this.apiService.deletePlant(plant.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.plants.endDelete(plant))
    ).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + plant.name + '!.');
        this.loadPlants();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the plant.'),
    });
  }

  // ---- Type modal -------------------------------------------------------

  openAddTypeModal(content: TemplateRef<any>): void {
    if (this.saving || this.typesState.loading()) {
      return;
    }
    this.typeFormModel = this.emptyTypeForm();
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  openEditTypeModal(content: TemplateRef<any>, type: PlantType): void {
    if (this.saving || this.typesState.loading() || this.types.isDeleting(type)) {
      return;
    }
    this.typeFormModel = { id: type.id, name: type.name };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  submitType(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.typeFormModel.name.trim()) {
      form.control.markAllAsTouched();
      this.showAlert('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    this.saving = true;
    const isEdit = !!this.typeFormModel.id;
    const request$ = isEdit
      ? this.apiService.updatePlantType({ id: this.typeFormModel.id!, name: this.typeFormModel.name.trim() })
      : this.apiService.createPlantType({ name: this.typeFormModel.name.trim() });

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.showAlert('success', 'Success!', isEdit ? 'Type updated successfully!' : 'Type created successfully!');
        this.loadTypes();
        this.loadPlants();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.showAlert('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  deleteType(type: PlantType): void {
    this.types.confirmDelete(type, type.name);
  }

  private deleteTypeConfirmed(type: PlantType): void {
    if (this.saving || type.id === undefined || !this.types.beginDelete(type)) {
      return;
    }
    this.apiService.deletePlantType(type.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.types.endDelete(type))
    ).subscribe({
      next: () => {
        this.showAlert('success', 'Deleted!', 'You have deleted ' + type.name + '!.');
        this.loadTypes();
        this.loadPlants();
      },
      error: (error) => this.showAlert('error', 'Error!', error?.message || 'Unable to delete the type.'),
    });
  }

  // ---- Helpers --------------------------------------------------------

  private emptyPlantForm(): Plant {
    return { name: '', plantTypeId: null, siteId: null, employerId: null };
  }

  private emptyTypeForm(): PlantType {
    return { name: '' };
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
