import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import { RotorPositionEvent, RotorPositionPair } from 'src/app/core/models/rotor-position.model';
import { ROTOR_POSITION_DATA_SOURCE } from 'src/app/core/services/vibration/rotor-position/rotor-position-data-source.service';
import { apiErrorMessage } from 'src/app/core/utils/api-error';
import { VibrationEventPickerComponent } from '../vibration-event-picker/vibration-event-picker.component';

@Component({ selector: 'app-rotor-position-event-picker', standalone: true,
  imports: [CommonModule, VibrationEventPickerComponent], templateUrl: './rotor-position-event-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'd-block', '[attr.aria-busy]': 'loading' } })
export class RotorPositionEventPickerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) inputId: string;
  @Input({ required: true }) pairs: readonly RotorPositionPair[];
  @Input() value?: RotorPositionEvent;
  @Output() readonly selected = new EventEmitter<RotorPositionEvent | undefined>(true);
  events: readonly RotorPositionEvent[] = [];
  loading = false;
  error = '';
  readonly emptyValue: DateTimeRange = { from: '', to: '' };
  private readonly source = inject(ROTOR_POSITION_DATA_SOURCE);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscription?: Subscription;

  ngOnChanges(changes: SimpleChanges): void { if (changes['pairs']) { this.reload(); } }
  reload(): void {
    this.subscription?.unsubscribe();
    this.loading = true; this.error = ''; this.events = [];
    this.subscription = this.source.listEvents(this.pairs).subscribe({
      next: events => {
        this.loading = false;
        const unique = new Set<string>();
        const valid = events.every(event => {
          if (unique.has(event.id)) { return false; }
          unique.add(event.id);
          return ['Startup', 'CoastDown', 'Trip'].includes(event.eventType) && event.from < event.to &&
            Number.isFinite(Date.parse(event.from)) && Number.isFinite(Date.parse(event.to));
        });
        if (!valid) { this.error = 'The event catalogue contains invalid or duplicate acquisitions.'; }
        else { this.events = [...events].sort((a, b) => a.from.localeCompare(b.from)); }
        if (this.value && !this.events.some(event => event.id === this.value?.id && event.from === this.value.from && event.to === this.value.to)) {
          this.selected.emit(undefined);
        }
        this.cdr.markForCheck();
      },
      error: error => { this.loading = false; this.error = apiErrorMessage(error, 'Rotor position events'); this.cdr.markForCheck(); },
    });
  }
  choose(range: DateTimeRange): void {
    if (this.loading || this.error) { return; }
    const event = this.events.find(item => item.from === range.from && item.to === range.to);
    if (event) { this.selected.emit(event); }
  }
  ngOnDestroy(): void { this.subscription?.unsubscribe(); }
}
