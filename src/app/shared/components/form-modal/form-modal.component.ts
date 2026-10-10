import { Component, EventEmitter, Input, Output } from '@angular/core';

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
}
