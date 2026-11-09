import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import type { ECharts, EChartsOption } from 'echarts';
import { Subscription } from 'rxjs';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { RotorPositionAnalysis, RotorPositionEvent, RotorPositionPair, RotorPositionRecord, RotorPositionSettings, RotorPositionUnit } from 'src/app/core/models/rotor-position.model';
import { analyzeRotorPosition } from 'src/app/core/services/vibration/rotor-position/rotor-position-analysis';
import { ROTOR_POSITION_DATA_SOURCE } from 'src/app/core/services/vibration/rotor-position/rotor-position-data-source.service';
import { apiErrorMessage } from 'src/app/core/utils/api-error';
import { NumberFormatPipe } from '../../pipes/number-format.pipe';
import { MeasurementHeadingPipe } from '../../pipes/measurement-heading.pipe';
import { AcquisitionDatePipe } from '../../pipes/acquisition-date.pipe';
import { rotorPositionChartOptions, rotorPositionGrid, rotorPositionTrackingOptions } from './rotor-position-chart-options';
import { POSITION_ZOOM_X, POSITION_ZOOM_Y } from './rotor-position-zoom';
import { XyChartInteraction } from '../vibration-chart-presentation/xy-chart-interaction';

@Component({ selector: 'app-vibration-rotor-position-chart', standalone: true,
  imports: [CommonModule, ApacheEchartsComponent, NumberFormatPipe, MeasurementHeadingPipe, AcquisitionDatePipe], templateUrl: './vibration-rotor-position-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'd-block mw-100', '[attr.aria-busy]': 'loading' } })
export class VibrationRotorPositionChartComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) pair: RotorPositionPair;
  @Input({ required: true }) event: RotorPositionEvent;
  @Input({ required: true }) settings: RotorPositionSettings;
  @Input({ required: true }) titleId: string;
  @Output() readonly sourceUnit = new EventEmitter<RotorPositionUnit | undefined>(true);
  readonly eventClasses = { Startup: 'badge-light-success', CoastDown: 'badge-light-info', Trip: 'badge-light-danger' };
  loading = false;
  error = '';
  record?: RotorPositionRecord;
  analysis?: RotorPositionAnalysis;
  options?: { position: EChartsOption; trend: EChartsOption };
  selectedIndex = 0;
  @ViewChild('sampleInteraction') private sampleInteraction?: ElementRef<HTMLElement>;
  private readonly source = inject(ROTOR_POSITION_DATA_SOURCE);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private subscription?: Subscription;
  private positionChart?: ECharts;
  private trendChart?: ECharts;
  private dimensions = '';
  private readonly positionInteraction = new XyChartInteraction(this.zone, [POSITION_ZOOM_X, POSITION_ZOOM_Y]);
  readonly initializePosition = (chart: ECharts) => {
    chart.setOption({ grid: rotorPositionGrid(chart.getWidth(), chart.getHeight()) });
  };
  private readonly observer = new MutationObserver(() => this.zone.run(() => { this.updateOptions(); this.cdr.markForCheck(); }));
  private readonly pointListener = (params: { data?: unknown }) => {
    const index = Array.isArray(params.data) ? params.data[2] : undefined;
    if (typeof index === 'number' && Number.isInteger(index)) {
      this.zone.run(() => { this.selectPoint(index); this.sampleInteraction?.nativeElement.focus({ preventScroll: true }); });
    }
  };
  private readonly positionClick = (event: { offsetX: number; offsetY: number }) => {
    const chart = this.positionChart, points = this.analysis?.points;
    if (!chart || chart.isDisposed() || !points?.length || !chart.containPixel({ gridIndex: 0 }, [event.offsetX, event.offsetY])) { return; }
    let closest = 0, distance = Infinity;
    points.forEach((point, index) => {
      const pixel = chart.convertToPixel({ seriesId: 'centerline' }, [point.x, point.y]) as number[];
      const candidate = (pixel[0] - event.offsetX) ** 2 + (pixel[1] - event.offsetY) ** 2;
      if (candidate < distance) { distance = candidate; closest = index; }
    });
    this.zone.run(() => { this.selectPoint(closest); this.sampleInteraction?.nativeElement.focus({ preventScroll: true }); });
  };
  constructor() { this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] }); }
  get selectedPoint() { return this.analysis?.points[this.selectedIndex]; }
  get eccentricity(): number | null {
    const point = this.selectedPoint;
    return point && this.analysis?.bearingCentreKnown ? Math.hypot(point.x, point.y) : null;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pair'] || changes['event']) { this.reload(); } else { this.updateAnalysis(); }
  }
  reload(): void {
    if (this.subscription) { this.sourceUnit.emit(undefined); }
    this.subscription?.unsubscribe();
    this.positionInteraction.cancelPending();
    // A synchronous source can replace an event without destroying the chart hosts.
    // Keep their listeners, but start the new acquisition at its full range.
    for (const chart of [this.positionChart, this.trendChart]) {
      if (chart && !chart.isDisposed()) { chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 }); }
    }
    this.loading = true; this.error = ''; this.record = undefined; this.analysis = undefined; this.options = undefined;
    this.selectedIndex = 0; this.dimensions = '';
    this.subscription = this.source.load(this.pair, this.event.id).subscribe({
      next: record => {
        this.loading = false;
        if (record && (record.pairKey !== this.pair.key || record.event.id !== this.event.id ||
          record.event.from !== this.event.from || record.event.to !== this.event.to || record.event.eventType !== this.event.eventType)) {
          this.error = 'The returned data does not belong to the selected probe pair and event.';
        } else {
          this.record = record ?? undefined;
          this.sourceUnit.emit(record?.provenance === 'measured' ? record.unit : undefined);
          this.updateAnalysis();
        }
        this.cdr.markForCheck();
      },
      error: error => { this.sourceUnit.emit(undefined); this.loading = false; this.error = apiErrorMessage(error, 'Rotor position data'); this.cdr.markForCheck(); },
    });
  }
  private updateAnalysis(): void {
    this.error = '';
    if (!this.record) { return; }
    try {
      this.analysis = analyzeRotorPosition(this.record, this.settings);
      this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.analysis.points.length - 1));
      this.updateOptions();
    } catch (error) { this.analysis = undefined; this.options = undefined; this.error = apiErrorMessage(error, 'Rotor position analysis'); }
    this.cdr.markForCheck();
  }
  private updateOptions(): void {
    if (!this.analysis) { return; }
    const chart = this.positionChart;
    this.options = rotorPositionChartOptions(this.analysis, this.settings, this.selectedIndex,
      chart && !chart.isDisposed() ? chart.getWidth() : 600, chart && !chart.isDisposed() ? chart.getHeight() : 440);
  }
  bindPosition(chart: ECharts): void {
    this.positionChart = chart; chart.on('mouseover', this.pointListener); chart.on('click', this.pointListener); this.resized(chart);
    this.positionInteraction.bind(chart);
    chart.getZr().on('click', this.positionClick);
  }
  bindTrend(chart: ECharts): void {
    this.trendChart = chart; chart.on('mouseover', this.pointListener); chart.on('click', this.pointListener);
  }
  resized(chart: ECharts): void {
    if (chart.isDisposed()) { return; }
    const dimensions = `${chart.getWidth()}:${chart.getHeight()}`;
    if (dimensions !== this.dimensions) { this.dimensions = dimensions; this.updateOptions(); this.cdr.markForCheck(); }
  }
  selectPoint(index: number): void {
    if (!this.analysis?.points[index] || index === this.selectedIndex) { return; }
    this.selectedIndex = index;
    this.options = rotorPositionTrackingOptions(this.analysis.points[index], this.settings, index);
    this.cdr.markForCheck();
  }
  resetPositionZoom(): void {
    this.positionInteraction.reset();
  }
  onKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || !this.analysis?.points.length) { return; }
    if (event.key === '0') { event.preventDefault(); this.resetPositionZoom(); return; }
    const last = this.analysis.points.length - 1;
    const next = ({ ArrowRight: this.selectedIndex + 1, ArrowDown: this.selectedIndex + 1,
      ArrowLeft: this.selectedIndex - 1, ArrowUp: this.selectedIndex - 1, Home: 0, End: last } as Record<string, number>)[event.key];
    if (next !== undefined) { event.preventDefault(); this.selectPoint(Math.max(0, Math.min(last, next))); }
  }
  private detachCharts(): void {
    this.positionInteraction.destroy();
    if (this.positionChart && !this.positionChart.isDisposed()) { this.positionChart.getZr().off('click', this.positionClick); }
    for (const chart of [this.positionChart, this.trendChart]) {
      if (chart && !chart.isDisposed()) { chart.off('mouseover', this.pointListener); chart.off('click', this.pointListener); }
    }
    this.positionChart = undefined; this.trendChart = undefined;
  }
  ngOnDestroy(): void { this.subscription?.unsubscribe(); this.observer.disconnect(); this.detachCharts(); }
}
