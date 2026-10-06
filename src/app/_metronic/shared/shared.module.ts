import {NgModule} from '@angular/core';
import {KeeniconComponent} from './keenicon/keenicon.component';
import {CommonModule} from "@angular/common";
import { Select2Directive } from './select2/select2.directive';
import { PaginationbarComponent } from '../../custom-components/data-table/Pagination/paginationbar/paginationbar.component';
import { PaginationRecordsComponent } from '../../custom-components/data-table/Pagination/paginationbar/pagination-records/pagination-records.component';
import { PaginationPagesComponent } from '../../custom-components/data-table/Pagination/paginationbar/pagination-pages/pagination-pages.component';
import { TableRecordComponent } from '../../custom-components/data-table/table-record/table-record.component';
import { DataTableComponent } from '../../custom-components/data-table/data-table.component';

@NgModule({
  declarations: [
    KeeniconComponent,
    Select2Directive,
    PaginationbarComponent,
    PaginationRecordsComponent,
    PaginationPagesComponent,
    TableRecordComponent,
    DataTableComponent
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    KeeniconComponent,
    Select2Directive,
    PaginationbarComponent,
    PaginationRecordsComponent,
    PaginationPagesComponent,
    TableRecordComponent,
    DataTableComponent
  ]
})
export class SharedModule {
}
