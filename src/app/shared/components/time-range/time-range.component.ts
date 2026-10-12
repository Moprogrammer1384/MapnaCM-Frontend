import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import flatpickr from 'flatpickr';
import type { Instance } from 'flatpickr/dist/types/instance';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AnalysisTimeRange } from 'src/app/core/models/analysis-panel.model';

@Component({
  selector: 'app-time-range',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './time-range.component.html',
  host: { class: 'd-block' },
})
export class TimeRangeComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) inputId = 'analysis-time';
  @Input({ required: true }) value: AnalysisTimeRange = { from: '00:00', to: '23:59' };
  @Output() readonly valueChange = new EventEmitter<AnalysisTimeRange>();
  @ViewChild('fromInput', { static: true }) private fromInput: ElementRef<HTMLInputElement>;
  @ViewChild('toInput', { static: true }) private toInput: ElementRef<HTMLInputElement>;
  private pickers: Partial<Record<keyof AnalysisTimeRange, Instance>> = {};
  private destroyed = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.pickers.from = this.createPicker(this.fromInput.nativeElement, 'from');
      this.pickers.to = this.createPicker(this.toInput.nativeElement, 'to');
      this.syncPickers();
    });
  }

  ngOnChanges(): void { this.syncPickers(); }

  open(endpoint: keyof AnalysisTimeRange): void {
    const picker = this.pickers[endpoint];
    picker?.open();
    picker?.hourElement?.focus();
    picker?.hourElement?.select();
  }

  private createPicker(input: HTMLInputElement, endpoint: keyof AnalysisTimeRange): Instance {
    return flatpickr(input, {
      enableTime: true, noCalendar: true, time_24hr: true, dateFormat: 'H:i',
      minuteIncrement: 1, enableSeconds: false, disableMobile: true, allowInput: false,
      onReady: (_dates, _value, instance) => {
        instance.calendarContainer.classList.add('darp-time-picker');
        instance.calendarContainer.id = `${this.inputId}_time_${endpoint}_picker`;
        instance.calendarContainer.setAttribute('role', 'dialog');
        instance.calendarContainer.setAttribute('aria-label', `${endpoint === 'from' ? 'Start' : 'End'} time`);
        input.setAttribute('aria-controls', instance.calendarContainer.id);
        input.setAttribute('aria-expanded', 'false');
      },
      onOpen: () => input.setAttribute('aria-expanded', 'true'),
      onClose: (_dates, _value, instance) => {
        input.setAttribute('aria-expanded', 'false');
        // Flatpickr debounces time changes; commit on dismissal as well.
        this.commit(endpoint, instance);
      },
      onChange: (_dates, _value, instance) => this.commit(endpoint, instance),
    });
  }

  private commit(endpoint: keyof AnalysisTimeRange, picker: Instance): void {
    if (this.destroyed || !picker.selectedDates[0]) { return; }
    const time = picker.formatDate(picker.selectedDates[0], 'H:i');
    if (time === this.value[endpoint]) { return; }
    this.zone.run(() => {
      this.value = { ...this.value, [endpoint]: time };
      this.valueChange.emit({ ...this.value });
    });
  }

  private syncPickers(): void {
    this.pickers.from?.setDate(this.value.from, false, 'H:i');
    this.pickers.to?.setDate(this.value.to, false, 'H:i');
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.pickers.from?.destroy();
    this.pickers.to?.destroy();
  }
}
