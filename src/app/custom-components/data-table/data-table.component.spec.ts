import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../_metronic/shared/shared.module';
import { TablePagination } from './Pagination/table-pagination';

interface RecordRow {
  id: number;
  name: string;
  amount: number | null;
}

@Component({
  template: `
    <app-data-table [table]="table" (editRecord)="onEdit($event)" (deleteRecord)="onDelete($event)"></app-data-table>
    <app-data-table [table]="types" tableId="type-table" (editRecord)="editedType = $event"></app-data-table>
  `,
})
class DataTableHostComponent {
  table = new TablePagination<RecordRow>(
    Array.from({ length: 32 }, (_, index) => ({ id: index + 1, name: `Item ${index + 1}`, amount: 32 - index })),
    [
      { key: 'name', title: 'Name', class: 'min-w-125px' },
      { key: 'amount', title: 'Amount', class: 'min-w-100px' },
    ], { searchKeys: ['name'] }
  );
  types = new TablePagination([
    { code: 'V', label: 'Velocity' },
    { code: 'A', label: 'Acceleration' },
    { code: 'D', label: 'Displacement' },
  ], [{ key: 'label', title: 'Type', class: '' }], { searchKeys: ['label'], pageSizes: [1, 2] });
  edited?: Readonly<RecordRow>;
  deleted?: Readonly<RecordRow>;
  editedType?: Readonly<{ code: string; label: string }>;

  onEdit(row: Readonly<RecordRow>): void {
    this.edited = row;
  }

  onDelete(row: Readonly<RecordRow>): void {
    this.deleted = row;
  }
}

describe('DataTableComponent through SharedModule', () => {
  let fixture: ComponentFixture<DataTableHostComponent>;
  let host: DataTableHostComponent;
  let wrapper: HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };
  const button = (label: string) => wrapper.querySelector<HTMLButtonElement>(`button[aria-label="${label} page"]`)!;
  const sizeSelect = () => wrapper.querySelector<HTMLSelectElement>('select[aria-label="Page size"]')!;
  const info = () => wrapper.querySelector('.dataTables_info')!.textContent!;
  const firstCells = () => Array.from(wrapper.querySelectorAll('tbody tr:first-child td'), (cell) => cell.textContent!.trim());
  const rowCount = () => wrapper.querySelectorAll('tbody tr').length;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DataTableHostComponent],
      imports: [SharedModule],
    }).compileComponents();
    fixture = TestBed.createComponent(DataTableHostComponent);
    host = fixture.componentInstance;
    await settle();
    wrapper = fixture.nativeElement.querySelector('app-data-table');
  });

  afterEach(() => fixture.destroy());

  it('keeps the rendered rows and footer synchronized when navigating and sorting', async () => {
    expect(wrapper.querySelector('#kt_profile_overview_table')).not.toBeNull();
    expect(wrapper.querySelectorAll('.table-responsive.dataTables_wrapper').length).toBe(1);
    expect(rowCount()).toBe(10);
    expect(firstCells()).toEqual(['Item 1', '32', '']);
    expect(info()).toContain('1 to 10 of 32 entries');
    button('Next').click();
    await settle();
    expect(firstCells()).toEqual(['Item 11', '22', '']);
    expect(info()).toContain('11 to 20 of 32 entries');
    button('Last').click();
    await settle();
    expect(rowCount()).toBe(2);
    expect(firstCells()).toEqual(['Item 31', '2', '']);
    expect(info()).toContain('31 to 32 of 32 entries');
    wrapper.querySelector<HTMLTableCellElement>('th:nth-child(2)')!.click();
    await settle();
    expect(firstCells()).toEqual(['Item 32', '1', '']);
    expect(info()).toContain('1 to 10 of 32 entries');
    expect(button('First').disabled).toBeTrue();
    expect(wrapper.querySelector('.pagination .active button')!.getAttribute('aria-current')).toBe('page');
  });

  it('applies native and Select2 size changes once to both rows and entry ranges', async () => {
    const changeSize = spyOn(host.table, 'setPageSize').and.callThrough();
    expect(wrapper.querySelectorAll('.select2-container').length).toBe(1);
    button('Last').click();
    await settle();
    const select = sizeSelect();
    select.value = '25';
    select.dispatchEvent(new Event('change'));
    await settle();
    expect(changeSize).toHaveBeenCalledOnceWith('25');
    expect(host.table.page).toBe(1);
    expect(rowCount()).toBe(25);
    expect(info()).toContain('1 to 25 of 32 entries');
    changeSize.calls.reset();
    button('Next').click();
    await settle();
    window.jQuery(select).val('50').trigger('change');
    await settle();
    expect(changeSize).toHaveBeenCalledOnceWith('50');
    expect(host.table.page).toBe(1);
    expect(rowCount()).toBe(32);
    expect(info()).toContain('1 to 32 of 32 entries');
    expect(button('Next').disabled).toBeTrue();
  });

  it('forwards each action once with the current row snapshot and leaves confirmation to the page', async () => {
    const edit = spyOn(host, 'onEdit').and.callThrough();
    const remove = spyOn(host, 'onDelete').and.callThrough();
    const confirm = spyOn(host.table, 'confirmDelete');
    button('Next').click();
    await settle();
    const row = host.table.paged[0];
    wrapper.querySelector<HTMLElement>('[aria-label="Edit record"]')!.click();
    wrapper.querySelector<HTMLElement>('[aria-label="Delete record"]')!.click();
    expect(edit).toHaveBeenCalledOnceWith(row);
    expect(remove).toHaveBeenCalledOnceWith(row);
    expect(host.edited === row).toBeTrue();
    expect(host.deleted === row).toBeTrue();
    expect(host.edited!.id).toBe(11);
    expect(confirm).not.toHaveBeenCalled();
    expect(host.table.resultCount).toBe(32);
  });

  it('updates both views for external search, row replacement, empty results and a new table input', async () => {
    button('Last').click();
    await settle();
    host.table.search('Item 32');
    await settle();
    expect(firstCells()).toEqual(['Item 32', '1', '']);
    expect(info()).toContain('1 to 1 of 1 entries');
    host.table.search('missing');
    await settle();
    expect(wrapper.querySelector('tbody td')!.getAttribute('colspan')).toBe('3');
    expect(wrapper.querySelector('tbody')!.textContent).toContain('No matching records found');
    expect(info()).toContain('0 to 0 of 0 entries');
    for (const label of ['First', 'Previous', 'Next', 'Last']) {
      expect(button(label).disabled).toBeTrue();
    }
    host.table.search('');
    host.table.setRows([{ id: 99, name: 'Replacement', amount: null }]);
    await settle();
    expect(firstCells()).toEqual(['Replacement', '', '']);
    expect(info()).toContain('1 to 1 of 1 entries');
    host.table = new TablePagination<RecordRow>([
      { id: 101, name: 'New first', amount: 0 },
      { id: 102, name: 'New second', amount: 2 },
    ], host.table.columns, { searchKeys: ['name'], pageSizes: [1, 2] });
    await settle();
    expect(sizeSelect().value).toBe('1');
    button('Next').click();
    await settle();
    expect(firstCells()).toEqual(['New second', '2', '']);
    expect(info()).toContain('2 to 2 of 2 entries');
  });

  it('keeps wrappers with different row types, IDs, pagination and actions independent', async () => {
    const other: HTMLElement = fixture.nativeElement.querySelectorAll('app-data-table')[1];
    expect(other.querySelector('#type-table')).not.toBeNull();
    other.querySelector<HTMLButtonElement>('button[aria-label="Last page"]')!.click();
    await settle();
    expect(other.querySelector('tbody td')!.textContent).toBe('Displacement');
    expect(other.querySelector('.dataTables_info')!.textContent).toContain('3 to 3 of 3 entries');
    other.querySelector<HTMLElement>('[aria-label="Edit record"]')!.click();
    expect(host.editedType === host.types.paged[0]).toBeTrue();
    expect(host.edited).toBeUndefined();
    expect(host.table.page).toBe(1);
    expect(firstCells()).toEqual(['Item 1', '32', '']);
    const select = other.querySelector<HTMLSelectElement>('select')!;
    window.jQuery(select).val('2').trigger('change');
    await settle();
    expect(host.types.pageSize).toBe(2);
    expect(host.table.pageSize).toBe(10);
    expect(rowCount()).toBe(10);
  });
});
