import { computed, signal } from '@angular/core';
import Swal from 'sweetalert2';

export interface TablePaginationColumn<T> {
  key: Extract<keyof T, string>;
  title: string;
  class: string;
  compare?: (left: T, right: T) => number;
}

export interface TablePaginationOptions<T> {
  searchKeys: readonly Extract<keyof T, string>[];
  pageSizes?: readonly number[];
}

type TableFilters<T> = { [K in keyof T]?: T[K] | null };
type TableSort<T> = {
  key: Extract<keyof T, string> | null;
  direction: 'asc' | 'desc' | null;
};

/**
 * Table pagination over an in-memory row array, with search, column filters,
 * sorting and Metronic-styled delete confirmation. Hosts load the rows and
 * handle API mutations through onConfirmedDelete.
 */
export class TablePagination<T extends object> {
  readonly pageSizes: readonly number[];
  readonly columns: readonly Readonly<TablePaginationColumn<T>>[];
  readonly searchKeys: readonly Extract<keyof T, string>[];
  private readonly rowsState = signal<readonly Readonly<T>[]>([]);
  private readonly searchState = signal('');
  private readonly filtersState = signal<TableFilters<T>>({});
  private readonly sortState = signal<TableSort<T>>({ key: null, direction: null });
  private readonly requestedPage = signal(1);
  private readonly pageSizeState = signal(10);

  // Each stage tracks only its inputs. Reading pagination never sorts; changing
  // the page or page size never invalidates filtering or sorting.
  private readonly filteredRows = computed(() => {
    const rows = this.rowsState();
    const query = this.searchState().trim().toLowerCase();
    const filters = this.filtersState();
    return Object.freeze(rows.filter((row) => this.matchesFilters(row, filters) && this.matchesSearch(row, query)));
  });

  private readonly sortedRows = computed(() => {
    const rows = this.filteredRows();
    const { key, direction } = this.sortState();
    if (key === null || direction === null) {
      return rows;
    }
    const dir = direction === 'asc' ? 1 : -1;
    const comparator = this.columns.find((column) => column.key === key)?.compare;
    // The index tie-breaker preserves response order in both sort directions.
    return Object.freeze(rows.map((row, index) => ({ row, index }))
      .sort((left, right) => this.compare(left.row, right.row, key, comparator) * dir || left.index - right.index)
      .map(({ row }) => row));
  });

  private readonly resultCountState = computed(() => this.filteredRows().length);
  private readonly totalPagesState = computed(() => Math.max(1, Math.ceil(this.resultCountState() / this.pageSizeState())));
  private readonly currentPage = computed(() => this.clampPage(this.requestedPage()));
  private readonly pageWindow = computed(() => {
    const total = this.totalPagesState();
    const length = Math.min(5, total);
    const start = Math.max(1, Math.min(this.currentPage() - 2, total - length + 1));
    return { start, length };
  }, { equal: (left, right) => left.start === right.start && left.length === right.length });
  private readonly pageNumbers = computed(() => {
    const { start, length } = this.pageWindow();
    return Object.freeze(Array.from({ length }, (_, i) => start + i));
  });
  private readonly pageRows = computed(() => {
    const size = this.pageSizeState();
    const start = (this.currentPage() - 1) * size;
    return Object.freeze(this.sortedRows().slice(start, start + size));
  });
  private readonly range = computed(() => {
    const count = this.resultCountState();
    const page = this.currentPage();
    const size = this.pageSizeState();
    return {
      start: count === 0 ? 0 : (page - 1) * size + 1,
      end: Math.min(page * size, count),
    };
  });

  constructor(rows: readonly Readonly<T>[], columns: readonly TablePaginationColumn<T>[], options: TablePaginationOptions<T>) {
    const sizes = options.pageSizes ?? [10, 25, 50, 100];
    if (sizes.length === 0 || sizes.some((size) => !Number.isFinite(size) || !Number.isInteger(size) || size <= 0)) {
      throw new Error('Page sizes must contain finite, positive integers.');
    }
    this.pageSizes = Object.freeze([...sizes]);
    this.pageSizeState.set(this.pageSizes[0]);
    this.searchKeys = Object.freeze([...options.searchKeys]);
    this.columns = Object.freeze(columns.map((column) => Object.freeze({ ...column })));
    Object.freeze(this.filtersState());
    this.setRows(rows);
  }

  /** When set, deletion is delegated to the host (API call + reload); the
   * local row drop is skipped and the host owns the success feedback. */
  onConfirmedDelete?: (row: T) => void;

  get rows(): readonly Readonly<T>[] {
    return this.rowsState();
  }

  get searchText(): string {
    return this.searchState();
  }

  get filters(): Readonly<TableFilters<T>> {
    return this.filtersState();
  }

  get sortKey(): Extract<keyof T, string> | null {
    return this.sortState().key;
  }

  get sortDir(): 'asc' | 'desc' | null {
    return this.sortState().direction;
  }

  get pageSize(): number {
    return this.pageSizeState();
  }

  get page(): number {
    return this.currentPage();
  }

  /** Retains the existing consumer API: filtered includes the active ordering. */
  get filtered(): readonly Readonly<T>[] {
    return this.sortedRows();
  }

  get resultCount(): number {
    return this.resultCountState();
  }

  get totalPages(): number {
    return this.totalPagesState();
  }

  get pages(): readonly number[] {
    return this.pageNumbers();
  }

  get paged(): readonly Readonly<T>[] {
    return this.pageRows();
  }

  get infoStart(): number {
    return this.range().start;
  }

  get infoEnd(): number {
    return this.range().end;
  }

  /** Replace scalar table-row snapshots rather than mutating cached inputs.
   * Reloading pages can explicitly reset; otherwise retain/clamp the current page. */
  setRows(rows: readonly Readonly<T>[], options: { resetPage?: boolean } = {}): void {
    const page = options.resetPage ? 1 : this.page;
    this.rowsState.set(Object.freeze(rows.map((row) => Object.freeze({ ...row }))));
    this.requestedPage.set(this.clampPage(page));
  }

  search(value: string): void {
    this.searchState.set(value);
    this.requestedPage.set(1);
  }

  setFilter<K extends Extract<keyof T, string>>(key: K, value: T[K] | null): void {
    if (!Object.is(this.filters[key], value)) {
      const filters: TableFilters<T> = { ...this.filtersState() };
      filters[key] = value;
      Object.freeze(filters);
      this.filtersState.set(filters);
    }
    this.requestedPage.set(1);
  }

  setPageSize(value: string | number): void {
    const size = Number(value);
    if (!Number.isFinite(size) || !Number.isInteger(size) || size < 1 || !this.pageSizes.includes(size)) {
      return;
    }
    this.pageSizeState.set(size);
    this.requestedPage.set(1);
  }

  goToPage(p: number): void {
    if (Number.isInteger(p) && p >= 1 && p <= this.totalPages) {
      this.requestedPage.set(p);
    }
  }

  sortBy(key: Extract<keyof T, string>): void {
    if (!this.columns.some((column) => column.key === key)) {
      return;
    }
    // Match the template's DataTables cycle: default -> asc -> desc -> default.
    if (this.sortKey === key && this.sortDir === 'asc') {
      this.sortState.set({ key, direction: 'desc' });
    } else if (this.sortKey === key && this.sortDir === 'desc') {
      this.sortState.set({ key: null, direction: null });
    } else {
      this.sortState.set({ key, direction: 'asc' });
    }
    this.requestedPage.set(1);
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
          this.setRows(this.rows.filter((r) => r !== row));
        });
      }
    });
  }

  private matchesFilters(row: Readonly<T>, filters: TableFilters<T>): boolean {
    for (const key in filters) {
      const value = filters[key];
      // Zero and false are real filters; only absent/empty selections clear one.
      if (value !== null && value !== undefined && value !== '' && row[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private matchesSearch(row: Readonly<T>, query: string): boolean {
    if (!query) {
      return true;
    }
    return this.searchKeys.some((key) => this.displayText(row[key]).toLowerCase().includes(query));
  }

  private clampPage(page: number): number {
    return Math.max(1, Math.min(page, this.totalPagesState()));
  }

  private displayText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }

  // Missing values sort first ascending/last descending. Custom comparators
  // handle formatted columns; the default never interprets text as a number.
  private compare(leftRow: Readonly<T>, rightRow: Readonly<T>, key: Extract<keyof T, string>, custom?: (left: T, right: T) => number): number {
    const a = leftRow[key];
    const b = rightRow[key];
    const missingA = a === null || a === undefined;
    const missingB = b === null || b === undefined;
    if (missingA || missingB) {
      return missingA === missingB ? 0 : missingA ? -1 : 1;
    }
    if (custom) {
      return custom(leftRow, rightRow);
    }
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    const left = this.displayText(a);
    const right = this.displayText(b);
    return left.localeCompare(right);
  }
}
