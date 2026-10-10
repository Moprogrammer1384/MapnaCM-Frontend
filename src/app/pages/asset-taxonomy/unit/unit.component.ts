import { ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MetronicAlertService } from 'src/app/core/services/metronic-alert.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RequestState } from 'src/app/shared/components/request-state/request-state';
import type { Unit, TaxonomyParentOption, EmployerOption, InheritedEmployer } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { TablePagination, TablePaginationColumn } from 'src/app/shared/components/data-table/pagination/table-pagination';

@Component({
  selector: 'app-unit',
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.scss'],
})
export class UnitComponent implements OnInit, OnDestroy {
  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
    beforeDismiss: () => !this.saving,
  };

  table = new TablePagination<Unit>(
    [],
    [
      { key: 'name', title: 'Name', class: 'min-w-125px min-w-md-200px' },
      { key: 'plantLabel', title: 'Plant Name', class: 'min-w-175px min-w-md-250px' },
      { key: 'employerName', title: 'Employer', class: 'min-w-175px min-w-md-200px' },
    ] satisfies readonly TablePaginationColumn<Unit>[],
    { searchKeys: ['name', 'plantLabel', 'employerName'] satisfies readonly Extract<keyof Unit, string>[] }
  );

  // Select values are IDs; hierarchy labels are for display only.
  plantOptions: TaxonomyParentOption[] = [];
  employers: EmployerOption[] = [];
  employerFilter: string | null = null;
  plantFilter: number | null = null;

  unitForm: Unit = this.emptyForm();
  saving = false;

  private employerByPlantId: Record<number, InheritedEmployer> = {};

  readonly listState = new RequestState();
  readonly employersState = new RequestState();
  private readonly destroyRef = inject(DestroyRef);
  private activeModal?: NgbModalRef;

  get canAdd(): boolean {
    return !this.saving && this.listState.ready && this.plantOptions.length > 0;
  }

  get actionsDisabled(): boolean {
    return this.saving || this.listState.loading();
  }

  ngOnDestroy(): void {
    this.listState.destroy();
    this.employersState.destroy();
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
    this.table.onConfirmedDelete = (row) => this.deleteUnitConfirmed(row);
    this.loadEmployerOptions();
    this.refresh();
  }

  loadEmployerOptions(): void {
    this.employersState.track(this.apiService.getEmployerOptions(), 'Unable to load employer users.', 'getEmployerOptions').subscribe({
      next: (users) => {
        this.employers = users;
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  filterByEmployer(employerId: string | null): void {
    this.employerFilter = employerId;
    this.table.setFilter('employerId', employerId);
  }

  filterByPlant(plantId: number | null): void {
    this.plantFilter = plantId;
    this.table.setFilter('plantId', plantId);
  }

  refresh(): void {
    if (this.listState.loading()) {
      return;
    }
    this.loadPlants();
  }

  private loadPlants(): void {
    this.listState.track(this.apiService.getAllPlants(), 'Unable to load plants.', 'getAllPlants').subscribe({
      next: (plants) => {
        this.plantOptions = [];
        this.employerByPlantId = {};

        for (const plant of plants) {
          if (plant.id === undefined) {
            continue;
          }
          this.plantOptions.push({ id: plant.id, label: plant.hierarchyLabel ?? plant.name });
          this.employerByPlantId[plant.id] = {
            id: plant.employerId ?? null,
            name: plant.employerName || '—',
          };
        }
        this.plantOptions.sort((left, right) => left.label.localeCompare(right.label));

        this.loadUnits();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  private toUnitRow(unit: Unit): Unit {
    const employer = unit.plantId === null ? undefined : this.employerByPlantId[unit.plantId];
    return {
      ...unit,
      employerName: employer?.name || '\u2014',
      employerId: employer?.id ?? null,
    };
  }

  private loadUnits(): void {
    this.listState.track(this.apiService.getAllUnits(), 'Unable to load units.', 'getAllUnits').subscribe({
      next: (units) => {
        this.table.setRows(units.map((unit) => this.toUnitRow(unit)), { resetPage: true });
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  openAddModal(content: TemplateRef<any>): void {
    if (!this.canAdd) {
      return;
    }
    this.unitForm = this.emptyForm();
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  openEditModal(content: TemplateRef<any>, unit: Unit): void {
    if (this.actionsDisabled || this.table.isDeleting(unit)) {
      return;
    }
    this.unitForm = { id: unit.id, plantId: unit.plantId, name: unit.name };
    this.activeModal = this.modalService.open(content, this.modalConfig);
  }

  submit(form: NgForm, modal: { dismiss: (reason: string) => void }): void {
    if (this.saving) {
      return;
    }
    if (form.invalid || !this.unitForm.name.trim() || this.unitForm.plantId === null) {
      form.control.markAllAsTouched();
      this.alertService.show('error', 'Error!', 'Please fill in all required fields.');
      return;
    }

    const plantId = this.unitForm.plantId;
    if (!this.plantOptions.some((plant) => plant.id === plantId)) {
      this.alertService.show('error', 'Error!', 'The selected plant is no longer available. Please pick it again.');
      return;
    }

    this.saving = true;
    const payload = { name: this.unitForm.name.trim(), plantId };
    const isEdit = !!this.unitForm.id;
    const request$ = isEdit
      ? this.apiService.updateUnit({ id: this.unitForm.id!, ...payload })
      : this.apiService.createUnit(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving = false;
        modal.dismiss('saved');
        this.alertService.show('success', 'Success!', isEdit ? 'Unit updated successfully!' : 'Unit created successfully!');
        this.loadUnits();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.alertService.show('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  private deleteUnitConfirmed(unit: Unit): void {
    if (this.saving || unit.id === undefined || !this.table.beginDelete(unit)) {
      return;
    }
    this.apiService.deleteUnit(unit.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.table.endDelete(unit))
    ).subscribe({
      next: () => {
        this.alertService.show('success', 'Deleted!', 'You have deleted ' + unit.name + '!.');
        this.loadUnits();
      },
      error: (error) => this.alertService.show('error', 'Error!', error?.message || 'Unable to delete the unit.'),
    });
  }

  private emptyForm(): Unit {
    return { plantId: null, name: '' };
  }
}
