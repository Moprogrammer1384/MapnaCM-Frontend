import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter,
  Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import flatpickr from 'flatpickr';
import type { Instance } from 'flatpickr/dist/types/instance';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import type { VibrationOnlineWindow } from 'src/app/core/models/vibration-data.model';
import { tehranWallTime, utcFromTehranMinute } from 'src/app/core/utils/vibration-date-time';

const minuteMs = 60_000;

@Component({
  selector: 'app-vibration-online-window-picker', standalone: true,
  imports: [SharedModule], templateUrl: './vibration-online-window-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'd-block' },
})
export class VibrationOnlineWindowPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) inputId: string;
  @Input({ required: true }) seconds: number;
  @Input() startUtc?: string;
  @Input() window?: VibrationOnlineWindow;
  @Input() maximumSeconds = 0;
  @Output() readonly displayed = new EventEmitter<{ seconds: number; startUtc?: string }>();
  @ViewChild('dateInput', { static: true }) private dateInput: ElementRef<HTMLInputElement>;

  day = '';
  time = '';
  error = '';
  maximumFromStart = 0;
  private first = '';
  private last = '';
  private draftStartUtc?: string;
  private picker?: Instance;

  get canChooseStart(): boolean { return !!this.first; }
  get minTime(): string { return this.day && this.day === this.first.slice(0, 10) ? this.first.slice(11) : '00:00'; }
  get maxTime(): string { return this.day && this.day === this.last.slice(0, 10) ? this.last.slice(11) : '23:59'; }

  constructor(private readonly zone: NgZone, private readonly cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['window']) {
      this.first = this.last = '';
      const window = this.window;
      if (window) {
        const subMillisecond = Number(/\.\d{3}(\d{1,4})Z$/.exec(window.fromUtc)?.[1]) > 0 ? 1 : 0;
        const first = Math.ceil((Date.parse(window.fromUtc) + subMillisecond) / minuteMs) * minuteMs;
        const last = Math.floor((Date.parse(window.toUtc) - 1000) / minuteMs) * minuteMs;
        if (first <= last) {
          this.first = tehranWallTime(new Date(first).toISOString()).slice(0, 16);
          this.last = tehranWallTime(new Date(last).toISOString()).slice(0, 16);
        }
      }
    }
    if (changes['startUtc']) {
      const wall = this.startUtc ? tehranWallTime(this.startUtc) : '';
      this.day = wall.slice(0, 10);
      this.time = wall.slice(11, 16);
    }
    if (changes['window'] || changes['startUtc']) { this.syncPicker(); }
    this.updateDraft();
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      const input = this.dateInput.nativeElement;
      this.picker = flatpickr(input, {
        mode: 'single', dateFormat: 'Y-m-d', ariaDateFormat: 'F j, Y',
        disableMobile: true, allowInput: false, clickOpens: false, monthSelectorType: 'static',
        onReady: (_dates, _text, instance) => {
          instance.calendarContainer.classList.add('darp-event-calendar');
          instance.calendarContainer.id = `${this.inputId}_online_calendar`;
          instance.calendarContainer.setAttribute('role', 'dialog');
          instance.calendarContainer.setAttribute('aria-label', 'Online start date');
          input.setAttribute('aria-controls', instance.calendarContainer.id);
        },
        onOpen: () => input.setAttribute('aria-expanded', 'true'),
        onClose: () => input.setAttribute('aria-expanded', 'false'),
        onDayCreate: (_dates, _text, instance, day) => {
          if (this.dayAvailable(instance.formatDate(day.dateObj, 'Y-m-d'))) {
            day.classList.add('darp-data-available');
          }
        },
        onChange: (_dates, date) => this.zone.run(() => {
          this.day = date;
          if (date && (this.time < this.minTime || this.time > this.maxTime)) { this.time = this.minTime; }
          this.updateDraft();
          this.cdr.markForCheck();
        }),
      });
      this.syncPicker();
    });
  }

  openDate(): void { if (this.canChooseStart) { this.picker?.open(); } }

  clearDate(): void {
    this.day = this.time = '';
    this.syncPicker();
    this.updateDraft();
  }

  changeTime(time: string): void {
    this.time = time;
    this.updateDraft();
  }

  display(seconds: number): void {
    if (!this.maximumSeconds || !Number.isSafeInteger(seconds) || seconds < 1) { return; }
    if (this.day && !this.maximumFromStart) {
      this.error = 'Select a start date and time within the recorded online data.';
      return;
    }
    if (this.day && seconds > this.maximumFromStart) {
      this.error = `Select up to ${this.maximumFromStart} seconds from this start time.`;
      return;
    }
    this.error = '';
    this.displayed.emit({ seconds, startUtc: this.draftStartUtc });
  }

  ngOnDestroy(): void { this.picker?.destroy(); }

  private dayAvailable(day: string): boolean {
    return this.canChooseStart && day >= this.first.slice(0, 10) && day <= this.last.slice(0, 10);
  }

  private syncPicker(): void {
    if (!this.picker) { return; }
    this.picker.set({ minDate: this.first.slice(0, 10) || undefined, maxDate: this.last.slice(0, 10) || undefined });
    this.picker.setDate(this.day, false, 'Y-m-d');
    if (!this.day && this.canChooseStart) { this.picker.jumpToDate(this.last.slice(0, 10)); }
  }

  private updateDraft(): void {
    this.error = '';
    this.draftStartUtc = undefined;
    this.maximumFromStart = 0;
    if (!this.window || !this.dayAvailable(this.day) || this.time < this.minTime || this.time > this.maxTime) { return; }
    this.draftStartUtc = utcFromTehranMinute(`${this.day}T${this.time}`);
    if (!this.draftStartUtc) { return; }
    const start = Date.parse(this.draftStartUtc);
    if (start < Date.parse(this.window.fromUtc)) { return; }
    this.maximumFromStart = Math.min(this.maximumSeconds, Math.floor((Date.parse(this.window.toUtc) - start) / 1000));
  }
}
