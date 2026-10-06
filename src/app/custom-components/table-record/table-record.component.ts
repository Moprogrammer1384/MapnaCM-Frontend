import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TablePagination } from '../Pagination/table-pagination';

@Component({
  selector: 'app-table-record',
  templateUrl: './table-record.component.html',
  host: { class: 'd-block' },
})
export class TableRecordComponent<T extends object> {
  @Input({ required: true }) table!: TablePagination<T>;
  @Input() tableId = 'kt_profile_overview_table';

  // Hosts retain their modal, confirmation and API mutation workflows.
  @Output() editRecord = new EventEmitter<Readonly<T>>();
  @Output() deleteRecord = new EventEmitter<Readonly<T>>();
}
