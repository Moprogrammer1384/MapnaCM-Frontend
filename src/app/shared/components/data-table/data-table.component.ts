import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TablePagination } from './pagination/table-pagination';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  host: { class: 'd-block' },
})
export class DataTableComponent<T extends object> {
  @Input({ required: true }) table!: TablePagination<T>;
  @Input() tableId = 'kt_profile_overview_table';

  @Output() editRecord = new EventEmitter<Readonly<T>>();
  @Output() deleteRecord = new EventEmitter<Readonly<T>>();
}
