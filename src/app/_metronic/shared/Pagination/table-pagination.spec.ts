import { TablePagination, TablePaginationColumn } from './table-pagination';
import Swal from 'sweetalert2';
import { compareElevationText } from './table-pagination-comparators';

describe('TablePagination ordering', () => {
  const rows = [
    { name: 'Bravo', elevation: '995 m' },
    { name: 'Charlie', elevation: '1,190 m' },
    { name: 'Alpha', elevation: '200 m' },
  ];
  let table: TablePagination<(typeof rows)[number]>;
  const names = () => table.filtered.map((row) => row.name);

  beforeEach(() => {
    table = new TablePagination(rows, [
      { key: 'name', title: 'Name', class: '' },
      { key: 'elevation', title: 'Elevation', class: '', compare: (left, right) => compareElevationText(left.elevation, right.elevation) },
    ], { searchKeys: ['name', 'elevation'], pageSizes: [1, 10, 25, 50, 100] });
  });

  it('starts in API order without an active header arrow', () => {
    expect(names()).toEqual(['Bravo', 'Charlie', 'Alpha']);
    expect(table.sortClass('name')).toBe('');
    expect(table.sortClass('elevation')).toBe('');
  });

  it('cycles through ascending, descending and original order without mutating rows', () => {
    table.sortBy('name');
    expect(names()).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(table.sortClass('name')).toBe('dt-ordering-asc');
    table.sortBy('name');
    expect(names()).toEqual(['Charlie', 'Bravo', 'Alpha']);
    expect(table.sortClass('name')).toBe('dt-ordering-desc');
    table.sortBy('name');
    expect(names()).toEqual(['Bravo', 'Charlie', 'Alpha']);
    expect(table.sortClass('name')).toBe('');
    expect(rows.map((row) => row.name)).toEqual(['Bravo', 'Charlie', 'Alpha']);
    table.sortBy('name');
    expect(names()).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('starts a newly selected column ascending and clears the previous arrow', () => {
    table.sortBy('name');
    table.sortBy('name');
    table.sortBy('elevation');
    expect(names()).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(table.sortClass('name')).toBe('');
    expect(table.sortClass('elevation')).toBe('dt-ordering-asc');
    table.sortBy('elevation');
    expect(names()).toEqual(['Charlie', 'Bravo', 'Alpha']);
  });

  it('restores filtered API order and resets pagination when clearing the sort', () => {
    table.setRows([rows[0], { name: 'Echo', elevation: '500 m' }, rows[1], rows[2]]);
    table.search('a');
    table.setPageSize(1);
    table.sortBy('name');
    table.sortBy('name');
    table.goToPage(2);
    table.sortBy('name');
    expect(names()).toEqual(['Bravo', 'Charlie', 'Alpha']);
    expect(table.page).toBe(1);
    expect(table.paged[0].name).toBe('Bravo');
  });

  it('uses the current response order after a reload in the default state', () => {
    table.sortBy('name');
    table.sortBy('name');
    table.sortBy('name');
    table.setRows([rows[2], rows[0]]);
    expect(names()).toEqual(['Alpha', 'Bravo']);
    table.setRows([]);
    expect(table.paged).toEqual([]);
    expect(table.sortClass('name')).toBe('');
  });
});

describe('TablePagination cached derivations', () => {
  interface TextProbe {
    toString(): string;
  }
  interface Row {
    id: number;
    group: number;
    searchValue: TextProbe;
    sortValue: TextProbe;
  }
  let table: TablePagination<Row>;
  let sourceRows: Row[];
  let searchReads: number;
  let sortReads: number;
  const ids = () => table.paged.map((row) => row.id);

  beforeEach(() => {
    searchReads = 0;
    sortReads = 0;
    // Count the actual search/comparison work without spying on private methods
    // or global array prototypes. All rows match before reaching sortValue.
    const searchValue = { toString: () => { searchReads++; return 'needle'; } };
    const sortValue = (value: string): TextProbe => ({ toString: () => { sortReads++; return value; } });
    sourceRows = [
      { id: 1, group: 1, searchValue, sortValue: sortValue('Bravo') },
      { id: 2, group: 2, searchValue, sortValue: sortValue('Charlie') },
      { id: 3, group: 1, searchValue, sortValue: sortValue('Alpha') },
    ];
    table = new TablePagination<Row>(sourceRows, [
      { key: 'sortValue', title: 'Sort', class: '' },
    ] satisfies readonly TablePaginationColumn<Row>[], { searchKeys: ['searchValue'], pageSizes: [1, 2, 10] });
    table.search('needle');
    table.sortBy('sortValue');
    table.setPageSize(1);
    expect(ids()).toEqual([3]);
  });

  it('reuses result arrays, page numbers and metadata on repeated reads', () => {
    const filtered = table.filtered;
    const paged = table.paged;
    const pages = table.pages;
    const work = [searchReads, sortReads];
    for (let i = 0; i < 5; i++) {
      expect(table.filtered === filtered).toBeTrue();
      expect(table.paged === paged).toBeTrue();
      expect(table.pages === pages).toBeTrue();
      expect([table.resultCount, table.totalPages, table.page, table.infoStart, table.infoEnd]).toEqual([3, 3, 1, 1, 1]);
    }
    expect([searchReads, sortReads]).toEqual(work);
  });

  it('changes only the slice/range on page changes and reuses page numbers', () => {
    const filtered = table.filtered;
    const paged = table.paged;
    const pages = table.pages;
    const work = [searchReads, sortReads];
    table.goToPage(2);
    expect(ids()).toEqual([1]);
    expect(table.paged === paged).toBeFalse();
    expect(table.filtered === filtered).toBeTrue();
    expect(table.pages === pages).toBeTrue();
    expect([table.infoStart, table.infoEnd]).toEqual([2, 2]);
    expect([searchReads, sortReads]).toEqual(work);
  });

  it('updates page-size metadata and resets the page without filtering or sorting', () => {
    const filtered = table.filtered;
    const work = [searchReads, sortReads];
    table.goToPage(3);
    table.setPageSize('2');
    expect(ids()).toEqual([3, 1]);
    expect(table.filtered === filtered).toBeTrue();
    expect(table.pages).toEqual([1, 2]);
    expect([table.page, table.infoStart, table.infoEnd]).toEqual([1, 1, 2]);
    expect([searchReads, sortReads]).toEqual(work);
  });

  it('refreshes only ordering on sort changes and preserves cached filtering/counts', () => {
    const filtered = table.filtered;
    const searchWork = searchReads;
    const sortWork = sortReads;
    table.goToPage(3);
    table.sortBy('sortValue');
    expect([table.resultCount, table.totalPages, table.infoStart]).toEqual([3, 3, 1]);
    expect(sortReads).toBe(sortWork); // Count/metadata do not trigger sorting.
    expect(ids()).toEqual([2]);
    expect(table.filtered === filtered).toBeFalse();
    expect(searchReads).toBe(searchWork);
    expect(sortReads).toBeGreaterThan(sortWork);
    const descendingWork = sortReads;
    table.sortBy('sortValue');
    expect(table.filtered.map((row) => row.id)).toEqual([1, 2, 3]);
    expect([searchReads, sortReads]).toEqual([searchWork, descendingWork]);
    expect(sourceRows.map((row) => row.id)).toEqual([1, 2, 3]);
  });

  it('refreshes filtering on search/filter updates and sorts the new results lazily', () => {
    const filtered = table.filtered;
    const searchWork = searchReads;
    const sortWork = sortReads;
    table.goToPage(3);
    table.search(' needle ');
    expect(table.resultCount).toBe(3);
    expect(table.page).toBe(1);
    expect(searchReads).toBeGreaterThan(searchWork);
    expect(sortReads).toBe(sortWork);
    expect(table.filtered === filtered).toBeFalse();
    const filteredWork = searchReads;
    const sortedWork = sortReads;
    table.setFilter('group', 1);
    expect(table.resultCount).toBe(2);
    expect(searchReads).toBeGreaterThan(filteredWork);
    expect(sortReads).toBe(sortedWork);
    expect(table.filtered.map((row) => row.id)).toEqual([3, 1]);
    table.setFilter('group', null);
    expect(table.resultCount).toBe(3);
  });

  it('does not invalidate results for unchanged search/filter/page-size inputs', () => {
    table.setFilter('group', 1);
    const filtered = table.filtered;
    const work = [searchReads, sortReads];
    table.goToPage(2);
    table.search('needle');
    table.setFilter('group', 1);
    table.setPageSize(1);
    expect(table.page).toBe(1);
    expect(table.filtered === filtered).toBeTrue();
    expect([searchReads, sortReads]).toEqual(work);
  });

  it('refreshes row replacements, clamps after shrinkage, and does not resurrect an old page', () => {
    table.goToPage(3);
    const searchWork = searchReads;
    table.setRows(sourceRows.slice(0, 2));
    expect(searchReads).toBeGreaterThan(searchWork);
    expect([table.resultCount, table.page, table.totalPages]).toEqual([2, 2, 2]);
    expect(ids()).toEqual([2]);
    expect([table.infoStart, table.infoEnd]).toEqual([2, 2]);
    table.setRows(sourceRows);
    expect(table.page).toBe(2);
    table.setRows(sourceRows, { resetPage: true });
    expect(table.page).toBe(1);
  });

  it('handles empty results and empty row replacements with valid ranges and controls', () => {
    table.goToPage(3);
    table.search('missing');
    expect([table.resultCount, table.page, table.totalPages, table.infoStart, table.infoEnd]).toEqual([0, 1, 1, 0, 0]);
    expect(table.paged).toEqual([]);
    expect(table.pages).toEqual([1]);
    table.goToPage(2);
    expect(table.page).toBe(1);
    table.search('needle');
    table.goToPage(3);
    table.setRows([]);
    expect([table.resultCount, table.page, table.totalPages, table.infoStart, table.infoEnd]).toEqual([0, 1, 1, 0, 0]);
    expect(table.paged).toEqual([]);
  });

  it('isolates scalar row inputs and refreshes explicit replacements of the same input array', () => {
    table.setFilter('group', 1);
    expect(table.resultCount).toBe(2);
    sourceRows[0].group = 2;
    sourceRows.push({ ...sourceRows[2], id: 4 });
    expect(table.rows.length).toBe(3);
    expect(table.rows[0].group).toBe(1);
    const filtered = table.filtered;
    table.setRows(sourceRows);
    expect(table.filtered === filtered).toBeFalse();
    expect(table.filtered.map((row) => row.id)).toEqual([3, 4]);
    expect(Object.isFrozen(table.rows)).toBeTrue();
    expect(Object.isFrozen(table.rows[0])).toBeTrue();
    expect(Object.isFrozen(table.filters)).toBeTrue();
  });

  it('rejects invalid pages/sizes without changing valid pagination or cached results', () => {
    const filtered = table.filtered;
    const work = [searchReads, sortReads];
    for (const value of [0, -1, 1.5, NaN, Infinity]) {
      table.goToPage(value);
      table.setPageSize(value);
    }
    expect([table.page, table.pageSize]).toEqual([1, 1]);
    expect(table.filtered === filtered).toBeTrue();
    expect([searchReads, sortReads]).toEqual(work);
  });

  it('refreshes cached results and clamps after local confirmed deletion', async () => {
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true, isDenied: false, isDismissed: false, value: true });
    table.goToPage(3);
    const row = table.paged[0];
    table.confirmDelete(row, 'Charlie');
    // Confirmation and the success notification each resolve a promise.
    await Promise.resolve();
    await Promise.resolve();
    expect(table.rows.map((item) => item.id)).toEqual([1, 3]);
    expect([table.page, table.resultCount, table.totalPages]).toEqual([2, 2, 2]);
    expect(ids()).toEqual([1]);
  });
});

describe('TablePagination native values', () => {
  interface Row {
    id: number;
    parentId: number;
    name: string;
    sensitivity: number | null;
    enabled: boolean;
    tag?: string | null;
  }

  const columns = [
    { key: 'id', title: 'ID', class: '' },
    { key: 'name', title: 'Name', class: '' },
    { key: 'sensitivity', title: 'Sensitivity', class: '' },
  ] satisfies readonly TablePaginationColumn<Row>[];
  let table: TablePagination<Row>;

  beforeEach(() => {
    table = new TablePagination<Row>([
      { id: 10, parentId: 0, name: 'Bravo', sensitivity: 10, enabled: false },
      { id: 2, parentId: 1, name: 'Alpha', sensitivity: -0.25, enabled: true, tag: null },
      { id: 3, parentId: 0, name: 'Charlie', sensitivity: null, enabled: false, tag: 'VIB' },
      { id: 4, parentId: 1, name: 'Delta', sensitivity: 0, enabled: true, tag: '' },
    ], columns, { searchKeys: ['name', 'tag', 'sensitivity', 'enabled'], pageSizes: [1, 10, 25, 50, 100] });
  });

  it('sorts native numbers and nullable decimals without mutating source data', () => {
    table.sortBy('id');
    expect(table.filtered.map((row) => row.id)).toEqual([2, 3, 4, 10]);
    table.sortBy('sensitivity');
    expect(table.filtered.map((row) => row.sensitivity)).toEqual([null, -0.25, 0, 10]);
    table.sortBy('sensitivity');
    expect(table.filtered.map((row) => row.sensitivity)).toEqual([10, 0, -0.25, null]);
    table.sortBy('sensitivity');
    expect(table.filtered).toEqual(table.rows);
    expect(table.rows.map((row) => row.id)).toEqual([10, 2, 3, 4]);
  });

  it('combines exact native filters, including zero and false, and clears selections', () => {
    table.setPageSize(1);
    table.goToPage(2);
    table.setFilter('parentId', 0);
    table.setFilter('enabled', false);
    expect(table.page).toBe(1);
    expect(table.filtered.map((row) => row.id)).toEqual([10, 3]);
    table.setFilter('sensitivity', 0);
    expect(table.filtered).toEqual([]);
    table.setFilter('parentId', null);
    table.setFilter('enabled', null);
    expect(table.filtered.map((row) => row.id)).toEqual([4]);
    table.setFilter('sensitivity', null);
    table.setFilter('tag', '');
    expect(table.filtered.length).toBe(4);
  });

  it('searches configured text, decimals and booleans without stringifying stored values', () => {
    table.search('  vIb  ');
    expect(table.filtered.map((row) => row.id)).toEqual([3]);
    table.search('-0.25');
    expect(table.filtered[0].sensitivity).toBe(-0.25);
    table.search('10');
    expect(table.filtered.map((row) => row.id)).toEqual([10]);
    table.search('false');
    expect(table.filtered.map((row) => row.id)).toEqual([10, 3]);
    table.search('null');
    expect(table.filtered).toEqual([]);
    table.search('undefined');
    expect(table.filtered).toEqual([]);
    expect(table.rows[2].sensitivity).toBeNull();
    expect(table.rows[0].tag).toBeUndefined();
  });

  it('excludes hidden IDs and parent IDs from searching', () => {
    table.setRows([{ id: 901, parentId: 76543, name: 'Bearing', sensitivity: null, enabled: false, tag: null }]);
    table.search('901');
    expect(table.resultCount).toBe(0);
    table.search('76543');
    expect(table.resultCount).toBe(0);
    table.search(' BEARING ');
    expect(table.resultCount).toBe(1);
  });

  it('keeps paging and entry counts correct after filtering and searching', () => {
    table.setPageSize('1');
    table.goToPage(3);
    expect(table.paged[0].id).toBe(3);
    expect([table.infoStart, table.infoEnd, table.totalPages]).toEqual([3, 3, 4]);
    table.setFilter('parentId', 0);
    expect(table.pages).toEqual([1, 2]);
    expect(table.paged[0].id).toBe(10);
    table.search('missing');
    expect(table.paged).toEqual([]);
    expect([table.infoStart, table.infoEnd, table.totalPages]).toEqual([0, 0, 1]);
  });

  it('checks column names and per-field filter types at compilation', () => {
    const invalidColumns = [
      // @ts-expect-error Column keys must be declared row fields.
      { key: 'sensitivty', title: 'Sensitivity', class: '' },
    ] satisfies readonly TablePaginationColumn<Row>[];
    expect(invalidColumns.length).toBe(1);
    const invalidSearchKeys = [
      // @ts-expect-error Search keys must be declared row fields.
      'sensitivty',
    ] satisfies readonly Extract<keyof Row, string>[];
    expect(invalidSearchKeys.length).toBe(1);
    // @ts-expect-error A numeric parent filter cannot accept string IDs.
    table.setFilter('parentId', '0');
    // @ts-expect-error Missing properties cannot be used as filter keys.
    table.setFilter('plantId', 1);
  });
});

describe('TablePagination pagination safeguards and window', () => {
  interface Row { id: number; name: string; group: number; }
  const rows: Row[] = Array.from({ length: 230 }, (_, index) => ({ id: index + 1, name: 'Bearing', group: index < 15 ? 1 : 2 }));
  const columns = [{ key: 'name', title: 'Name', class: '' }] satisfies readonly TablePaginationColumn<Row>[];
  let table: TablePagination<Row>;

  beforeEach(() => {
    table = new TablePagination(rows, columns, { searchKeys: ['name'] });
  });

  it('accepts only configured finite positive integer sizes and preserves state on rejection', () => {
    table.goToPage(3);
    const paged = table.paged;
    const filtered = table.filtered;
    const pages = table.pages;
    for (const value of [1, 2, 9, 11, 20, 101, 0, -1, 1.5, NaN, Infinity, -Infinity, '', 'abc', '25.5']) {
      table.setPageSize(value);
      expect([table.page, table.pageSize]).toEqual([3, 10]);
      expect(table.paged === paged).toBeTrue();
      expect(table.filtered === filtered).toBeTrue();
      expect(table.pages === pages).toBeTrue();
    }
    table.setPageSize('25');
    expect([table.page, table.pageSize, table.totalPages]).toEqual([1, 25, 10]);
    expect(table.filtered === filtered).toBeTrue();
    table.goToPage(3);
    table.setPageSize(25);
    expect(table.page).toBe(1);
  });

  it('accepts only integer pages in the valid range', () => {
    table.goToPage(3);
    const paged = table.paged;
    for (const value of [-1, 0, 1.5, 24, NaN, Infinity, -Infinity]) {
      table.goToPage(value);
      expect(table.page).toBe(3);
      expect(table.paged === paged).toBeTrue();
    }
    table.goToPage(23);
    expect(table.page).toBe(23);
    table.goToPage(1);
    expect(table.page).toBe(1);
  });

  it('shifts five consecutive page numbers around the current page at both boundaries', () => {
    for (const [page, expected] of [
      [1, [1, 2, 3, 4, 5]],
      [2, [1, 2, 3, 4, 5]],
      [3, [1, 2, 3, 4, 5]],
      [4, [2, 3, 4, 5, 6]],
      [12, [10, 11, 12, 13, 14]],
      [21, [19, 20, 21, 22, 23]],
      [22, [19, 20, 21, 22, 23]],
      [23, [19, 20, 21, 22, 23]],
    ] satisfies readonly (readonly [number, readonly number[]])[]) {
      table.goToPage(page);
      expect(table.pages).toEqual(expected);
      expect(table.pages).toContain(table.page);
    }
    table.setRows(rows.slice(0, 40));
    expect(table.page).toBe(4);
    expect(table.pages).toEqual([1, 2, 3, 4]);
  });

  it('clamps after shrinking rows and resets after filtering/searching with valid empty metadata', () => {
    table.goToPage(23);
    table.setRows(rows.slice(0, 15));
    expect([table.page, table.totalPages, table.infoStart, table.infoEnd]).toEqual([2, 2, 11, 15]);
    table.setRows(rows);
    expect(table.page).toBe(2);
    table.goToPage(23);
    table.setFilter('group', 1);
    expect([table.page, table.totalPages, table.resultCount]).toEqual([1, 2, 15]);
    table.goToPage(2);
    table.search('missing');
    expect([table.page, table.totalPages, table.infoStart, table.infoEnd]).toEqual([1, 1, 0, 0]);
    expect(table.pages).toEqual([1]);
    expect(table.paged).toEqual([]);
    table.goToPage(2);
    expect(table.page).toBe(1);
    table.setRows([]);
    expect([table.page, table.totalPages, table.resultCount]).toEqual([1, 1, 0]);
  });

  it('uses immutable custom sizes and rejects invalid size configurations', () => {
    const sizes = [5, 15];
    const custom = new TablePagination(rows, columns, { searchKeys: ['name'], pageSizes: sizes });
    sizes.push(10);
    expect(custom.pageSize).toBe(5);
    custom.setPageSize(10);
    expect(custom.pageSize).toBe(5);
    custom.setPageSize(15);
    expect(custom.pageSize).toBe(15);
    for (const pageSizes of [[], [0], [-1], [1.5], [Infinity], [NaN]]) {
      expect(() => new TablePagination(rows, columns, { searchKeys: ['name'], pageSizes }))
        .toThrowError('Page sizes must contain finite, positive integers.');
    }
  });
});

describe('TablePagination column-specific sorting', () => {
  interface Row { id: number; name: string; tag: string | null; amount: number | null; visible: boolean; }
  const rows: Row[] = [
    { id: 1, name: '2 Pump', tag: '2A', amount: 2, visible: true },
    { id: 2, name: '10 Pump', tag: '10Z', amount: 10, visible: true },
    { id: 3, name: '10 Pump', tag: '10A', amount: 10, visible: true },
    { id: 4, name: '3 Pump', tag: null, amount: null, visible: false },
  ];
  const columns = [
    { key: 'name', title: 'Name', class: '' },
    { key: 'tag', title: 'Tag', class: '' },
    { key: 'amount', title: 'Amount', class: '' },
  ] satisfies readonly TablePaginationColumn<Row>[];
  let table: TablePagination<Row>;
  const ids = () => table.filtered.map((row) => row.id);

  beforeEach(() => {
    table = new TablePagination(rows, columns, { searchKeys: ['name', 'tag', 'amount'] });
  });

  it('sorts digit-prefixed names/tags textually and native numbers numerically', () => {
    table.sortBy('name');
    expect(ids()).toEqual([2, 3, 1, 4]);
    table.sortBy('tag');
    expect(ids()).toEqual([4, 3, 2, 1]);
    table.sortBy('amount');
    expect(ids()).toEqual([4, 1, 2, 3]);
    table.sortBy('amount');
    expect(ids()).toEqual([2, 3, 1, 4]);
    expect(rows.map((row) => row.id)).toEqual([1, 2, 3, 4]);
  });

  it('retains API order for ties in both directions and restores filtered order when cleared', () => {
    table.setFilter('visible', true);
    table.sortBy('name');
    expect(ids()).toEqual([2, 3, 1]);
    table.sortBy('name');
    expect(ids()).toEqual([1, 2, 3]);
    table.sortBy('name');
    expect(ids()).toEqual([1, 2, 3]);
    expect(table.filters.visible).toBeTrue();
    expect(table.sortClass('name')).toBe('');
    table.sortBy('id'); // Declared row fields must also be configured columns.
    expect(table.sortKey).toBeNull();
  });

  it('supplies typed rows to custom comparators and handles nulls before calling them', () => {
    const compare = jasmine.createSpy<(left: Row, right: Row) => number>('compare').and.callFake((left, right) => {
      if (left.amount === null || right.amount === null) {
        throw new Error('Null comparison should be handled centrally.');
      }
      return left.amount - right.amount;
    });
    table = new TablePagination(rows, [{ key: 'amount', title: 'Amount', class: '', compare }], { searchKeys: ['name'] });
    table.sortBy('amount');
    expect(ids()).toEqual([4, 1, 2, 3]);
    expect(compare).toHaveBeenCalled();
    table.sortBy('amount');
    expect(ids()).toEqual([2, 3, 1, 4]);
  });
});
