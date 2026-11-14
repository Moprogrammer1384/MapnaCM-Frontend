import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, NgZone, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { NgClass } from '@angular/common';
import type { ECharts, EChartsOption } from 'echarts';
import { Subscription } from 'rxjs';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { AMPLITUDE_LABELS } from 'src/app/core/models/analysis-chart-settings.model';
import { WaterfallCapture, WaterfallEvent, WaterfallSettings, WaterfallSpectrum } from 'src/app/core/models/waterfall.model';
import { VIBRATION_EVENT_CLASSES, VIBRATION_EVENT_LABELS } from '../vibration-chart-presentation/vibration-event-presentation';
import { analyzeWaterfall, prepareWaterfall } from 'src/app/core/services/vibration/waterfall/waterfall-analysis';
import { WATERFALL_DATA_SOURCE } from 'src/app/core/services/vibration/waterfall/waterfall-data-source.service';
import { NumberFormatPipe } from '../../pipes/number-format.pipe';
import { AcquisitionDatePipe } from '../../pipes/acquisition-date.pipe';
import { waterfallFrameOrder, waterfallOptions, waterfallSliceOptions } from './waterfall-chart-options';

@Component({
  selector: 'app-vibration-waterfall-chart', standalone: true,
  imports: [NgClass, ApacheEchartsComponent, NumberFormatPipe, AcquisitionDatePipe],
  templateUrl: './vibration-waterfall-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block mw-100', '[attr.aria-busy]': 'loading' },
})
export class VibrationWaterfallChartComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) measurementId: number;
  @Input({ required: true }) inputId: string;
  @Input({ required: true }) event: WaterfallEvent;
  @Input() title = '';
  @Input() titleId = '';
  @Input({ required: true }) settings: WaterfallSettings;
  loading = false;
  error = '';
  capture?: WaterfallCapture;
  frames: WaterfallSpectrum[] = [];
  selected = 0;
  options?: EChartsOption;
  sliceOptions?: EChartsOption;
  readonly amplitudeLabels = AMPLITUDE_LABELS;
  readonly eventClasses = VIBRATION_EVENT_CLASSES;
  readonly eventLabels = VIBRATION_EVENT_LABELS;
  private prepared?: ReturnType<typeof prepareWaterfall>;
  private subscription?: Subscription;
  private chart?: ECharts;
  private readonly source = inject(WATERFALL_DATA_SOURCE);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly observer: MutationObserver;
  private readonly click = (event: unknown) => {
    const value = (event as { value?: number[] }).value;
    if (!Array.isArray(value)) { return; }
    const index = this.settings.view === 'map' ? waterfallFrameOrder(this.frames, this.settings)[value[1]] : value[0];
    this.zone.run(() => this.select(index));
  };

  constructor() {
    this.observer = new MutationObserver(() => this.zone.run(() => { this.draw(); this.cdr.markForCheck(); }));
    this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
  }

  get frame(): WaterfallSpectrum | undefined { return this.frames[this.selected]; }
  get dataCount(): number { return this.frames.reduce((total, frame) => total + frame.sampleCount, 0); }

  ngOnChanges(changes: SimpleChanges): void {
    const previous = changes['settings']?.previousValue as WaterfallSettings | undefined;
    if (changes['measurementId'] || changes['event']) {
      this.reload();
    } else if (previous && (previous.quantity !== this.settings.quantity || previous.unit !== this.settings.unit
      || previous.amplitude !== this.settings.amplitude || previous.xAxis !== this.settings.xAxis || previous.window !== this.settings.window)) {
      this.analyze();
    } else { this.draw(); }
  }

  reload(): void {
    this.subscription?.unsubscribe();
    this.loading = true; this.error = ''; this.capture = undefined; this.prepared = undefined;
    this.frames = []; this.options = undefined; this.sliceOptions = undefined; this.selected = 0;
    if (!this.event) { this.loading = false; return; }
    this.subscription = this.source.load({ measurementId: this.measurementId, eventId: this.event.id }).subscribe({
      next: capture => {
        this.loading = false;
        try {
          if (capture && (capture.event.id !== this.event.id || capture.event.eventType !== this.event.eventType
            || capture.event.from !== this.event.from || capture.event.to !== this.event.to)) {
            throw new Error('The returned spectra do not belong to the selected acquisition.');
          }
          this.capture = capture ?? undefined;
          this.prepared = capture ? prepareWaterfall(capture) : undefined; this.analyze();
        }
        catch (error) { this.fail(error); }
        this.cdr.markForCheck();
      },
      error: error => { this.loading = false; this.fail(error); this.cdr.markForCheck(); },
    });
  }

  private analyze(): void {
    try {
      this.error = '';
      this.frames = this.prepared ? analyzeWaterfall(this.prepared, this.settings) : [];
      this.selected = Math.max(0, Math.min(this.selected, this.frames.length - 1));
      this.draw();
    } catch (error) { this.fail(error); }
  }

  private fail(error: unknown): void {
    this.error = error instanceof Error ? error.message : 'Unable to prepare the Waterfall spectra.';
    this.frames = []; this.options = undefined; this.sliceOptions = undefined;
  }

  select(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.frames.length || index === this.selected) { return; }
    this.selected = index; this.draw(); this.cdr.markForCheck();
  }

  onChartInit(chart: ECharts): void {
    if (this.chart && !this.chart.isDisposed()) { this.chart.off('click', this.click); }
    this.chart = chart; chart.on('click', this.click);
  }

  private draw(): void {
    if (!this.frame) { return; }
    const settings = this.event.eventType === 'SteadyState' ? { ...this.settings, depthAxis: 'time' as const } : this.settings;
    this.options = waterfallOptions(this.frames, settings, this.selected);
    this.sliceOptions = waterfallSliceOptions(this.frame, this.settings.amplitude, Math.max(...this.frames.map(frame => frame.max), Number.EPSILON) * 1.1);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe(); this.observer.disconnect();
    if (this.chart && !this.chart.isDisposed()) { this.chart.off('click', this.click); }
  }
}
