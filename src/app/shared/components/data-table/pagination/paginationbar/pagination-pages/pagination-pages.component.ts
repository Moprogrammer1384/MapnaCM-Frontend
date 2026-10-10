import { Component, Input } from '@angular/core';
import { PaginatorState } from 'primeng/paginator';
import { PaginationState } from '../pagination-state';

@Component({
  selector: 'app-pagination-pages',
  templateUrl: './pagination-pages.component.html',
})
export class PaginationPagesComponent {
  @Input({ required: true }) table!: PaginationState;

  onPageChange(event: PaginatorState): void {
    if (event.page !== undefined) {
      this.table.goToPage(event.page + 1);
    }
  }
}
