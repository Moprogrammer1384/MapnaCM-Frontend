import { TablePagination, TablePaginationColumn } from './table-pagination';

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
      { key: 'elevation', title: 'Elevation', class: '' },
    ]);
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
    table.rows = [rows[0], { name: 'Echo', elevation: '500 m' }, rows[1], rows[2]];
    table.search('a');
    table.pageSize = 1;
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
    table.rows = [rows[2], rows[0]];
    expect(names()).toEqual(['Alpha', 'Bravo']);
    table.rows = [];
    expect(table.paged).toEqual([]);
    expect(table.sortClass('name')).toBe('');
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
    ], columns);
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
    table.page = 2;
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

  it('searches text, numeric IDs, decimals and booleans without stringifying stored values', () => {
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
    // @ts-expect-error A numeric parent filter cannot accept string IDs.
    table.setFilter('parentId', '0');
    // @ts-expect-error Missing properties cannot be used as filter keys.
    table.setFilter('plantId', 1);
  });
});
