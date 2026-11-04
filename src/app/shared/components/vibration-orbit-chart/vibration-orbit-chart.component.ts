import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, Input, NgZone, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { ECharts, EChartsOption } from 'echarts';
import { Subscription } from 'rxjs';
import { ApacheEchartsComponent } from 'src/app/_metronic/partials/content/widgets/charts/Apache-Echarts/apache-echarts.component';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { DEFAULT_ORBIT_SETTINGS, OrbitAnalysis, OrbitCaptureSelection, OrbitProbePair, OrbitRecord, OrbitSettings } from 'src/app/core/models/orbit-analysis.model';
import { analyzeOrbit } from 'src/app/core/services/vibration/orbit-analysis/orbit-analysis';
import { ORBIT_DATA_SOURCE } from 'src/app/core/services/vibration/orbit-analysis/orbit-data-source.service';
import { apiErrorMessage } from 'src/app/core/utils/api-error';
import { orbitChartOptions, orbitTrackingOptions } from './orbit-chart-options';
import { nearestOrbitSample, OrbitPixel } from './orbit-point-tracking';

@Component({ selector: 'app-vibration-orbit-chart', standalone: true,
  imports: [CommonModule, SharedModule, ApacheEchartsComponent], templateUrl: './vibration-orbit-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'd-block mw-100', '[attr.aria-busy]': 'loading' } })
export class VibrationOrbitChartComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) pair: OrbitProbePair;
  @Input({ required: true }) selection: OrbitCaptureSelection;
  @Input() settings: OrbitSettings = DEFAULT_ORBIT_SETTINGS;
  @Input() titleId = '';
  record?: OrbitRecord;
  analysis?: OrbitAnalysis;
  options?: { orbit: EChartsOption; waveform: EChartsOption };
  loading = false;
  error = '';
  zoom = 1;
  selectedIndex: number | null = null;
  @ViewChild('orbitInteraction') private orbitInteraction?: ElementRef<HTMLElement>;
  private orbitChart?: ECharts;
  private waveformChart?: ECharts;
  private projectedPoints?: { width: number; height: number; pixels: OrbitPixel[] };
  private readonly source = inject(ORBIT_DATA_SOURCE);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private subscription?: Subscription;
  private version = 0;
  private readonly observer = new MutationObserver(() => this.zone.run(() => this.updateOptions()));
  private readonly trackPointer = (event: { offsetX: number; offsetY: number }) => {
    const chart = this.orbitChart, points = this.analysis?.points;
    const finder = { seriesId: this.analysis?.filter === 'order' ? 'filtered' : 'direct' };
    if (!chart || chart.isDisposed() || !points || !chart.containPixel(finder, [event.offsetX, event.offsetY])) { return; }
    if (!this.projectedPoints || this.projectedPoints.width !== chart.getWidth() || this.projectedPoints.height !== chart.getHeight()) {
      this.projectedPoints = { width: chart.getWidth(), height: chart.getHeight(), pixels: points.map(point => {
        const pixel = chart.convertToPixel(finder, [Math.hypot(point.x, point.y), (Math.atan2(point.y, point.x) * 180 / Math.PI + 360) % 360]);
        return [pixel[0], pixel[1]];
      }) };
    }
    const index = nearestOrbitSample(this.projectedPoints.pixels, [event.offsetX, event.offsetY], this.selectedIndex);
    if (index !== null) {
      this.zone.run(() => { this.selectSample(index); this.orbitInteraction?.nativeElement.focus({ preventScroll: true }); });
    }
  };
  constructor() { this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] }); }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pair'] || changes['selection']) { this.reload(); } else { this.updateAnalysis(); }
  }
  reload(): void {
    this.subscription?.unsubscribe();
    const version = ++this.version;
    this.loading = true; this.error = ''; this.record = undefined; this.analysis = undefined; this.options = undefined;
    this.selectedIndex = null; this.projectedPoints = undefined;
    this.subscription = this.source.load({ pair: this.pair, selection: this.selection }).subscribe({
      next: record => { if (version !== this.version) { return; } this.loading = false; this.record = record ?? undefined; this.updateAnalysis(); },
      error: error => { if (version !== this.version) { return; } this.loading = false; this.error = apiErrorMessage(error, 'Orbit data'); this.cdr.markForCheck(); },
    });
  }
  setZoom(value: number): void { this.zoom = Math.max(0.5, Math.min(4, value)); this.updateOptions(); }
  get selectedPoint() { return this.selectedIndex === null ? undefined : this.analysis?.points[this.selectedIndex]; }
  bindOrbitChart(chart: ECharts): void {
    this.detachOrbitChart(); this.orbitChart = chart;
    chart.getZr().on('mousemove', this.trackPointer);
    chart.getZr().on('click', this.trackPointer);
  }
  bindWaveformChart(chart: ECharts): void { this.waveformChart = chart; }
  focusOrbit(): void { if (this.selectedIndex === null) { this.selectSample(0); } }
  onOrbitKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || !this.analysis) { return; }
    const last = this.analysis.points.length - 1, current = this.selectedIndex ?? 0;
    let next: number;
    switch (event.key) {
      case 'ArrowRight': case 'ArrowDown': next = current + 1; break;
      case 'ArrowLeft': case 'ArrowUp': next = current - 1; break;
      case 'Home': next = 0; break;
      case 'End': next = last; break;
      default: return;
    }
    event.preventDefault(); this.selectSample(Math.max(0, Math.min(last, next)));
  }
  private selectSample(index: number): void {
    if (!this.analysis || index === this.selectedIndex) { return; }
    this.selectedIndex = index;
    const point = this.selectedPoint, tracking = orbitTrackingOptions(point);
    if (this.orbitChart && !this.orbitChart.isDisposed()) {
      this.orbitChart.setOption(tracking.orbit);
      this.orbitChart.dispatchAction({ type: 'showTip', seriesIndex: this.analysis?.filter === 'order' ? 1 : 0, dataIndex: index });
    }
    if (this.waveformChart && !this.waveformChart.isDisposed()) { this.waveformChart.setOption(tracking.waveform); }
    this.cdr.markForCheck();
  }
  private detachOrbitChart(): void {
    if (this.orbitChart && !this.orbitChart.isDisposed()) {
      this.orbitChart.getZr().off('mousemove', this.trackPointer); this.orbitChart.getZr().off('click', this.trackPointer);
    }
    this.orbitChart = undefined; this.projectedPoints = undefined;
  }
  private updateAnalysis(): void {
    if (!this.record) { this.cdr.markForCheck(); return; }
    this.error = '';
    try {
      const previousTime = this.selectedPoint?.time;
      this.analysis = analyzeOrbit(this.record, this.settings);
      if (this.selectedIndex !== null) {
        this.selectedIndex = previousTime === undefined ? Math.min(this.selectedIndex, this.analysis.points.length - 1) :
          this.analysis.points.reduce((best, point, i, points) => Math.abs(point.time - previousTime) < Math.abs(points[best].time - previousTime) ? i : best, 0);
      }
      this.updateOptions();
    }
    catch (error) { this.analysis = undefined; this.options = undefined; this.error = apiErrorMessage(error, 'Orbit analysis'); }
    this.cdr.markForCheck();
  }
  private updateOptions(): void {
    this.projectedPoints = undefined;
    if (this.analysis) { this.options = orbitChartOptions(this.analysis, this.settings, this.zoom, this.selectedIndex); }
    this.cdr.markForCheck();
  }
  ngOnDestroy(): void { this.version++; this.subscription?.unsubscribe(); this.observer.disconnect(); this.detachOrbitChart(); this.waveformChart = undefined; }
}
