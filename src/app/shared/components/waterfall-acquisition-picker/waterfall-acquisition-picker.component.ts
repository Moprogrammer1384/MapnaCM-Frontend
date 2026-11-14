import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { AnalysisTab } from 'src/app/core/models/analysis-panel.model';
import { AnalysisEventTime } from 'src/app/core/models/analysis-event-time.model';
import { WaterfallEvent } from 'src/app/core/models/waterfall.model';
import { WATERFALL_DATA_SOURCE } from 'src/app/core/services/vibration/waterfall/waterfall-data-source.service';
import { VibrationEventPickerComponent } from '../vibration-event-picker/vibration-event-picker.component';
import { VIBRATION_EVENT_LABELS } from '../vibration-chart-presentation/vibration-event-presentation';
import { analysisEventLabel } from 'src/app/core/utils/analysis-event-label';

@Component({
  selector: 'app-waterfall-acquisition-picker', standalone: true, imports: [VibrationEventPickerComponent],
  templateUrl: './waterfall-acquisition-picker.component.html', changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block', '[attr.aria-busy]': 'loading' },
})
export class WaterfallAcquisitionPickerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) inputId: string;
  @Input({ required: true }) measurements: AnalysisTab['measurements'] = [];
  @Input() value?: WaterfallEvent;
  @Output() readonly selected = new EventEmitter<WaterfallEvent | undefined>(true);
  choices: readonly WaterfallEvent[] = [];
  events: readonly AnalysisEventTime[] = [];
  readonly emptyValue = { from: '', to: '' };
  loading = false;
  error = '';
  key = '';
  private readonly source = inject(WATERFALL_DATA_SOURCE);
  private readonly cdr = inject(ChangeDetectorRef);
  private request?: Subscription;
  private version = 0;

  ngOnChanges(): void {
    const key = this.measurements.map(item => item.measurement.id).sort((a, b) => a - b).join(',');
    if (key !== this.key) { this.key = key; this.reload(); }
  }

  reload(): void {
    this.request?.unsubscribe(); const version = ++this.version;
    this.loading = true; this.error = ''; this.choices = []; this.events = [];
    this.request = this.source.listEvents(this.measurements.map(item => item.measurement.id)).subscribe({
      next: events => {
        if (version !== this.version) { return; }
        this.loading = false;
        const ids = new Set<string>();
        const valid = events.every(event => {
          if (!event.id || ids.has(event.id)) { return false; }
          ids.add(event.id);
          return ['SteadyState', 'Startup', 'CoastDown', 'Trip'].includes(event.eventType)
            && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(event.from)
            && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(event.to)
            && Number.isFinite(Date.parse(event.from)) && Number.isFinite(Date.parse(event.to)) && event.from < event.to;
        });
        if (!valid) { this.error = 'The acquisition catalogue contains invalid or duplicate recordings.'; }
        else {
          this.choices = [...events].sort((a, b) => a.from.localeCompare(b.from));
          this.events = this.choices.map(event => ({ ...event,
            label: analysisEventLabel(event.from, VIBRATION_EVENT_LABELS[event.eventType]) }));
        }
        if (this.value && !this.choices.some(event => event.id === this.value?.id && event.from === this.value.from
          && event.to === this.value.to && event.eventType === this.value.eventType)) { this.selected.emit(undefined); }
        this.cdr.markForCheck();
      },
      error: error => {
        if (version !== this.version) { return; }
        this.loading = false; this.error = error instanceof Error ? error.message : 'Unable to load Waterfall acquisitions.';
        this.cdr.markForCheck();
      },
    });
  }

  choose(event: AnalysisEventTime): void {
    if (this.loading || this.error) { return; }
    const choice = this.choices.find(item => item.id === event.id && item.from === event.from && item.to === event.to);
    if (choice) { this.selected.emit(choice); }
  }

  ngOnDestroy(): void { this.version++; this.request?.unsubscribe(); }
}
