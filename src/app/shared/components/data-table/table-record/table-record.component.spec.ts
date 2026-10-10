import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureMetronicPrimeNG } from 'src/app/shared/components/data-table/testing/prime-table-test-support';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablePagination } from '../pagination/table-pagination';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';

interface RecordRow {
  id: number;
  name: string;
  value: number | null;
  tag?: string | null;
}

@Component({
  template: `
    <app-table-record [table]="table" (editRecord)="edited = $event" (deleteRecord)="deleted = $event"></app-table-record>
    <app-table-record [table]="types" tableId="type-table" (editRecord)="editedType = $event"></app-table-record>
  `,
})
class TableRecordHostComponent {
  table = new TablePagination<RecordRow>([
    { id: 2, name: 'Zulu', value: 0, tag: null },
    { id: 1, name: 'Alpha', value: null },
    { id: 3, name: '<b>Beta</b>', value: -0.25, tag: 'B' },
  ], [
    { key: 'name', title: 'Name', class: 'min-w-125px' },
    { key: 'value', title: 'Value', class: 'min-w-100px' },
    { key: 'tag', title: 'Tag', class: '' },
  ], { searchKeys: ['name', 'value', 'tag'], pageSizes: [2, 4] });
  types = new TablePagination([{ id: 10, name: 'Velocity' }], [
    { key: 'name', title: 'Type', class: 'min-w-150px' },
  ], { searchKeys: ['name'] });
  edited?: Readonly<RecordRow>;
  deleted?: Readonly<RecordRow>;
  editedType?: Readonly<{ id: number; name: string }>;
}

describe('TableRecordComponent through SharedModule', () => {
  let fixture: ComponentFixture<TableRecordHostComponent>;
  let host: TableRecordHostComponent;
  let table: HTMLTableElement;
  const cells = (row: number) => Array.from(table.querySelectorAll('tbody tr')[row].querySelectorAll('td'),
    (cell) => cell.textContent!.trim());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TableRecordHostComponent],
      imports: [SharedModule, NoopAnimationsModule],
    }).compileComponents();
    configureMetronicPrimeNG();
    fixture = TestBed.createComponent(TableRecordHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    table = fixture.nativeElement.querySelector('#kt_profile_overview_table table');
  });

  afterEach(() => fixture.destroy());

  it('renders only configured columns in order with native numbers and blank nullable cells', () => {
    expect(Array.from(table.querySelectorAll('th'), (header) => header.textContent!.trim()))
      .toEqual(['Name', 'Value', 'Tag', 'Actions']);
    expect(cells(0)).toEqual(['Zulu', '0', '', '']);
    expect(cells(1)).toEqual(['Alpha', '', '', '']);
    expect(table.querySelector('th')!.classList.contains('min-w-125px')).toBeTrue();
    expect(table.classList.contains('table-row-dashed')).toBeTrue();
    host.table.goToPage(2);
    fixture.detectChanges();
    expect(cells(0)).toEqual(['<b>Beta</b>', '-0.25', 'B', '']);
    expect(table.querySelector('tbody b')).toBeNull();
  });

  it('delegates the three-state header sorting cycle and resets the page', () => {
    const header = table.querySelector<HTMLTableCellElement>('th:nth-child(2)')!;
    const sort = spyOn(host.table, 'sortBy').and.callThrough();
    host.table.goToPage(2);
    header.click();
    fixture.detectChanges();
    expect(sort).toHaveBeenCalledOnceWith('value');
    expect(host.table.page).toBe(1);
    expect(header.classList.contains('dt-ordering-asc')).toBeTrue();
    expect(cells(0)[0]).toBe('Alpha');
    header.click();
    fixture.detectChanges();
    expect(header.classList.contains('dt-ordering-desc')).toBeTrue();
    expect(cells(0)[0]).toBe('Zulu');
    header.click();
    fixture.detectChanges();
    expect(host.table.sortDir).toBeNull();
    expect(header.classList.contains('dt-ordering-desc')).toBeFalse();
    expect(cells(0)[0]).toBe('Zulu');
  });

  it('emits the current paged row once for edit/delete without mutating records', () => {
    const confirm = spyOn(host.table, 'confirmDelete');
    host.table.goToPage(2);
    fixture.detectChanges();
    const row = host.table.paged[0];
    table.querySelector<HTMLElement>('[aria-label="Edit record"]')!.click();
    table.querySelector<HTMLElement>('[aria-label="Delete record"]')!.click();
    expect(host.edited === row).toBeTrue();
    expect(host.deleted === row).toBeTrue();
    expect(host.edited!.id).toBe(3);
    expect(confirm).not.toHaveBeenCalled();
    expect(host.table.resultCount).toBe(3);
  });

  it('reflects external search, row replacement and page-size changes with the correct empty colspan', () => {
    host.table.search('missing');
    fixture.detectChanges();
    expect(table.querySelector('tbody td')!.getAttribute('colspan')).toBe('4');
    expect(table.querySelector('tbody')!.textContent).toContain('No matching records found');
    expect(table.querySelector('[aria-label="Delete record"]')).toBeNull();
    host.table.search('');
    host.table.setPageSize(4);
    host.table.setRows([{ id: 7, name: 'Replacement', value: 12, tag: 'R' }]);
    fixture.detectChanges();
    expect(cells(0)).toEqual(['Replacement', '12', 'R', '']);
    expect(table.querySelectorAll('tbody tr').length).toBe(1);
    host.table.setRows([]);
    fixture.detectChanges();
    expect(table.querySelector('tbody td')!.getAttribute('colspan')).toBe('4');
  });

  it('keeps different row types, table IDs, actions, sorting and empty states independent', () => {
    const other: HTMLTableElement = fixture.nativeElement.querySelector('#type-table table');
    other.querySelector<HTMLElement>('[aria-label="Edit record"]')!.click();
    other.querySelector<HTMLTableCellElement>('th')!.click();
    fixture.detectChanges();
    expect(host.editedType === host.types.paged[0]).toBeTrue();
    expect(host.edited).toBeUndefined();
    expect(host.types.sortDir).toBe('asc');
    expect(host.table.sortDir).toBeNull();
    host.types.setRows([]);
    fixture.detectChanges();
    expect(other.querySelector('tbody td')!.getAttribute('colspan')).toBe('2');
    expect(table.querySelectorAll('tbody tr').length).toBe(2);
  });
});
