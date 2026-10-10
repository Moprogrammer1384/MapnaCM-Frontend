import { Component, computed, Input, signal } from '@angular/core';
import { PaginationState } from '../pagination-state';

@Component({
  selector: 'app-pagination-records',
  templateUrl: './pagination-records.component.html',
})
export class PaginationRecordsComponent {
  private readonly tableState = signal<PaginationState | null>(null);

  @Input({ required: true })
  set table(value: PaginationState) {
    this.tableState.set(value);
  }

  get table(): PaginationState {
    return this.tableState()!;
  }

  readonly pageSizes = computed(() => [...(this.tableState()?.pageSizes ?? [])]);
}
