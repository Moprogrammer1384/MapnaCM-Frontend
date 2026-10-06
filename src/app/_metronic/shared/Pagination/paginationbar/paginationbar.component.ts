import { Component, Input } from '@angular/core';
import { PaginationState } from './pagination-state';

@Component({
  selector: 'app-paginationbar',
  templateUrl: './paginationbar.component.html',
  host: { class: 'd-block' },
})
export class PaginationbarComponent {
  @Input({ required: true }) table!: PaginationState;
}
