import {NgModule} from '@angular/core';
import {KeeniconComponent} from './keenicon/keenicon.component';
import {CommonModule} from "@angular/common";
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Select2Directive } from './select2/select2.directive';
import { PaginationbarComponent } from '../../shared/components/data-table/pagination/paginationbar/paginationbar.component';
import { PaginationRecordsComponent } from '../../shared/components/data-table/pagination/paginationbar/pagination-records/pagination-records.component';
import { PaginationPagesComponent } from '../../shared/components/data-table/pagination/paginationbar/pagination-pages/pagination-pages.component';
import { TableRecordComponent } from '../../shared/components/data-table/table-record/table-record.component';
import { DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';

@NgModule({
  declarations: [
    KeeniconComponent,
    Select2Directive,
    PaginationbarComponent,
    PaginationRecordsComponent,
    PaginationPagesComponent,
    TableRecordComponent,
    DataTableComponent,
    FormModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    PaginatorModule,
    SelectModule,
    TableModule,
  ],
  exports: [
    KeeniconComponent,
    Select2Directive,
    PaginationbarComponent,
    PaginationRecordsComponent,
    PaginationPagesComponent,
    TableRecordComponent,
    DataTableComponent,
    FormModalComponent
  ]
})
export class SharedModule {
}
