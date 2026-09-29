import {
  AfterViewChecked,
  AfterViewInit,
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
} from '@angular/core';
import type { Options } from 'select2';

declare global {
  interface Window {
    jQuery: JQueryStatic;
  }
}

/** Enhance template selects while retaining Angular's native select value accessor. */
@Directive({
  // Support both attributes used by the HTML template, plus an Angular alias.
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'select[appSelect2], select[data-control="select2"], select[data-kt-select2="true"]',
})
export class Select2Directive implements AfterViewInit, AfterViewChecked, OnDestroy {
  private select?: JQuery<HTMLSelectElement>;
  private observer?: MutationObserver;
  private selection = '';
  private forwardingChange = false;

  constructor(
    private elementRef: ElementRef<HTMLSelectElement>,
    private zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    // Use the same jQuery instance as the global Select2/DataTables scripts.
    const jquery = window.jQuery;
    this.zone.runOutsideAngular(() => {
      this.select = jquery(this.elementRef.nativeElement);
      this.initialize();
      this.select.on('change.appSelect2', (event) => {
        // jQuery's synthetic change does not reach Angular's native listeners.
        // Dispatch once so ngModel, reactive forms, [ngValue] and (change) work.
        if (event.originalEvent || this.forwardingChange) {
          return;
        }
        this.forwardingChange = true;
        try {
          this.zone.run(() => this.elementRef.nativeElement.dispatchEvent(
            new Event('change', { bubbles: true })
          ));
        } finally {
          this.forwardingChange = false;
        }
      });
      this.select.on('select2:close.appSelect2', () => {
        this.zone.run(() => this.elementRef.nativeElement.dispatchEvent(new Event('blur')));
      });

      // API responses and *ngFor can add, remove, rename or disable options.
      // Recreate the adapter to discard Select2's cached option labels/values.
      this.observer = new MutationObserver((records) => {
        if (records.some((record) => record.type !== 'attributes' ||
          record.target !== this.elementRef.nativeElement)) {
          this.select!.select2('destroy');
          this.initialize();
        }
      });
      this.observer.observe(this.elementRef.nativeElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['value', 'label', 'disabled', 'selected'],
      });
    });
  }

  ngAfterViewChecked(): void {
    // Angular writes selected properties, which MutationObserver cannot see.
    const selection = this.getSelection();
    if (this.select && selection !== this.selection) {
      this.selection = selection;
      this.zone.runOutsideAngular(() => this.select!.trigger('change.select2'));
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.zone.runOutsideAngular(() => {
      this.select?.off('.appSelect2');
      this.select?.select2('destroy');
      this.select = undefined;
    });
  }

  private initialize(): void {
    const element = this.elementRef.nativeElement;
    const jquery = window.jQuery;
    const parentSelector = element.getAttribute('data-dropdown-parent');
    const parent = (parentSelector ? element.ownerDocument.querySelector<HTMLElement>(parentSelector) : null)
      ?? element.closest<HTMLElement>('.modal, [data-kt-menu="true"]')
      ?? element.ownerDocument.body;
    const placeholder = element.getAttribute('data-placeholder');
    const firstOption = element.options[0];
    // @types/select2 still targets 4.0; selectionCssClass is part of 4.1.
    const options: Options & { selectionCssClass: string } = {
      theme: 'bootstrap5',
      width: element.getAttribute('data-width') || '100%',
      selectionCssClass: ':all:',
      dropdownParent: jquery(parent),
      minimumResultsForSearch: element.getAttribute('data-hide-search') === 'true' ? Infinity : 0,
    };
    // Angular encodes [ngValue]="null" as e.g. "0: null", not an empty string.
    if (placeholder && !element.multiple) {
      options.placeholder = {
        id: firstOption && (firstOption.disabled || firstOption.value === '' || !firstOption.text.trim())
          ? firstOption.value : '',
        text: placeholder,
      };
      // Select2 gives data attributes priority over constructor options.
      this.select!.data('placeholder', options.placeholder);
    }
    this.select!.data('dropdownParent', jquery(parent));
    this.select!.select2(options);
    const label = element.getAttribute('aria-label');
    if (label) {
      this.select!.next('.select2').find('.select2-selection').attr('aria-label', label);
    }
    this.select!.removeData('placeholder').removeData('dropdownParent');
    this.selection = this.getSelection();
  }

  private getSelection(): string {
    return JSON.stringify(Array.from(this.elementRef.nativeElement.selectedOptions, (option) => option.value));
  }
}
