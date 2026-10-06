import {NgModule} from '@angular/core';
import {KeeniconComponent} from './keenicon/keenicon.component';
import {CommonModule} from "@angular/common";
import { Select2Directive } from './select2/select2.directive';
import { PaginationbarComponent } from './Pagination/paginationbar/paginationbar.component';
import { PaginationRecordsComponent } from './Pagination/paginationbar/pagination-records/pagination-records.component';
import { PaginationPagesComponent } from './Pagination/paginationbar/pagination-pages/pagination-pages.component';

@NgModule({
  declarations: [
    KeeniconComponent,
    Select2Directive,
    PaginationbarComponent,
    PaginationRecordsComponent,
    PaginationPagesComponent
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    KeeniconComponent,
    Select2Directive,
    PaginationbarComponent,
    PaginationRecordsComponent,
    PaginationPagesComponent
  ]
})
export class SharedModule {
}
