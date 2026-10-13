import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import type { Instance } from 'flatpickr/dist/types/instance';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';

@Component({
  selector: 'app-date-time-range',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './date-time-range.component.html',
  host: { class: 'd-block' },
})
export class DateTimeRangeComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) inputId = 'date-time';
  @Input({ required: true }) value: DateTimeRange = { from: '', to: '' };
  @Input() disabled = false;
  @Output() readonly valueChange = new EventEmitter<DateTimeRange>();
  @ViewChild('rangeInput', { static: true }) private rangeInput: ElementRef<HTMLInputElement>;
  @ViewChild('footer', { static: true }) private footer: ElementRef<HTMLElement>;

  readonly endpoints = ['from', 'to'] as const;
  draftDates: string[] = [];
  times: Record<keyof DateTimeRange, { hour: number | null; minute: number | null }> = {
    from: { hour: 0, minute: 0 }, to: { hour: 23, minute: 59 },
  };
  isOpen = false;
  error = '';
  private picker?: Instance;
  private destroyed = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.picker = flatpickr(this.rangeInput.nativeElement, {
        mode: 'range', dateFormat: 'Y-m-d', ariaDateFormat: 'F j, Y',
        disableMobile: true, allowInput: false, monthSelectorType: 'static',
        closeOnSelect: false, clickOpens: false,
        onReady: (_dates, _value, instance) => {
          const calendar = instance.calendarContainer;
          calendar.classList.add('darp-date-time-calendar');
          calendar.id = `${this.inputId}_calendar`;
          calendar.setAttribute('role', 'dialog');
          calendar.setAttribute('aria-label', 'Date and time range');
          calendar.appendChild(this.footer.nativeElement);
          this.rangeInput.nativeElement.setAttribute('aria-controls', calendar.id);
        },
        onOpen: () => this.zone.run(() => { this.isOpen = true; }),
        onClose: () => this.zone.run(() => {
          this.isOpen = false;
          if (!this.destroyed) { this.syncPicker(); }
        }),
        onValueUpdate: () => this.renderValue(),
        onChange: (dates, _value, instance) => this.zone.run(() => {
          this.draftDates = dates.map(date => instance.formatDate(date, 'Y-m-d'));
          this.error = '';
          this.renderValue();
        }),
      });
      this.syncPicker();
    });
  }

  ngOnChanges(): void {
    if (this.disabled) { this.picker?.close(); }
    this.syncPicker();
  }

  open(): void {
    if (this.disabled || this.destroyed || this.isOpen) { return; }
    this.syncPicker();
    this.picker?.open();
  }

  apply(): void {
    if (this.disabled || this.destroyed) { return; }
    if (this.draftDates.length !== 2) {
      this.error = 'Select both the start and end dates.';
      return;
    }
    if (this.endpoints.some(endpoint => !this.validTime(endpoint))) {
      this.error = 'Enter hours from 00 to 23 and minutes from 00 to 59.';
      return;
    }
    const next: DateTimeRange = {
      from: this.dateTime('from', this.draftDates[0]),
      to: this.dateTime('to', this.draftDates[1]),
    };
    if (next.from > next.to) {
      this.error = 'End date and time must be on or after the start.';
      return;
    }
    const changed = next.from !== this.value.from || next.to !== this.value.to;
    this.value = next;
    this.close();
    if (changed) { this.valueChange.emit({ ...next }); }
  }

  close(): void {
    this.picker?.close();
    this.rangeInput.nativeElement.focus();
  }

  onFooterKeydown(event: KeyboardEvent): void {
    // Keep Flatpickr's calendar arrow-key handler away from the numeric inputs.
    event.stopPropagation();
    if (event.key === 'Escape') { this.close(); event.preventDefault(); }
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      this.apply(); event.preventDefault();
    }
  }

  private validTime(endpoint: keyof DateTimeRange): boolean {
    const { hour, minute } = this.times[endpoint];
    return hour !== null && minute !== null && Number.isInteger(hour) && Number.isInteger(minute)
      && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  }

  private dateTime(endpoint: keyof DateTimeRange, date: string): string {
    const { hour, minute } = this.times[endpoint];
    return `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private syncPicker(): void {
    const dates: string[] = [];
    this.endpoints.forEach((endpoint, index) => {
      const text = this.value[endpoint];
      // Round-trip parsing excludes malformed external dates and times.
      const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)
        ? flatpickr.parseDate(text, 'Y-m-d\\TH:i') : undefined;
      if (date && flatpickr.formatDate(date, 'Y-m-d\\TH:i') === text) {
        dates.push(text.slice(0, 10));
        this.times[endpoint] = { hour: date.getHours(), minute: date.getMinutes() };
      } else {
        this.times[endpoint] = { hour: index === 0 ? 0 : 23, minute: index === 0 ? 0 : 59 };
      }
    });
    this.draftDates = dates.length === 2 && this.value.from <= this.value.to ? dates : [];
    this.error = '';
    this.picker?.setDate(this.draftDates, false, 'Y-m-d');
    if (this.rangeInput) { this.renderValue(); }
  }

  private renderValue(): void {
    this.rangeInput.nativeElement.value = this.value.from && this.value.to
      ? `${this.value.from.replace('T', ' ')} to ${this.value.to.replace('T', ' ')}` : '';
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    // Angular owns the footer view; Flatpickr owns only its surrounding calendar.
    this.footer.nativeElement.remove();
    this.picker?.destroy();
  }
}
