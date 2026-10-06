/** Row-independent pagination contract, also satisfied by TablePagination<T>. */
export interface PaginationState {
  readonly pageSizes: readonly number[];
  readonly pageSize: number;
  readonly infoStart: number;
  readonly infoEnd: number;
  readonly resultCount: number;
  readonly page: number;
  readonly totalPages: number;
  readonly pages: readonly number[];
  setPageSize(value: string | number): void;
  goToPage(page: number): void;
}
