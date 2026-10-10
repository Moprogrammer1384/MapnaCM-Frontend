import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

/** Metronic presentation for page-owned forms opened through NgbModal. */
@Component({
  selector: 'app-form-modal',
  templateUrl: './form-modal.component.html',
  styleUrls: ['./form-modal.component.scss'],
})
export class FormModalComponent {
  @Input({ required: true }) title: string;
  @Input({ required: true }) formId: string;
  @Input() description = '';
  @Input() submitLabel = 'Submit';
  @Input() saving = false;
  @Input() cancelId: string | null = null;
  @Input() submitId: string | null = null;

  @Output() readonly dismiss = new EventEmitter<'Cross click' | 'cancel'>();

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:keydown', ['$event'])
  preventEscapeWhileSaving(event: KeyboardEvent): void {
    const window = this.elementRef.nativeElement.closest('ngb-modal-window');
    if (this.saving && event.key === 'Escape' && event.target instanceof Node && window?.contains(event.target)) {
      // NgbModal defers Escape to the next frame. Preserve the state at keypress
      // so a failed save cannot turn an already-blocked Escape into a dismissal.
      event.preventDefault();
    }
  }
}
