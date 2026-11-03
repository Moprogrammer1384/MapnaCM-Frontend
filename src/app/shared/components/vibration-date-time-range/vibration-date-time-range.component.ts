import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { EMPTY, expand, Subscription, takeLast, tap } from 'rxjs';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import { AnalysisEventTime } from 'src/app/core/models/analysis-event-time.model';
import { CalendarDateRange, TimeAvailability } from 'src/app/core/models/time-availability.model';
import { TIME_AVAILABILITY_SOURCE } from 'src/app/core/services/time-availability.service';
import { vibrationError } from 'src/app/core/services/vibration/api/vibration-time-domain-api.service';
import { DateTimeRangeComponent } from '../date-time-range/date-time-range.component';
import { VibrationEventPickerComponent } from '../vibration-event-picker/vibration-event-picker.component';

function previousDay(day: string): string {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addCalendarDays(day: string, count: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

/** Loads availability metadata only. Chart reads start with Apply or a discrete event selection. */
@Component({
  selector: 'app-vibration-date-time-range', standalone: true,
  imports: [CommonModule, DateTimeRangeComponent, VibrationEventPickerComponent],
  templateUrl: './vibration-date-time-range.component.html',
  host: { class: 'd-block', '[attr.aria-busy]': 'loading' },
})
export class VibrationDateTimeRangeComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) inputId: string;
  @Input({ required: true }) measurementIds: readonly number[] = [];
  @Input({ required: true }) value: DateTimeRange;
  @Input() eventSelection = false;
  @Output() readonly applied = new EventEmitter<DateTimeRange>();
  loading = true;
  error = '';
  ready = false;
  enabledDates: readonly CalendarDateRange[] = [];
  minDate?: string;
  maxDate?: string;
  calendarDate?: string;
  availableTimes?: readonly AnalysisEventTime[];
  private readonly timeRanges = new Map<string, AnalysisEventTime>();
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
    this.timeRanges.clear();
    this.availableTimes = undefined;
    this.minDate = this.maxDate = this.calendarDate = undefined;
    this.load();
  }

  showWindow(window: CalendarDateRange): void {
    if (!this.ready || !this.minDate || !this.maxDate) { return; }
    // Bode's optional Date filters already-loaded event history locally.
    if (this.eventSelection && !this.nextEventWindow()) { return; }
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
    let metadata = this.source.getAvailability(this.measurementIds, window);
    if (this.eventSelection) {
      metadata = metadata.pipe(expand(data => {
        this.accept(data);
        const next = this.nextEventWindow();
        if (!next) { return EMPTY; }
        this.pendingWindow = next;
        return this.source.getAvailability(this.measurementIds, next).pipe(tap(result => {
          if (!result.window || result.window.from > next.from || result.window.to < next.to) {
            throw new Error('The availability API did not cover the requested event dates.');
          }
        }));
      }, 1), takeLast(1));
    }
    this.request = metadata.subscribe({
      next: data => {
        if (!this.eventSelection) { this.accept(data); }
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

  private nextEventWindow(): CalendarDateRange | undefined {
    if (!this.minDate || !this.maxDate) { return undefined; }
    const until = addCalendarDays(this.maxDate, 1);
    let from = this.minDate;
    const gap = (to: string) => ({ from, to: [to, until, addCalendarDays(from, 366)].sort()[0] });
    for (const known of [...this.windows].sort((a, b) => a.from.localeCompare(b.from))) {
      if (known.to <= from) { continue; }
      if (known.from > from) { return gap(known.from); }
      from = known.to;
      if (from >= until) { return undefined; }
    }
    return from < until ? gap(until) : undefined;
  }

  private accept(data: TimeAvailability): void {
    if (data.window) { this.windows.push(data.window); }
    this.ranges.push(...data.commonRanges);
    this.enabledDates = [...this.ranges];
    if (data.availableTimes) {
      data.availableTimes.forEach(event => this.timeRanges.set(event.id, event));
      this.availableTimes = [...this.timeRanges.values()].sort((a, b) => a.from.localeCompare(b.from));
    }
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
