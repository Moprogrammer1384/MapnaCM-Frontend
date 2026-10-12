import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import flatpickr from 'flatpickr';
import type { Instance } from 'flatpickr/dist/types/instance';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AnalysisDateRange } from 'src/app/core/models/analysis-panel.model';

@Component({
  selector: 'app-date-range',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './date-range.component.html',
  host: { class: 'd-block' },
})
export class DateRangeComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) inputId = 'analysis-date';
  @Input({ required: true }) value: AnalysisDateRange = { from: '', to: '' };
  @Output() readonly valueChange = new EventEmitter<AnalysisDateRange>();
  @ViewChild('rangeInput', { static: true }) private rangeInput: ElementRef<HTMLInputElement>;
  private picker?: Instance;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.picker = this.createPicker(this.rangeInput.nativeElement);
      this.syncPicker();
    });
  }

  ngOnChanges(): void { this.syncPicker(); }

  open(): void { this.picker?.open(); }

  private createPicker(input: HTMLInputElement): Instance {
    return flatpickr(input, {
      mode: 'range', dateFormat: 'Y-m-d', ariaDateFormat: 'F j, Y', disableMobile: true,
      allowInput: false, monthSelectorType: 'static',
      onReady: (_dates, _value, instance) => {
        instance.calendarContainer.classList.add('darp-date-calendar');
        instance.calendarContainer.id = `${this.inputId}_range_calendar`;
        instance.calendarContainer.setAttribute('role', 'dialog');
        instance.calendarContainer.setAttribute('aria-label', 'Date range');
        input.setAttribute('aria-controls', instance.calendarContainer.id);
        input.setAttribute('aria-expanded', 'false');
      },
      onOpen: () => input.setAttribute('aria-expanded', 'true'),
      onClose: (dates) => {
        input.setAttribute('aria-expanded', 'false');
        // Dismissing an unfinished range keeps the last committed tab dates.
        if (dates.length !== 2) { this.syncPicker(); }
      },
      onChange: (dates, _date, instance) => {
        if (dates.length !== 2) { return; }
        this.zone.run(() => {
          this.value = {
            from: instance.formatDate(dates[0], 'Y-m-d'),
            to: instance.formatDate(dates[1], 'Y-m-d'),
          };
          this.valueChange.emit({ ...this.value });
        });
      },
    });
  }

  private syncPicker(): void {
    this.picker?.setDate(this.value.from && this.value.to ? [this.value.from, this.value.to] : [], false);
  }

  ngOnDestroy(): void {
    this.picker?.destroy();
  }
}
