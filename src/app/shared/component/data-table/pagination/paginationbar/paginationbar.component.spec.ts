import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureMetronicPrimeNG } from 'src/app/shared/component/data-table/testing/prime-table-test-support';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { TablePagination } from '../table-pagination';
import { selectPageSize } from '../../testing/prime-table-test-support';

@Component({
  template: `
    <app-paginationbar [table]="table"></app-paginationbar>
    <app-paginationbar [table]="other"></app-paginationbar>
    <ng-container *ngIf="showParts">
      <app-pagination-records [table]="other"></app-pagination-records>
      <app-pagination-pages [table]="other"></app-pagination-pages>
    </ng-container>
  `,
})
class TestHostComponent {
  table = new TablePagination(
    Array.from({ length: 120 }, (_, id) => ({ id, name: `Row ${id}` })),
    [], { searchKeys: ['name'] }
  );
  other = new TablePagination(
    Array.from({ length: 7 }, (_, code) => ({ code })),
    [], { searchKeys: ['code'], pageSizes: [2, 4] }
  );
  showParts = false;
}

describe('PaginationbarComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let bar: HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };
  const button = (label: string) => bar.querySelector<HTMLButtonElement>(`button[aria-label="${label} Page"]`)!;
  const sizeLabel = () => bar.querySelector('.p-select-label')!.textContent!.trim();
  const info = () => bar.querySelector('.dataTables_info')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent],
      imports: [SharedModule, NoopAnimationsModule],
    }).compileComponents();
    configureMetronicPrimeNG();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    await settle();
    bar = fixture.nativeElement.querySelector('app-paginationbar');
  });

  afterEach(() => fixture.destroy());

  it('composes PrimeNG paginator and select without a duplicate Select2 plugin', async () => {
    expect(bar.querySelector('app-pagination-records')).not.toBeNull();
    expect(bar.querySelector('app-pagination-pages')).not.toBeNull();
    expect(bar.querySelector('.select2-container')).toBeNull();
    expect(bar.querySelector('p-paginator')).not.toBeNull();
    bar.querySelector<HTMLElement>('p-select')!.click();
    await settle();
    expect(Array.from(bar.querySelectorAll('[role="option"]'), (option) => option.textContent!.trim()))
      .toEqual(['10', '25', '50', '100']);
    expect(info().textContent).toContain('1 to 10 of 120 entries');
    expect(info().getAttribute('aria-live')).toBe('polite');
  });

  it('navigates with every control and updates page-window accessibility and ranges', async () => {
    expect(button('First').disabled).toBeTrue();
    expect(button('Previous').disabled).toBeTrue();
    button('Last').click();
    await settle();
    expect(host.table.page).toBe(12);
    expect(info().textContent).toContain('111 to 120 of 120 entries');
    expect(button('Last').disabled).toBeTrue();
    expect(button('Next').disabled).toBeTrue();
    expect(bar.querySelector('button[aria-current="page"]')!.getAttribute('aria-current')).toBe('page');
    expect(Array.from(bar.querySelectorAll('.p-paginator-page'), (item) => item.textContent!.trim()))
      .toEqual(['8', '9', '10', '11', '12']);
    bar.querySelector<HTMLButtonElement>('.p-paginator-page')!.click();
    await settle();
    expect(host.table.page).toBe(8);
    button('Previous').click();
    await settle();
    expect(host.table.page).toBe(7);
    button('Next').click();
    await settle();
    expect(host.table.page).toBe(8);
    button('First').click();
    await settle();
    expect(host.table.page).toBe(1);
  });

  it('forwards PrimeNG page-size changes once and resets the page', async () => {
    const changeSize = spyOn(host.table, 'setPageSize').and.callThrough();
    host.table.goToPage(12);
    await selectPageSize(bar, 25, settle);
    expect(changeSize).toHaveBeenCalledOnceWith(25);
    expect(host.table.page).toBe(1);
    expect(info().textContent).toContain('1 to 25 of 120 entries');
    changeSize.calls.reset();
    host.table.goToPage(3);
    await selectPageSize(bar, 50, settle);
    expect(changeSize).toHaveBeenCalledOnceWith(50);
    expect(host.table.page).toBe(1);
    expect(info().textContent).toContain('1 to 50 of 120 entries');
  });

  it('reflects external state updates, empty results and clamped row replacement', async () => {
    host.table.goToPage(12);
    host.table.setRows([{ id: 1, name: 'Only row' }]);
    await settle();
    expect(info().textContent).toContain('1 to 1 of 1 entries');
    host.table.search('missing');
    await settle();
    expect(info().textContent).toContain('0 to 0 of 0 entries');
    for (const label of ['First', 'Previous', 'Next', 'Last']) {
      expect(button(label).disabled).toBeTrue();
      expect(button(label).classList).toContain('p-disabled');
    }
    host.table.search('');
    host.table.setPageSize(25);
    await settle();
    expect(sizeLabel()).toBe('25');
    expect(info().textContent).toContain('1 to 1 of 1 entries');
  });

  it('keeps multiple tables independent and accepts custom sizes and different row types', async () => {
    const otherBar = fixture.nativeElement.querySelectorAll('app-paginationbar')[1] as HTMLElement;
    expect(otherBar.querySelector('.p-select-label')!.textContent!.trim()).toBe('2');
    otherBar.querySelector<HTMLButtonElement>('button[aria-label="Last Page"]')!.click();
    await settle();
    expect(host.other.page).toBe(4);
    expect(host.table.page).toBe(1);
    expect(otherBar.querySelector('.dataTables_info')!.textContent).toContain('7 to 7 of 7 entries');
    await selectPageSize(otherBar, 4, settle);
    expect(host.other.pageSize).toBe(4);
    expect(host.table.pageSize).toBe(10);
  });

  it('exports the children for independent reuse with shared state', async () => {
    host.showParts = true;
    await settle();
    const root: HTMLElement = fixture.nativeElement;
    const pages = root.querySelector<HTMLElement>(':scope > app-pagination-pages')!;
    const records = root.querySelector<HTMLElement>(':scope > app-pagination-records')!;
    pages.querySelector<HTMLButtonElement>('button[aria-label="Next Page"]')!.click();
    await settle();
    expect(host.other.page).toBe(2);
    expect(records.querySelector('.dataTables_info')!.textContent).toContain('3 to 4 of 7 entries');
    records.querySelector<HTMLElement>('p-select')!.click();
    await settle();
    const overlay = records.querySelector('.p-select-overlay');
    expect(overlay).not.toBeNull();
    host.showParts = false;
    await settle();
    expect(root.contains(overlay)).toBeFalse();
  });

  it('supports keyboard page-size selection and closes the overlay after choosing a size', async () => {
    const update = spyOn(host.table, 'setPageSize').and.callThrough();
    host.table.goToPage(3);
    await settle();
    const combo = bar.querySelector<HTMLElement>('[role="combobox"]')!;
    combo.focus();
    combo.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', key: 'ArrowDown', bubbles: true }));
    await settle();
    combo.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', key: 'ArrowDown', bubbles: true }));
    combo.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
    await settle();
    expect(update).toHaveBeenCalledOnceWith(25);
    expect(host.table.page).toBe(1);
    expect(sizeLabel()).toBe('25');
    expect(combo.getAttribute('aria-expanded')).toBe('false');
  });
});
