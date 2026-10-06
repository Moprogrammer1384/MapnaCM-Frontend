import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../_metronic/shared/shared.module';
import { TablePagination } from '../table-pagination';

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
  const button = (label: string) => bar.querySelector<HTMLButtonElement>(`button[aria-label="${label} page"]`)!;
  const sizeSelect = () => bar.querySelector<HTMLSelectElement>('select[aria-label="Page size"]')!;
  const info = () => bar.querySelector('.dataTables_info')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent],
      imports: [SharedModule],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    await settle();
    bar = fixture.nativeElement.querySelector('app-paginationbar');
  });

  afterEach(() => fixture.destroy());

  it('composes both children and enhances the page-size select once', () => {
    expect(bar.querySelector('app-pagination-records')).not.toBeNull();
    expect(bar.querySelector('app-pagination-pages')).not.toBeNull();
    expect(bar.querySelectorAll('.select2-container').length).toBe(1);
    expect(Array.from(sizeSelect().options, (option) => option.value)).toEqual(['10', '25', '50', '100']);
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
    expect(bar.querySelector('.active button')!.getAttribute('aria-current')).toBe('page');
    expect(Array.from(bar.querySelectorAll('button:not([aria-label])'), (item) => item.textContent!.trim()))
      .toEqual(['8', '9', '10', '11', '12']);
    bar.querySelector<HTMLButtonElement>('button:not([aria-label])')!.click();
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

  it('forwards native and Select2 page-size changes once and resets the page', async () => {
    const changeSize = spyOn(host.table, 'setPageSize').and.callThrough();
    host.table.goToPage(12);
    const select = sizeSelect();
    select.value = '25';
    select.dispatchEvent(new Event('change'));
    await settle();
    expect(changeSize).toHaveBeenCalledOnceWith('25');
    expect(host.table.page).toBe(1);
    expect(info().textContent).toContain('1 to 25 of 120 entries');
    changeSize.calls.reset();
    host.table.goToPage(3);
    window.jQuery(select).val('50').trigger('change');
    await settle();
    expect(changeSize).toHaveBeenCalledOnceWith('50');
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
      expect(button(label).parentElement!.classList).toContain('disabled');
    }
    host.table.search('');
    host.table.setPageSize(25);
    await settle();
    expect(sizeSelect().value).toBe('25');
    expect(sizeSelect().nextElementSibling!.textContent).toContain('25');
    expect(info().textContent).toContain('1 to 1 of 1 entries');
  });

  it('keeps multiple tables independent and accepts custom sizes and different row types', async () => {
    const otherBar = fixture.nativeElement.querySelectorAll('app-paginationbar')[1] as HTMLElement;
    const otherSize = otherBar.querySelector<HTMLSelectElement>('select')!;
    expect(Array.from(otherSize.options, (option) => option.value)).toEqual(['2', '4']);
    otherBar.querySelector<HTMLButtonElement>('button[aria-label="Last page"]')!.click();
    await settle();
    expect(host.other.page).toBe(4);
    expect(host.table.page).toBe(1);
    expect(otherBar.querySelector('.dataTables_info')!.textContent).toContain('7 to 7 of 7 entries');
    window.jQuery(otherSize).val('4').trigger('change');
    await settle();
    expect(host.other.pageSize).toBe(4);
    expect(host.table.pageSize).toBe(10);
  });

  it('exports the children for independent reuse with shared state', async () => {
    host.showParts = true;
    await settle();
    const root: HTMLElement = fixture.nativeElement;
    const pages = root.querySelector<HTMLElement>(':scope > app-pagination-pages')!;
    const records = root.querySelector<HTMLElement>(':scope > app-pagination-records')!;
    pages.querySelector<HTMLButtonElement>('button[aria-label="Next page"]')!.click();
    await settle();
    expect(host.other.page).toBe(2);
    expect(records.querySelector('.dataTables_info')!.textContent).toContain('3 to 4 of 7 entries');
    const select = records.querySelector<HTMLSelectElement>('select')!;
    host.showParts = false;
    await settle();
    expect(window.jQuery(select).data('select2')).toBeUndefined();
  });
});
