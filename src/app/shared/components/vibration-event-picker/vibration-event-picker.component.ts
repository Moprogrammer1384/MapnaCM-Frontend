import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import type { Instance } from 'flatpickr/dist/types/instance';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AnalysisEventTime } from 'src/app/core/models/analysis-event-time.model';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import { CalendarDateRange } from 'src/app/core/models/time-availability.model';
import { VIBRATION_EVENT_LABELS } from '../vibration-chart-presentation/vibration-event-presentation';

/** Select one existing transient. Its exact acquisition bounds are never edited by the user. */
@Component({
  selector: 'app-vibration-event-picker', standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './vibration-event-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block' },
})
export class VibrationEventPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) inputId: string;
  @Input({ required: true }) value: DateTimeRange;
  @Input() eventId?: string;
  @Input() events: readonly AnalysisEventTime[] = [];
  @Input() disabled = false;
  @Input() showEventTypeFilter = false;
  @Input() minDate?: string;
  @Input() maxDate?: string;
  @Input() calendarDate?: string;
  @Input() dateAdjacentContent?: TemplateRef<unknown>;
  @Input() resetDateKey?: string;
  @Output() readonly selected = new EventEmitter<DateTimeRange>();
  @Output() readonly eventSelected = new EventEmitter<AnalysisEventTime>();
  @Output() readonly calendarWindowChange = new EventEmitter<CalendarDateRange>();
  @ViewChild('dateInput', { static: true }) private dateInput: ElementRef<HTMLInputElement>;
  day = '';
  selectedEventType: string | null = null;
  eventTypeOptions: readonly { value: string; label: string }[] = [];
  selectedEventId: string | null = null;
  visibleEvents: readonly AnalysisEventTime[] = [];
  private picker?: Instance;

  constructor(private readonly zone: NgZone, private readonly cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.picker = flatpickr(this.dateInput.nativeElement, {
        mode: 'single', dateFormat: 'Y-m-d', ariaDateFormat: 'F j, Y',
        disableMobile: true, allowInput: false, clickOpens: false, monthSelectorType: 'static',
        enable: [date => this.dayEnabled(flatpickr.formatDate(date, 'Y-m-d'))],
        onReady: (_dates, _text, instance) => {
          instance.calendarContainer.classList.add('darp-event-calendar');
          instance.calendarContainer.id = `${this.inputId}_event_calendar`;
          instance.calendarContainer.setAttribute('role', 'dialog');
          instance.calendarContainer.setAttribute('aria-label', 'Event date');
          this.dateInput.nativeElement.setAttribute('aria-controls', instance.calendarContainer.id);
        },
        onOpen: (_dates, _text, instance) => this.zone.run(() => this.showMonth(instance)),
        onMonthChange: (_dates, _text, instance) => this.zone.run(() => this.showMonth(instance)),
        onYearChange: (_dates, _text, instance) => this.zone.run(() => this.showMonth(instance)),
        onChange: (dates, _text, instance) => this.zone.run(() => {
          this.day = dates[0] ? instance.formatDate(dates[0], 'Y-m-d') : '';
          this.selectedEventId = null;
          this.filterEvents();
          this.cdr.markForCheck();
        }),
        onDayCreate: (_dates, _text, instance, day) => {
          if (this.dayEnabled(instance.formatDate(day.dateObj, 'Y-m-d'))) {
            day.classList.add('darp-data-available');
            day.setAttribute('title', 'Tracking data available');
          }
        },
      });
      this.syncPicker();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetDateKey'] && !changes['resetDateKey'].firstChange) {
      this.day = ''; this.selectedEventId = null; this.selectedEventType = null;
    }
    if (changes['events']) {
      const types = new Set<string>();
      this.events.forEach(event => this.typesFor(event).forEach(type => types.add(type)));
      this.eventTypeOptions = [...types].sort().map(value => ({ value,
        label: VIBRATION_EVENT_LABELS[value as keyof typeof VIBRATION_EVENT_LABELS] ?? value }));
      if (types.size && this.selectedEventType && !types.has(this.selectedEventType)) { this.selectedEventType = null; }
      if (this.events.length && this.day && !this.dayEnabled(this.day)) { this.day = ''; }
    }
    if (changes['value'] || changes['events'] || changes['eventId'] || changes['showEventTypeFilter']) {
      const saved = this.savedEvent();
      if (changes['value'] || changes['eventId'] || saved) { this.selectedEventId = saved?.id ?? null; }
      this.filterEvents();
    }
    this.syncPicker();
  }

  open(): void { if (!this.disabled) { this.picker?.open(); } }

  changeEventType(type: string | null): void {
    if (this.disabled || (type !== null && !this.eventTypeOptions.some(option => option.value === type))) { return; }
    this.selectedEventType = type;
    if (this.day && !this.dayEnabled(this.day)) { this.day = ''; }
    this.selectedEventId = this.savedEvent()?.id ?? null;
    this.filterEvents(); this.syncPicker();
  }

  clearDate(): void {
    if (this.disabled) { return; }
    this.day = '';
    this.selectedEventId = this.savedEvent()?.id ?? null;
    this.picker?.clear(false);
    this.filterEvents();
  }

  chooseEvent(id: string | null): void {
    if (this.disabled) { return; }
    const event = this.visibleEvents.find(item => item.id === id);
    if (!event) { return; }
    this.selectedEventId = event.id;
    this.value = { from: event.from, to: event.to };
    this.selected.emit(this.value);
    this.eventSelected.emit(event);
  }

  private filterEvents(): void {
    this.visibleEvents = this.events.filter(event => this.matchesType(event) && (!this.day || event.from.slice(0, 10) === this.day));
    if (!this.visibleEvents.some(event => event.id === this.selectedEventId)) { this.selectedEventId = null; }
  }

  private typesFor(event: AnalysisEventTime): readonly string[] {
    return [...(event.eventTypes ?? []), ...(event.eventType ? [event.eventType] : [])].filter(type => typeof type === 'string' && !!type);
  }

  private matchesType(event: AnalysisEventTime): boolean {
    return !this.showEventTypeFilter || this.selectedEventType === null || this.typesFor(event).includes(this.selectedEventType);
  }

  private savedEvent(): AnalysisEventTime | undefined {
    const normalize = (text: string) => text.length === 16 ? `${text}:00` : text;
    return this.events.find(event => (!this.eventId || event.id === this.eventId) &&
      event.from === normalize(this.value.from) && event.to === normalize(this.value.to));
  }

  private dayEnabled(day: string): boolean {
    // Exact common acquisition metadata proves its start day, including an event
    // discovered through the next day's/month's window after it crosses midnight.
    return this.events.some(event => this.matchesType(event) && event.from.slice(0, 10) === day);
  }

  private syncPicker(): void {
    if (!this.picker) { return; }
    const visibleMonth = new Date(this.picker.currentYear, this.picker.currentMonth, 1);
    this.picker.set({ minDate: this.minDate, maxDate: this.maxDate,
      enable: [date => this.dayEnabled(flatpickr.formatDate(date, 'Y-m-d'))] });
    this.picker.setDate(this.day, false, 'Y-m-d');
    const matchingEvents = this.events.filter(event => this.matchesType(event));
    const fallbackDay = this.selectedEventType ? matchingEvents[matchingEvents.length - 1]?.from.slice(0, 10)
      : this.calendarDate || matchingEvents[matchingEvents.length - 1]?.from.slice(0, 10);
    this.picker.jumpToDate(this.picker.isOpen ? visibleMonth : this.day || fallbackDay || visibleMonth, false);
  }

  private showMonth(instance: Instance): void {
    const from = new Date(instance.currentYear, instance.currentMonth, 1);
    const to = new Date(instance.currentYear, instance.currentMonth + 1, 1);
    this.calendarWindowChange.emit({ from: instance.formatDate(from, 'Y-m-d'), to: instance.formatDate(to, 'Y-m-d') });
  }

  ngOnDestroy(): void { this.picker?.destroy(); }
}
