import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RequestState } from './request-state';

@Component({
  selector: 'app-request-feedback',
  templateUrl: './request-feedback.component.html',
})
export class RequestFeedbackComponent {
  @Input({ required: true }) state: RequestState;
  @Input() loadingMessage = 'Loading options...';
  @Input() retryDisabled = false;
  @Output() readonly retry = new EventEmitter<void>();
}
