import Swal from 'sweetalert2';

export interface TablePaginationColumn<T> {
  key: Extract<keyof T, string>;
  title: string;
  class: string;
}

/**
 * Table pagination over an in-memory row array, with search, column filters,
 * sorting and Metronic-styled delete confirmation. Hosts load the rows and
 * handle API mutations through onConfirmedDelete.
 */
export class TablePagination<T extends object> {
  searchText = '';
  pageSize = 10;
  pageSizes = [10, 25, 50, 100];
  page = 1;
  sortKey: Extract<keyof T, string> | null = null;
  sortDir: 'asc' | 'desc' | null = null;
  /** Exact-match column filters (e.g. a toolbar select); null/empty means no filter. */
  filters: { [K in keyof T]?: T[K] | null } = {};

  constructor(public rows: T[], public columns: readonly TablePaginationColumn<T>[]) {}

  /** When set, deletion is delegated to the host (API call + reload); the
   * local row drop is skipped and the host owns the success feedback. */
  onConfirmedDelete?: (row: T) => void;

  get filtered(): T[] {
    const q = this.searchText.trim().toLowerCase();
    const rows = this.rows.filter((row) => this.matchesFilters(row) && this.matchesSearch(row, q));
    const key = this.sortKey;
    if (key === null || this.sortDir === null) {
      return rows;
    }
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => this.compare(a[key], b[key]) * dir);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paged(): T[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get infoStart(): number {
    return this.filtered.length === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get infoEnd(): number {
    return Math.min(this.page * this.pageSize, this.filtered.length);
  }

  search(value: string): void {
    this.searchText = value;
    this.page = 1;
  }

  setFilter<K extends Extract<keyof T, string>>(key: K, value: T[K] | null): void {
    this.filters[key] = value;
    this.page = 1;
  }

  setPageSize(value: string): void {
    this.pageSize = Number(value);
    this.page = 1;
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
    }
  }

  sortBy(key: Extract<keyof T, string>): void {
    // Match the template's DataTables cycle: default -> asc -> desc -> default.
    if (this.sortKey === key && this.sortDir === 'asc') {
      this.sortDir = 'desc';
    } else if (this.sortKey === key && this.sortDir === 'desc') {
      this.sortKey = null;
      this.sortDir = null;
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  // DataTables 2 header classes: dt-ordering-asc/desc highlights the active arrow.
  sortClass(key: Extract<keyof T, string>): string {
    return this.sortKey === key && this.sortDir !== null ? `dt-ordering-${this.sortDir}` : '';
  }

  /** Metronic-styled destructive-action confirmation, then delegates to the
   * host (API delete) or drops the row locally. Cancel is focused so the
   * destructive action is never the default. */
  confirmDelete(row: T, label: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to delete "' + label + '". This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'No, cancel',
      focusCancel: true,
      customClass: {
        confirmButton: 'btn fw-bold btn-danger',
        cancelButton: 'btn fw-bold btn-active-light-primary',
      },
    }).then((result) => {
      if (result.value) {
        if (this.onConfirmedDelete) {
          this.onConfirmedDelete(row);
          return;
        }
        Swal.fire({
          text: 'You have deleted ' + label + '!.',
          icon: 'success',
          buttonsStyling: false,
          confirmButtonText: 'Ok, got it!',
          customClass: {
            confirmButton: 'btn fw-bold btn-primary',
          },
        }).then(() => {
          this.rows = this.rows.filter((r) => r !== row);
          this.page = Math.min(this.page, this.totalPages);
        });
      }
    });
  }

  private matchesFilters(row: T): boolean {
    for (const key in this.filters) {
      const value = this.filters[key];
      // Zero and false are real filters; only absent/empty selections clear one.
      if (value !== null && value !== undefined && value !== '' && row[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private matchesSearch(row: T, query: string): boolean {
    if (!query) {
      return true;
    }
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key) && this.displayText(row[key]).toLowerCase().includes(query)) {
        return true;
      }
    }
    return false;
  }

  private displayText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }

  // Native numbers sort numerically. Keep numeric-aware text ordering for
  // existing display values such as "995 m" and "1,190 m". Nulls are blank:
  // first ascending and last descending, just like the previous empty strings.
  private compare(a: unknown, b: unknown): number {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    const left = this.displayText(a);
    const right = this.displayText(b);
    if (a === null || a === undefined || b === null || b === undefined) {
      return left === right ? 0 : left === '' ? -1 : 1;
    }
    const na = parseFloat(left.replace(/,/g, ''));
    const nb = parseFloat(right.replace(/,/g, ''));
    if (!isNaN(na) && !isNaN(nb)) {
      return na - nb;
    }
    return left.localeCompare(right);
  }
}
