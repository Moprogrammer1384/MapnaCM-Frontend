import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AnalysisEventTime } from 'src/app/core/models/analysis-event-time.model';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import { ORBIT_PERIODS, OrbitCaptureChoice, OrbitCaptureSelection, OrbitPeriod, OrbitProbePair } from 'src/app/core/models/orbit-analysis.model';
import { VibrationOrbitAnalysisAvailabilityApiService } from 'src/app/core/services/vibration/api/vibration-orbit-analysis-availability-api.service';
import { apiErrorMessage } from 'src/app/core/utils/api-error';
import { VibrationEventPickerComponent } from '../vibration-event-picker/vibration-event-picker.component';

/** Independent date model: choose one existing one-second capture from a stored cadence. */
@Component({
  selector: 'app-orbit-acquisition-picker', standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, VibrationEventPickerComponent],
  templateUrl: './orbit-acquisition-picker.component.html', changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block', '[attr.aria-busy]': 'loading' },
})
export class OrbitAcquisitionPickerComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) inputId: string;
  @Input({ required: true }) pairs: readonly OrbitProbePair[] = [];
  @Input() period: OrbitPeriod = 'Daily';
  @Input() value?: OrbitCaptureSelection;
  @Output() readonly periodChange = new EventEmitter<OrbitPeriod>();
  @Output() readonly selected = new EventEmitter<OrbitCaptureSelection>();
  readonly periods = ORBIT_PERIODS;
  choices: readonly OrbitCaptureChoice[] = [];
  events: readonly AnalysisEventTime[] = [];
  pickerValue: DateTimeRange = { from: '', to: '' };
  loading = false;
  error = '';
  private readonly api = inject(VibrationOrbitAnalysisAvailabilityApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private request?: Subscription;
  private key = '';
  private version = 0;
  private readonly cache = new Map<string, readonly OrbitCaptureChoice[]>();

  ngOnChanges(): void {
    const key = this.period + '/' + this.pairs.map(pair => `${pair.x.measurement.id}:${pair.y.measurement.id}`).sort().join(',');
    if (key !== this.key) { this.key = key; this.load(); }
    else { this.syncSelection(); }
  }
  changePeriod(period: OrbitPeriod): void { if (period !== this.period) { this.periodChange.emit(period); } }
  load(): void {
    this.request?.unsubscribe(); const version = ++this.version;
    this.loading = true; this.error = ''; this.accept([]);
    const cached = this.cache.get(this.key);
    if (cached) { this.loading = false; this.accept(cached); return; }
    this.request = this.api.load(this.pairs, this.period).subscribe({
      next: choices => {
        if (version !== this.version) { return; }
        this.cache.set(this.key, choices); this.loading = false; this.accept(choices);
      },
      error: error => {
        if (version !== this.version) { return; }
        this.loading = false; this.error = apiErrorMessage(error, 'Orbit acquisition history'); this.cdr.markForCheck();
      },
    });
  }
  choose(value: DateTimeRange): void {
    if (this.loading || this.error) { return; }
    const event = this.events.find(item => item.from === value.from && item.to === value.to);
    if (!event) { return; }
    this.selected.emit({ period: this.period, periodStart: event.id });
  }
  private accept(choices: readonly OrbitCaptureChoice[]): void {
    this.choices = choices;
    this.events = choices.map(choice => ({ id: choice.periodStart, from: this.localInstant(choice.capturedAtUtc),
      to: this.localInstant(choice.finishedAtUtc), label: `${new Date(choice.capturedAtUtc).toLocaleString()} · 1 s` }));
    this.syncSelection(); this.cdr.markForCheck();
  }
  private syncSelection(): void {
    const event = this.value?.period === this.period ? this.events.find(item => item.id === this.value?.periodStart) : undefined;
    if ((event?.from ?? '') !== this.pickerValue.from || (event?.to ?? '') !== this.pickerValue.to) {
      this.pickerValue = { from: event?.from ?? '', to: event?.to ?? '' };
    }
  }
  private localInstant(utc: string): string {
    const date = new Date(utc), pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, '0')}`;
  }
  ngOnDestroy(): void { this.version++; this.request?.unsubscribe(); }
}
