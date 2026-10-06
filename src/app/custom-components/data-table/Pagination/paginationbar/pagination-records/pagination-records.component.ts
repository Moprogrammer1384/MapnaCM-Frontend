import { Component, Input } from '@angular/core';
import { PaginationState } from '../pagination-state';

@Component({
  selector: 'app-pagination-records',
  templateUrl: './pagination-records.component.html',
})
export class PaginationRecordsComponent {
  @Input({ required: true }) table!: PaginationState;
}
