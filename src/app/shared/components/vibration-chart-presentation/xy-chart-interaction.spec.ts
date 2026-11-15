import { NgZone } from '@angular/core';
import * as echarts from 'echarts';
import { vibrationPositionGrid, vibrationPositionZoom } from './vibration-chart-presentation';
import { PositionZoomRange, XyChartInteraction } from './xy-chart-interaction';

describe('X/Y chart canvas wheel interaction', () => {
  let dom: HTMLDivElement, chart: echarts.ECharts, interaction: XyChartInteraction;
  const ids = ['test-x-zoom', 'test-y-zoom'] as const;
  const grid = vibrationPositionGrid(600, 440);
  const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  const ranges = () => (chart.getOption() as unknown as { dataZoom: PositionZoomRange[] }).dataZoom
    .map(({ start, end }) => ({ start, end }));
  const wheel = (deltaY: number, deltaMode: number = WheelEvent.DOM_DELTA_PIXEL) => {
    const bounds = dom.getBoundingClientRect();
    const event = new WheelEvent('wheel', { clientX: bounds.left + grid.left + grid.width / 2,
      clientY: bounds.top + grid.top + grid.height / 2, deltaY, deltaMode, bubbles: true, cancelable: true });
    dom.querySelector('canvas')!.dispatchEvent(event);
    return event;
  };

  beforeEach(() => {
    dom = document.createElement('div');
    dom.style.width = '600px'; dom.style.height = '440px'; document.body.append(dom);
    chart = echarts.init(dom);
    chart.setOption({ animation: false, grid, xAxis: { min: -100, max: 100 }, yAxis: { min: -100, max: 100 },
      dataZoom: vibrationPositionZoom(ids), series: [{ type: 'scatter', data: [[0, 0], [20, 30]] }] });
    interaction = new XyChartInteraction(new NgZone({ enableLongStackTrace: false }), ids);
    interaction.bind(chart);
  });
  afterEach(() => { interaction.destroy(); chart.dispose(); dom.remove(); });

  it('handles equivalent pixel, line and page wheel deltas equally without double zooming', async () => {
    let expected: PositionZoomRange[] | undefined;
    for (const [deltaY, deltaMode] of [[-16, WheelEvent.DOM_DELTA_PIXEL], [-1, WheelEvent.DOM_DELTA_LINE],
      [-16 / grid.height, WheelEvent.DOM_DELTA_PAGE]]) {
      interaction.reset();
      const event = wheel(deltaY, deltaMode); await frame();
      expect(event.defaultPrevented).toBeTrue();
      const zoomed = ranges(), span = zoomed[0].end - zoomed[0].start;
      expect(span).toBeGreaterThan(98); expect(span).toBeLessThan(99);
      expect(zoomed[1].end - zoomed[1].start).toBeCloseTo(span, 10);
      if (expected) { expect(zoomed).toEqual(expected); } else { expected = zoomed; }
      wheel(-deltaY, deltaMode); await frame();
      expect(ranges()).toEqual([{ start: 0, end: 100 }, { start: 0, end: 100 }]);
    }
  });

  it('cancels pending wheel work and removes the listener when detached from a live chart', async () => {
    wheel(-120); interaction.destroy(); await frame();
    const dispatch = spyOn(chart, 'dispatchAction').and.callThrough();
    wheel(-120); await frame();
    expect(dispatch).not.toHaveBeenCalled();
    expect(ranges()).toEqual([{ start: 0, end: 100 }, { start: 0, end: 100 }]);
  });

  it('rebinds without applying queued wheel deltas from the previous binding', async () => {
    wheel(-120); interaction.bind(chart); await frame();
    expect(ranges()).toEqual([{ start: 0, end: 100 }, { start: 0, end: 100 }]);
    const dispatch = spyOn(chart, 'dispatchAction').and.callThrough();
    wheel(-120); await frame();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(ranges()[0].end - ranges()[0].start).toBeLessThan(100);
  });
});
