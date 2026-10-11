import { ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';
import { MetronicAlertService } from '../services/metronic-alert.service';
import { TablePagination } from 'src/app/shared/components/data-table/pagination/table-pagination';

/** Each page composes its own helper and retains its saving flag and success ordering. */
export class AssetTaxonomyMutations {
  constructor(
    private readonly page: { saving: boolean },
    private readonly destroyRef: DestroyRef,
    private readonly alerts: MetronicAlertService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  save(request: () => Observable<void>, onSuccess: () => void): void {
    if (this.page.saving) {
      return;
    }
    this.page.saving = true;
    request().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.page.saving = false;
        onSuccess();
      },
      error: (error) => {
        this.page.saving = false;
        this.cdr.detectChanges();
        this.alerts.show('error', 'Error!', error?.message || 'The request failed.');
      },
    });
  }

  delete<T extends { id?: number }>(
    row: T,
    table: TablePagination<T>,
    request: (id: number) => Observable<void>,
    onSuccess: () => void,
    errorMessage: string
  ): void {
    if (this.page.saving || row.id === undefined || !table.beginDelete(row)) {
      return;
    }
    request(row.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => table.endDelete(row))
    ).subscribe({
      next: onSuccess,
      error: (error) => this.alerts.show('error', 'Error!', error?.message || errorMessage),
    });
  }
}
