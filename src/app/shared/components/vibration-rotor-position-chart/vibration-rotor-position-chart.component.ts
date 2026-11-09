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

type Pointer = { offsetX: number; offsetY: number };
interface ProjectedSample { readonly index: number; readonly pixel: readonly [number, number]; }
interface ProjectedSamples { readonly width: number; readonly height: number; readonly samples: readonly ProjectedSample[]; }

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
  private positionPixels?: ProjectedSamples;
  private trendPixels: (ProjectedSamples | undefined)[] = [];
  private pointerFrame?: number;
  private pendingPointer?: { chart: 'position' | 'trend'; event: Pointer };
  private pointerDown = false;
  private dimensions = '';
  private readonly invalidatePosition = () => { this.positionPixels = undefined; };
  private readonly invalidateTrend = () => { this.trendPixels = []; };
  private readonly positionInteraction = new XyChartInteraction(this.zone, [POSITION_ZOOM_X, POSITION_ZOOM_Y], this.invalidatePosition);
  readonly initializePosition = (chart: ECharts) => {
    chart.setOption({ grid: rotorPositionGrid(chart.getWidth(), chart.getHeight()) });
  };
  private readonly observer = new MutationObserver(() => this.zone.run(() => { this.updateOptions(); this.cdr.markForCheck(); }));
  private readonly positionMove = (event: Pointer) => this.queuePointer('position', event);
  private readonly trendMove = (event: Pointer) => this.queuePointer('trend', event);
  private readonly pressPointer = () => { this.pointerDown = true; this.cancelPointer(); };
  private readonly releasePointer = () => { this.pointerDown = false; };
  private readonly positionClick = (event: Pointer) => { this.cancelPointer(); this.trackPosition(event, true); };
  private readonly trendClick = (event: Pointer) => { this.cancelPointer(); this.trackTrend(event); };
  private queuePointer(chart: 'position' | 'trend', event: Pointer): void {
    if (this.pointerDown) { return; }
    this.pendingPointer = { chart, event: { offsetX: event.offsetX, offsetY: event.offsetY } };
    if (this.pointerFrame !== undefined) { return; }
    this.zone.runOutsideAngular(() => {
      this.pointerFrame = requestAnimationFrame(() => {
        this.pointerFrame = undefined;
        const pending = this.pendingPointer; this.pendingPointer = undefined;
        if (pending?.chart === 'position') { this.trackPosition(pending.event); }
        else if (pending) { this.trackTrend(pending.event); }
      });
    });
  }
  private cancelPointer(): void {
    if (this.pointerFrame !== undefined) { cancelAnimationFrame(this.pointerFrame); this.pointerFrame = undefined; }
    this.pendingPointer = undefined;
  }
  private trackPosition(event: Pointer, clicked = false): void {
    const chart = this.positionChart, points = this.analysis?.points;
    if (!chart || chart.isDisposed() || !points?.length || !chart.containPixel({ gridIndex: 0 }, [event.offsetX, event.offsetY])) { return; }
    if (!this.currentProjection(this.positionPixels, chart)) {
      this.positionPixels = this.project(chart, points.map((point, index) => ({ index, coord: [point.x, point.y] })), 'centerline');
    }
    this.followSample(this.nearestSample(this.positionPixels!.samples, event, clicked ? Infinity : 12));
  }
  private trackTrend(event: Pointer): void {
    const chart = this.trendChart, points = this.analysis?.points;
    if (!chart || chart.isDisposed() || !points?.length) { return; }
    const gridIndex = [0, 1].find(index => chart.containPixel({ gridIndex: index }, [event.offsetX, event.offsetY]));
    if (gridIndex === undefined) { return; }
    if (this.settings.trendAxis === 'time') {
      const time = (chart.convertFromPixel({ gridIndex }, [event.offsetX, event.offsetY]) as number[])[0];
      if (!Number.isFinite(time)) { return; }
      let lower = 0, upper = points.length - 1;
      while (lower < upper) {
        const middle = Math.floor((lower + upper) / 2);
        if (points[middle].time < time) { lower = middle + 1; } else { upper = middle; }
      }
      this.followSample(lower > 0 && Math.abs(points[lower - 1].time - time) <= Math.abs(points[lower].time - time) ? lower - 1 : lower);
    } else {
      // RPM can repeat during a transient. Use the displayed branch and ordinate,
      // rather than treating RPM as an ordered or unique sample identifier.
      if (!this.currentProjection(this.trendPixels[gridIndex], chart)) {
        const keys = gridIndex === 0 ? ['x', 'y'] as const : ['speedRpm'] as const;
        const samples: ProjectedSample[] = [];
        for (const key of keys) {
          const coordinates: { index: number; coord: number[] }[] = [];
          points.forEach((point, index) => {
            if (point.speedRpm !== null && point[key] !== null) { coordinates.push({ index, coord: [point.speedRpm, point[key]!] }); }
          });
          samples.push(...this.project(chart, coordinates, `trend-${key}`).samples);
        }
        this.trendPixels[gridIndex] = { width: chart.getWidth(), height: chart.getHeight(), samples };
      }
      this.followSample(this.nearestSample(this.trendPixels[gridIndex]!.samples, event, Infinity));
    }
  }
  private currentProjection(projection: ProjectedSamples | undefined, chart: ECharts): boolean {
    return projection?.width === chart.getWidth() && projection.height === chart.getHeight();
  }
  private project(chart: ECharts, samples: { index: number; coord: number[] }[], seriesId: string): ProjectedSamples {
    // Both plots use linear value axes. Project the coordinate transform once,
    // instead of asking ECharts to resolve its models for every recorded sample.
    const origin = chart.convertToPixel({ seriesId }, [0, 0]) as number[];
    const unit = chart.convertToPixel({ seriesId }, [1, 1]) as number[];
    const projected: ProjectedSample[] = [];
    for (const sample of samples) {
      const pixel: [number, number] = [origin[0] + (unit[0] - origin[0]) * sample.coord[0], origin[1] + (unit[1] - origin[1]) * sample.coord[1]];
      if (pixel.every(Number.isFinite)) { projected.push({ index: sample.index, pixel }); }
    }
    return { width: chart.getWidth(), height: chart.getHeight(), samples: projected };
  }
  private nearestSample(samples: readonly ProjectedSample[], event: Pointer, tolerance: number): number | undefined {
    let best: number | undefined, distance = tolerance ** 2;
    for (const sample of samples) {
      const candidate = (sample.pixel[0] - event.offsetX) ** 2 + (sample.pixel[1] - event.offsetY) ** 2;
      if (candidate <= tolerance ** 2 && (best === undefined || candidate < distance - 1e-8 ||
        Math.abs(candidate - distance) <= 1e-8 && Math.abs(sample.index - this.selectedIndex) < Math.abs(best - this.selectedIndex))) {
        best = sample.index; distance = candidate;
      }
    }
    return best;
  }
  private followSample(index: number | undefined): void {
    if (index === undefined) { return; }
    if (index !== this.selectedIndex) { this.zone.run(() => this.selectPoint(index)); }
    const element = this.sampleInteraction?.nativeElement;
    if (element && document.activeElement !== element) { element.focus({ preventScroll: true }); }
  }
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
    this.cancelPointer(); this.pointerDown = false;
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
          this.sourceUnit.emit(record?.unit);
          this.updateAnalysis();
        }
        this.cdr.markForCheck();
      },
      error: error => { this.sourceUnit.emit(undefined); this.loading = false; this.error = apiErrorMessage(error, 'Rotor position data'); this.cdr.markForCheck(); },
    });
  }
  private updateAnalysis(): void {
    this.cancelPointer();
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
    this.invalidatePosition(); this.invalidateTrend();
    const chart = this.positionChart;
    this.options = rotorPositionChartOptions(this.analysis, this.settings, this.selectedIndex,
      chart && !chart.isDisposed() ? chart.getWidth() : 600, chart && !chart.isDisposed() ? chart.getHeight() : 440);
  }
  bindPosition(chart: ECharts): void {
    this.detachPosition();
    this.positionChart = chart; this.resized(chart);
    this.positionInteraction.bind(chart);
    chart.getZr().on('click', this.positionClick);
    chart.getZr().on('mousemove', this.positionMove);
    chart.getZr().on('mousedown', this.pressPointer); chart.getZr().on('mouseup', this.releasePointer); chart.getZr().on('globalout', this.releasePointer);
    chart.on('legendselectchanged', this.invalidatePosition);
  }
  bindTrend(chart: ECharts): void {
    this.detachTrend();
    this.trendChart = chart;
    chart.getZr().on('mousemove', this.trendMove); chart.getZr().on('click', this.trendClick);
    chart.getZr().on('mousedown', this.pressPointer); chart.getZr().on('mouseup', this.releasePointer); chart.getZr().on('globalout', this.releasePointer);
    chart.on('datazoom', this.invalidateTrend); chart.on('legendselectchanged', this.invalidateTrend);
  }
  resized(chart: ECharts): void {
    if (chart.isDisposed()) { return; }
    const dimensions = `${chart.getWidth()}:${chart.getHeight()}`;
    if (dimensions !== this.dimensions) { this.dimensions = dimensions; this.updateOptions(); this.cdr.markForCheck(); }
  }
  selectPoint(index: number): void {
    if (!this.analysis?.points[index] || index === this.selectedIndex) { return; }
    this.selectedIndex = index;
    // One rendering path: the chart hosts merge this cursor-only patch once.
    // Mixing imperative setOption with input updates can replay stale markers.
    if (!this.positionChart || !this.trendChart) { this.updateOptions(); }
    else { this.options = rotorPositionTrackingOptions(this.analysis.points[index], this.settings, index); }
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
  private detachPosition(): void {
    this.cancelPointer(); this.pointerDown = false;
    this.positionInteraction.destroy();
    const chart = this.positionChart;
    if (chart && !chart.isDisposed()) {
      chart.getZr().off('click', this.positionClick); chart.getZr().off('mousemove', this.positionMove);
      chart.getZr().off('mousedown', this.pressPointer); chart.getZr().off('mouseup', this.releasePointer); chart.getZr().off('globalout', this.releasePointer);
      chart.off('legendselectchanged', this.invalidatePosition);
    }
    this.positionChart = undefined; this.dimensions = ''; this.invalidatePosition();
  }
  private detachTrend(): void {
    this.cancelPointer(); this.pointerDown = false;
    const chart = this.trendChart;
    if (chart && !chart.isDisposed()) {
      chart.getZr().off('mousemove', this.trendMove); chart.getZr().off('click', this.trendClick);
      chart.getZr().off('mousedown', this.pressPointer); chart.getZr().off('mouseup', this.releasePointer); chart.getZr().off('globalout', this.releasePointer);
      chart.off('datazoom', this.invalidateTrend); chart.off('legendselectchanged', this.invalidateTrend);
    }
    this.trendChart = undefined; this.invalidateTrend();
  }
  ngOnDestroy(): void { this.subscription?.unsubscribe(); this.observer.disconnect(); this.detachPosition(); this.detachTrend(); }
}
