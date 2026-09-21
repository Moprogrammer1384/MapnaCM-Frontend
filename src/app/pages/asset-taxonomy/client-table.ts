import Swal from 'sweetalert2';

export interface ClientTableColumn<T> {
  key: keyof T;
  title: string;
  class: string;
}

/**
 * Client-side search / sort / paging over an in-memory row array, mimicking
 * what DataTables gives the static Metronic demo pages. Used by the asset
 * structure pages until they are wired to the API (QueryCriteria skip/take).
 */
export class ClientTable<T extends Record<string, string>> {
  searchText = '';
  pageSize = 10;
  pageSizes = [10, 25, 50, 100];
  page = 1;
  sortKey: keyof T;
  sortDir: 'asc' | 'desc' = 'asc';

  constructor(public rows: T[], public columns: ClientTableColumn<T>[]) {
    this.sortKey = columns[0].key;
  }

  get filtered(): T[] {
    const q = this.searchText.trim().toLowerCase();
    const rows = q
      ? this.rows.filter((r) => Object.values(r).some((v) => v.toLowerCase().includes(q)))
      : [...this.rows];
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => this.compare(a[this.sortKey], b[this.sortKey]) * dir);
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

  setPageSize(value: string): void {
    this.pageSize = Number(value);
    this.page = 1;
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.page = p;
    }
  }

  sortBy(key: keyof T): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.page = 1;
  }

  // DataTables 2 header classes: dt-ordering-asc/desc highlights the active arrow.
  sortClass(key: keyof T): string {
    return this.sortKey === key ? `dt-ordering-${this.sortDir}` : '';
  }

  /** SweetAlert2 confirm + success flow from the demo's siteplant.js, then drops the row. */
  confirmDelete(row: T, label: string): void {
    Swal.fire({
      text: 'Are you sure you want to delete ' + label + '?',
      icon: 'warning',
      showCancelButton: true,
      buttonsStyling: false,
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'No, cancel',
      customClass: {
        confirmButton: 'btn fw-bold btn-danger',
        cancelButton: 'btn fw-bold btn-active-light-primary',
      },
    }).then((result) => {
      if (result.value) {
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

  // Numeric-aware compare so "995 m" sorts before "1,190 m".
  private compare(a: string, b: string): number {
    const na = parseFloat(a.replace(/,/g, ''));
    const nb = parseFloat(b.replace(/,/g, ''));
    if (!isNaN(na) && !isNaN(nb)) {
      return na - nb;
    }
    return a.localeCompare(b);
  }
}
