import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import { CalendarDateRange, TimeAvailability } from 'src/app/core/models/time-availability.model';
import { TIME_AVAILABILITY_SOURCE } from 'src/app/core/services/time-availability.service';
import { vibrationError } from 'src/app/core/services/vibration/vibration-api.service';
import { DateTimeRangeComponent } from '../date-time-range/date-time-range.component';

function previousDay(day: string): string {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Loads calendar metadata only. Waveform requests still start with the user's Apply. */
@Component({
  selector: 'app-vibration-date-time-range', standalone: true,
  imports: [CommonModule, DateTimeRangeComponent],
  templateUrl: './vibration-date-time-range.component.html',
  host: { class: 'd-block', '[attr.aria-busy]': 'loading' },
})
export class VibrationDateTimeRangeComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) inputId: string;
  @Input({ required: true }) measurementIds: readonly number[] = [];
  @Input({ required: true }) value: DateTimeRange;
  @Output() readonly applied = new EventEmitter<DateTimeRange>();
  loading = true;
  error = '';
  ready = false;
  enabledDates: readonly CalendarDateRange[] = [];
  minDate?: string;
  maxDate?: string;
  calendarDate?: string;
  private readonly source = inject(TIME_AVAILABILITY_SOURCE);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private request?: Subscription;
  private key = '';
  private pendingWindow?: CalendarDateRange;
  private readonly windows: CalendarDateRange[] = [];
  private readonly ranges: CalendarDateRange[] = [];

  ngOnChanges(): void {
    const key = [...this.measurementIds].sort((a, b) => a - b).join(',');
    if (this.key === key) { return; }
    this.key = key;
    this.request?.unsubscribe();
    this.ready = false;
    this.windows.length = this.ranges.length = 0;
    this.enabledDates = [];
    this.minDate = this.maxDate = this.calendarDate = undefined;
    this.load();
  }

  showWindow(window: CalendarDateRange): void {
    if (!this.ready || !this.minDate || !this.maxDate) { return; }
    const toBound = new Date(`${this.maxDate}T12:00:00`);
    toBound.setDate(toBound.getDate() + 1);
    const last = `${toBound.getFullYear()}-${String(toBound.getMonth() + 1).padStart(2, '0')}-${String(toBound.getDate()).padStart(2, '0')}`;
    const clipped = { from: window.from < this.minDate ? this.minDate : window.from, to: window.to > last ? last : window.to };
    if (clipped.from >= clipped.to) { return; }
    if (this.windows.some(known => known.from <= clipped.from && known.to >= clipped.to)) {
      this.request?.unsubscribe();
      this.loading = false;
      this.error = '';
      return;
    }
    if (this.loading && this.pendingWindow?.from === clipped.from && this.pendingWindow.to === clipped.to) { return; }
    this.load(clipped);
  }

  retry(): void { this.load(this.pendingWindow); }

  private load(window?: CalendarDateRange): void {
    this.request?.unsubscribe();
    this.pendingWindow = window;
    this.loading = true;
    this.error = '';
    this.request = this.source.getAvailability(this.measurementIds, window).subscribe({
      next: data => {
        this.accept(data);
        this.loading = false;
        this.ready = true;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.loading = false;
        this.error = vibrationError(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  private accept(data: TimeAvailability): void {
    if (data.window) { this.windows.push(data.window); }
    this.ranges.push(...data.commonRanges);
    this.enabledDates = [...this.ranges];
    const bounds = data.measurements.map(item => item.dataBounds);
    if (bounds.length && bounds.every((item): item is CalendarDateRange => !!item)) {
      // Bounds guide navigation only. Only commonRanges enables actual days and preserves holes.
      this.minDate = bounds.reduce((latest, item) => item.from > latest ? item.from : latest, bounds[0].from);
      const until = bounds.reduce((earliest, item) => item.to < earliest ? item.to : earliest, bounds[0].to);
      this.maxDate = previousDay(until);
      if (this.minDate > this.maxDate) { this.minDate = this.maxDate = undefined; }
    }
    if (!this.calendarDate) {
      const latest = this.enabledDates[this.enabledDates.length - 1];
      this.calendarDate = latest ? previousDay(latest.to) : this.maxDate;
    }
  }

  ngOnDestroy(): void { this.request?.unsubscribe(); }
}
