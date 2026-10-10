import { Component, computed, EventEmitter, Input, Output, signal } from '@angular/core';
import { TablePagination } from '../pagination/table-pagination';

@Component({
  selector: 'app-table-record',
  templateUrl: './table-record.component.html',
  host: { class: 'd-block' },
})
export class TableRecordComponent<T extends object> {
  private readonly tableState = signal<TablePagination<T> | null>(null);

  @Input({ required: true })
  set table(value: TablePagination<T>) {
    this.tableState.set(value);
  }

  get table(): TablePagination<T> {
    return this.tableState()!;
  }

  // PrimeNG accepts mutable arrays; retain cached, immutable row snapshots.
  readonly viewRows = computed(() => [...(this.tableState()?.paged ?? [])]);
  @Input() tableId = 'kt_profile_overview_table';

  // Hosts retain their modal, confirmation and API mutation workflows.
  @Output() editRecord = new EventEmitter<Readonly<T>>();
  @Output() deleteRecord = new EventEmitter<Readonly<T>>();
}
