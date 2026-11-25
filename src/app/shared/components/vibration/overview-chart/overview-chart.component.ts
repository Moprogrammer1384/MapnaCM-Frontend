import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input, OnChanges, OnDestroy, signal } from '@angular/core';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { SignalIndicatorRecord } from 'src/app/core/models/vibration/signal-indicators/signal-indicators.model';
import { VibrationSignalIndicatorApiService } from 'src/app/core/services/vibration/api/vibration-signal-indicator-api.service';
import { AcquisitionDatePipe } from '../../../pipes/acquisition-date.pipe';
import { NumberFormatPipe } from '../../../pipes/number-format.pipe';
import { RequestState } from '../../request-state/request-state';
import { signalIndicatorsChartOptions } from '../signal-indicators-chart/signal-indicators-chart-options';

@Component({
  selector: 'app-overview-chart',
  standalone: true,
  imports: [ApacheEchartsComponent, AcquisitionDatePipe, NumberFormatPipe],
  templateUrl: './overview-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block mw-100', '[attr.aria-busy]': 'request.loading()' },
})
export class OverviewChartComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) measurementId: number;
  @Input({ required: true }) from: string;
  @Input({ required: true }) to: string;

  private readonly api = inject(VibrationSignalIndicatorApiService);
  private readonly document = inject(DOCUMENT);
  private readonly themeChange = signal(0);
  private readonly themeObserver = new MutationObserver(() => this.themeChange.update(value => value + 1));
  protected readonly request = new RequestState();
  protected readonly record = signal<SignalIndicatorRecord | null>(null);
  protected readonly options = computed(() => {
    this.themeChange();
    const record = this.record();
    return record ? signalIndicatorsChartOptions(record, 'rms') : null;
  });

  constructor() {
    this.themeObserver.observe(this.document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
  }

  ngOnChanges(): void {
    this.reload();
  }

  protected reload(): void {
    this.record.set(null);
    this.request.track(this.api.load(this.measurementId, this.from, this.to), 'Unable to load the RMS trend.').subscribe({
      next: record => this.record.set(record),
      error: () => { /* RequestState supplies the error message. */ },
    });
  }

  ngOnDestroy(): void {
    this.request.destroy();
    this.themeObserver.disconnect();
  }
}
