import { ClientTable } from './client-table';

describe('ClientTable ordering', () => {
  const rows = [
    { name: 'Bravo', elevation: '995 m' },
    { name: 'Charlie', elevation: '1,190 m' },
    { name: 'Alpha', elevation: '200 m' },
  ];
  let table: ClientTable<(typeof rows)[number]>;
  const names = () => table.filtered.map((row) => row.name);

  beforeEach(() => {
    table = new ClientTable(rows, [
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
