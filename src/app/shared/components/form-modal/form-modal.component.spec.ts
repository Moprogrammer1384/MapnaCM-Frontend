import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';

@Component({
  template: `
    <ng-template #content let-modal>
      <app-form-modal [title]="title" formId="test_record_form" [description]="description"
        [submitLabel]="submitLabel" [saving]="saving" (dismiss)="modal.dismiss($event)">
        <form id="test_record_form" class="form" aria-labelledby="test_record_form_title"
          #recordForm="ngForm" (ngSubmit)="submit(recordForm)" novalidate>
          <div class="d-flex flex-column mb-8 fv-row">
            <label for="record_name" class="required fs-6 fw-semibold mb-2">Name</label>
            <input id="record_name" class="form-control form-control-solid" name="name" [(ngModel)]="name" required />
          </div>
          <div class="d-flex flex-column mb-15 fv-row">
            <label for="record_parent" class="required fs-6 fw-semibold mb-2">Parent</label>
            <select id="record_parent" class="form-select form-select-solid" name="parent"
              data-control="select2" [(ngModel)]="parentId" required>
              <option [ngValue]="null">Select parent...</option>
              <option [ngValue]="7">Pump</option>
            </select>
          </div>
        </form>
      </app-form-modal>
    </ng-template>
  `,
})
class TestHostComponent {
  @ViewChild('content', { static: true }) content: TemplateRef<unknown>;
  title = 'Add Record';
  description = '';
  submitLabel = 'Submit';
  saving = false;
  name = '';
  parentId: number | null = null;
  submitted: NgForm | null = null;

  submit(form: NgForm): void {
    this.submitted = form;
  }
}

describe('FormModalComponent in NgbModal', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let modals: NgbModal;
  let root: HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const submitButton = () => root.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestHostComponent],
      imports: [SharedModule, FormsModule, NgbModalModule],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    modals = TestBed.inject(NgbModal);
    await settle();
    modals.open(host.content, {
      animation: false,
      modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
      ariaLabelledBy: 'test_record_form_title',
    });
    await settle();
    root = document.querySelector<HTMLElement>('ngb-modal-window')!;
  });

  afterEach(() => {
    modals.dismissAll();
    fixture.destroy();
  });

  it('submits the projected Angular form exactly once with its registered numeric parent value', async () => {
    host.name = 'Bearing';
    host.parentId = 7;
    await settle();
    const submit = spyOn(host, 'submit').and.callThrough();
    expect(submitButton().form).toBe(root.querySelector('form'));
    submitButton().click();
    await settle();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(host.submitted!.valid).toBeTrue();
    expect(host.submitted!.value).toEqual({ name: 'Bearing', parent: 7 });
  });

  it('preserves NgForm validation and touched controls on an invalid submission', async () => {
    submitButton().click();
    await settle();
    expect(host.submitted!.invalid).toBeTrue();
    host.submitted!.control.markAllAsTouched();
    expect(host.submitted!.controls['name'].touched).toBeTrue();
    expect(host.submitted!.controls['parent'].touched).toBeTrue();
    expect(modals.hasOpenModals()).toBeTrue();
  });

  it('disables native submission while saving and restores the action after a failure', async () => {
    const submit = spyOn(host, 'submit');
    host.saving = true;
    await settle();
    expect(submitButton().disabled).toBeTrue();
    expect(submitButton().getAttribute('data-kt-indicator')).toBe('on');
    expect(root.querySelector('.modal-body')!.getAttribute('aria-busy')).toBe('true');
    submitButton().click();
    expect(submit).not.toHaveBeenCalled();
    host.saving = false;
    await settle();
    expect(submitButton().disabled).toBeFalse();
    expect(submitButton().getAttribute('data-kt-indicator')).toBe('off');
    submitButton().click();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('supports edit presentation and dismisses through a keyboard-accessible close button', async () => {
    host.title = 'Edit Record';
    host.description = 'Record details';
    host.submitLabel = 'Save';
    await settle();
    expect(root.querySelector('h1')!.textContent).toBe('Edit Record');
    expect(root.querySelector('.text-muted')!.textContent).toBe('Record details');
    expect(submitButton().textContent).toContain('Save');
    const dismiss = spyOn(modals, 'dismissAll').and.callThrough();
    const close = root.querySelector<HTMLButtonElement>('button[aria-label="Close modal"]')!;
    expect(close.type).toBe('button');
    close.click();
    await settle();
    expect(modals.hasOpenModals()).toBeFalse();
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('cancels without submitting or resetting page-owned data and cleans up Select2', async () => {
    host.name = 'Unsaved record';
    await settle();
    const select = root.querySelector<HTMLSelectElement>('select')!;
    expect(root.querySelectorAll('.select2-container').length).toBe(1);
    root.querySelector<HTMLButtonElement>('.btn-light')!.click();
    await settle();
    expect(modals.hasOpenModals()).toBeFalse();
    expect(host.name).toBe('Unsaved record');
    expect(host.submitted).toBeNull();
    expect((window as any).jQuery(select).data('select2')).toBeUndefined();
  });

  it('uses the loaded Metronic theme in light and dark modes and fits the current viewport', () => {
    const previousTheme = document.documentElement.getAttribute('data-bs-theme');
    const colors: string[] = [];
    try {
      for (const theme of ['light', 'dark']) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        const body = root.querySelector<HTMLElement>('.modal-body')!;
        const content = root.querySelector<HTMLElement>('.modal-content')!;
        const control = root.querySelector<HTMLInputElement>('input')!;
        const bounds = content.getBoundingClientRect();
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(window.innerWidth);
        expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
        expect(getComputedStyle(submitButton()).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        expect(getComputedStyle(control).borderRadius).toBe(getComputedStyle(submitButton()).borderRadius);
        colors.push(getComputedStyle(content).backgroundColor);
      }
      expect(colors[0]).not.toBe(colors[1]);
    } finally {
      if (previousTheme === null) {
        document.documentElement.removeAttribute('data-bs-theme');
      } else {
        document.documentElement.setAttribute('data-bs-theme', previousTheme);
      }
    }
  });
});
