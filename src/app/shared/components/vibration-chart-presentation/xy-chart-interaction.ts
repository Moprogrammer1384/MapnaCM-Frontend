import { NgZone } from '@angular/core';
import type { ECharts } from 'echarts';

export interface PositionZoomRange { readonly start: number; readonly end: number; }
export const POSITION_MIN_SPAN = 5;
export function zoomPositionRanges(x: PositionZoomRange, y: PositionZoomRange, logScale: number,
  fractionX: number, fractionY: number): readonly [PositionZoomRange, PositionZoomRange] {
  const span = Math.max(POSITION_MIN_SPAN, Math.min(100, (x.end - x.start) * Math.exp(Math.max(-0.08, Math.min(0.08, logScale)))));
  const range = (previous: PositionZoomRange, fraction: number): PositionZoomRange => {
    const f = Math.max(0, Math.min(1, fraction));
    const anchor = previous.start + f * (previous.end - previous.start);
    const start = Math.max(0, Math.min(100 - span, anchor - f * span));
    return { start, end: start + span };
  };
  return [range(x, fractionX), range(y, fractionY)];
}

/** Scoped gesture adapter, not a chart component. The existing ECharts host owns disposal. */
export class XyChartInteraction {
  private chart?: ECharts;
  private dom?: HTMLElement;
  private frame?: number;
  private pending = 0;
  private anchor: readonly [number, number] = [0.5, 0.5];
  constructor(private readonly zone: NgZone, private readonly ids: readonly [string, string],
    private readonly viewportChanged: () => void = () => {}) {}
  private readonly wheel = (event: WheelEvent) => {
    const chart = this.chart;
    if (!chart || chart.isDisposed() || !Number.isFinite(event.deltaY) || event.deltaY === 0) { return; }
    const bounds = chart.getDom().getBoundingClientRect();
    const pixel = [event.clientX - bounds.left, event.clientY - bounds.top];
    if (!chart.containPixel({ gridIndex: 0 }, pixel)) { return; }
    event.preventDefault();
    const grid = (chart.getOption() as unknown as { grid: { left: number; top: number; width: number; height: number }[] }).grid[0];
    this.anchor = [(pixel[0] - grid.left) / grid.width, 1 - (pixel[1] - grid.top) / grid.height];
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? grid.height : 1);
    this.pending = Math.max(-0.08, Math.min(0.08, this.pending + Math.max(-60, Math.min(60, pixels)) * 0.001));
    if (this.frame === undefined) {
      this.frame = requestAnimationFrame(() => {
        this.frame = undefined;
        if (!chart.isDisposed() && chart === this.chart) {
          const zoom = (chart.getOption() as unknown as { dataZoom: (PositionZoomRange & { id: string })[] }).dataZoom;
          const x = zoom.find(item => item.id === this.ids[0]), y = zoom.find(item => item.id === this.ids[1]);
          if (x && y) {
            chart.dispatchAction({ type: 'dataZoom', batch: zoomPositionRanges(x, y, this.pending, ...this.anchor)
              .map((range, index) => ({ dataZoomId: this.ids[index], ...range })) });
          }
        }
        this.pending = 0;
      });
    }
  };
  private readonly doubleClick = (event: { offsetX: number; offsetY: number }) => {
    if (this.chart?.containPixel({ gridIndex: 0 }, [event.offsetX, event.offsetY])) { this.reset(); }
  };
  bind(chart: ECharts): void {
    this.destroy(); this.chart = chart; this.dom = chart.getDom();
    this.zone.runOutsideAngular(() => this.dom!.addEventListener('wheel', this.wheel, { passive: false }));
    chart.getZr().on('dblclick', this.doubleClick); chart.on('datazoom', this.viewportChanged);
  }
  cancelPending(): void {
    if (this.frame !== undefined) { cancelAnimationFrame(this.frame); this.frame = undefined; }
    this.pending = 0;
  }
  reset(): void {
    this.cancelPending();
    if (this.chart && !this.chart.isDisposed()) {
      this.chart.dispatchAction({ type: 'dataZoom', batch: this.ids.map(dataZoomId => ({ dataZoomId, start: 0, end: 100 })) });
    }
  }
  destroy(): void {
    this.cancelPending(); this.dom?.removeEventListener('wheel', this.wheel); this.dom = undefined;
    if (this.chart && !this.chart.isDisposed()) {
      this.chart.getZr().off('dblclick', this.doubleClick); this.chart.off('datazoom', this.viewportChanged);
    }
    this.chart = undefined;
  }
}
