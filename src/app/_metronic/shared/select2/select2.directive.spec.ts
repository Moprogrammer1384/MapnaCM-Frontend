import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { SharedModule } from '../shared.module';

@Component({
  template: `
    <div class="modal" style="display: block" dir="rtl">
      <select *ngIf="visible" data-control="select2" data-placeholder="Select a Site"
        class="form-select form-select-solid" [(ngModel)]="value" required
        [disabled]="disabled" (change)="changes = changes + 1">
        <option [ngValue]="null" disabled>Select site...</option>
        <option *ngFor="let item of items" [ngValue]="item.id">{{ item.name }}</option>
      </select>
      <select data-kt-select2="true" data-hide-search="true" class="form-select form-select-sm">
        <option value="1">Type One</option><option value="2">Type Two</option>
      </select>
      <select appSelect2 multiple [formControl]="multiple" class="form-select">
        <option [ngValue]="1">One</option><option [ngValue]="2">Two</option>
      </select>
      <select appSelect2 [formControl]="single" data-placeholder="Choose" data-allow-clear="true">
        <option [ngValue]="null"></option>
        <option [ngValue]="1">One</option><option [ngValue]="2">Two</option>
      </select>
    </div>
  `,
})
class TestHostComponent {
  visible = true;
  disabled = false;
  value: number | null = null;
  changes = 0;
  items = [{ id: 11, name: 'Tehran' }, { id: 22, name: 'Shiraz' }];
  multiple = new FormControl<number[]>([1], { nonNullable: true });
  single = new FormControl<number | null>(null, Validators.required);
}

describe('Select2Directive with the real plugin', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let select: HTMLSelectElement;
  const jquery = () => window.jQuery;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };
  const selection = () => select.nextElementSibling as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent],
      imports: [SharedModule, FormsModule, ReactiveFormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    await settle();
    select = fixture.nativeElement.querySelector('select');
  });

  afterEach(() => fixture.destroy());

  it('uses the Metronic theme, solid style and Angular null placeholder', () => {
    expect(selection().classList).toContain('select2-container--bootstrap5');
    expect(selection().querySelector('.select2-selection')!.classList).toContain('form-select-solid');
    expect(selection().querySelector('.select2-selection__placeholder')!.textContent).toBe('Select a Site');
    expect(selection().getAttribute('dir')).toBe('rtl');
  });

  it('keeps the searchable dropdown inside the modal and filters its results', async () => {
    jquery()(select).select2('open');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const modal = fixture.nativeElement.querySelector('.modal') as HTMLElement;
    const search = modal.querySelector<HTMLInputElement>('.select2-dropdown .select2-search__field')!;
    expect(search).not.toBeNull();
    expect(document.activeElement).toBe(search);
    jquery()(search).val('Shir').trigger('input');
    expect(modal.querySelector('.select2-results__options')!.textContent).toContain('Shiraz');
    expect(modal.querySelector('.select2-results__options')!.textContent).not.toContain('Tehran');
    jquery()(search).val('missing-site').trigger('input');
    expect(modal.querySelector('.select2-results__message')!.textContent).toContain('No results found');
  });

  it('sends a selection to ngModel as a number and emits native change only once', async () => {
    jquery()(select).select2('open');
    const result = Array.from(fixture.nativeElement.querySelectorAll('.select2-results__option'))
      .find((item: unknown) => (item as HTMLElement).textContent === 'Shiraz') as HTMLElement;
    jquery()(result).trigger('mouseup');
    await settle();
    expect(host.value).toBe(22);
    expect(host.changes).toBe(1);
    const control = fixture.debugElement.query(By.directive(NgModel)).injector.get(NgModel);
    expect(control.valid).toBeTrue();
    expect(control.touched).toBeTrue();
  });

  it('reflects programmatic edits and resets without emitting user changes', async () => {
    host.value = 22;
    await settle();
    expect(selection().textContent).toContain('Shiraz');
    host.value = null;
    await settle();
    expect(selection().textContent).toContain('Select a Site');
    expect(host.changes).toBe(0);
  });

  it('refreshes asynchronous options and changed labels', async () => {
    host.items = [];
    host.value = 33;
    await settle();
    host.items = [{ id: 33, name: 'Tabriz' }];
    await settle();
    expect(selection().textContent).toContain('Tabriz');
    host.items[0].name = 'Tabriz (updated)';
    await settle();
    expect(selection().textContent).toContain('Tabriz (updated)');
  });

  it('honors disabled state changes', async () => {
    host.disabled = true;
    await settle();
    expect(selection().classList).toContain('select2-container--disabled');
    jquery()(select).select2('open');
    expect(selection().classList).not.toContain('select2-container--open');
    host.disabled = false;
    await settle();
    expect(selection().classList).not.toContain('select2-container--disabled');
  });

  it('supports the legacy marker and hides search when requested', () => {
    const type = fixture.nativeElement.querySelector('[data-kt-select2]');
    jquery()(type).select2('open');
    expect(fixture.nativeElement.querySelector('.select2-search--hide')).not.toBeNull();
    expect(type.nextElementSibling.querySelector('.form-select-sm')).not.toBeNull();
  });

  it('supports reactive multiple values without changing numeric types', async () => {
    const multiple = fixture.nativeElement.querySelector('select[multiple]') as HTMLSelectElement;
    jquery()(multiple).val(Array.from(multiple.options, (option) => option.value)).trigger('change');
    await settle();
    expect(host.multiple.value).toEqual([1, 2]);
    host.multiple.setValue([2]);
    await settle();
    expect(multiple.nextElementSibling!.textContent).toContain('Two');
    expect(multiple.nextElementSibling!.textContent).not.toContain('One');
  });

  it('supports clearing and resetting a required reactive select', async () => {
    const single = fixture.nativeElement.querySelector('select[data-allow-clear]') as HTMLSelectElement;
    host.single.setValue(2);
    await settle();
    expect(single.nextElementSibling!.textContent).toContain('Two');
    jquery()(single.nextElementSibling!.querySelector('.select2-selection__clear')!).trigger('mousedown');
    await settle();
    expect(host.single.value).toBeNull();
    expect(host.single.invalid).toBeTrue();
    host.single.setValue(1);
    await settle();
    host.single.reset();
    await settle();
    expect(single.nextElementSibling!.textContent).toContain('Choose');
  });

  it('cleans up an open dropdown and can recreate a destroyed view', async () => {
    jquery()(select).select2('open');
    host.visible = false;
    await settle();
    expect(jquery()(select).data('select2')).toBeUndefined();
    expect(fixture.nativeElement.querySelector('.select2-dropdown')).toBeNull();
    host.visible = true;
    await settle();
    const recreated = fixture.nativeElement.querySelector('select');
    expect(recreated.nextElementSibling.classList).toContain('select2-container');
    expect(fixture.nativeElement.querySelectorAll('.select2-container').length).toBe(4);
  });
});
