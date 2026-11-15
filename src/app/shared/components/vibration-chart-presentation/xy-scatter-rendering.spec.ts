import { NgZone } from '@angular/core';
import * as echarts from 'echarts';
import { DEFAULT_ORBIT_SETTINGS, OrbitAnalysis } from 'src/app/core/models/orbit-analysis.model';
import { DEFAULT_ROTOR_POSITION_SETTINGS, RotorPositionAnalysis } from 'src/app/core/models/rotor-position.model';
import { ORBIT_POSITION_ZOOM_IDS, orbitChartOptions, orbitTrackingOptions } from '../vibration-orbit-chart/orbit-chart-options';
import { rotorPositionChartOptions, rotorPositionTrackingOptions } from '../vibration-rotor-position-chart/rotor-position-chart-options';
import { POSITION_ZOOM_X, POSITION_ZOOM_Y } from '../vibration-rotor-position-chart/rotor-position-zoom';
import { vibrationChartColor } from './vibration-chart-colors';
import { XyChartInteraction } from './xy-chart-interaction';

describe('Dense Orbit and Rotor scatter rendering', () => {
  const count = 7680; // A 1.2-second Orbit capture at 6400 Hz, above ECharts' progressive threshold.
  const points = Array.from({ length: count }, (_, index) => {
    const fraction = index / (count - 1), angle = fraction * 6 * Math.PI, radius = 10 + 20 * fraction;
    return { time: index / 6400, x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });
  const orbitAnalysis: OrbitAnalysis = { filter: 'direct', points, direct: points, keyphasor: [],
    xPeakToPeak: 60, yPeakToPeak: 60, maximumRadius: 30, speedRpm: 3000, notices: [] };
  const rotorAnalysis: RotorPositionAnalysis = { points: points.map((point, index) => ({ ...point,
    speedRpm: index * 3000 / (count - 1), breakBefore: false })),
    unit: 'µm', bearingCentreKnown: true, omittedCount: 0 };
  let charts: echarts.ECharts[], interaction: XyChartInteraction | undefined;
  const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  const mount = (options: echarts.EChartsOption) => {
    const dom = document.createElement('div'); dom.style.width = '600px'; dom.style.height = '440px'; document.body.append(dom);
    const chart = echarts.init(dom, undefined, { width: 600, height: 440 });
    charts.push(chart); chart.setOption(options); return chart;
  };
  const renderedPoints = (chart: echarts.ECharts, color = vibrationChartColor()) => chart.getZr().storage.getDisplayList(true)
    .filter(item => item.type === 'path' && (item.style as { fill?: string }).fill === color && !item.ignore).length;
  const expectComplete = (chart: echarts.ECharts, color = vibrationChartColor()) => {
    expect(renderedPoints(chart, color)).withContext(`visible ${color} symbols in the current render`).toBeGreaterThanOrEqual(count);
  };
  const wheel = async (chart: echarts.ECharts, ids: readonly [string, string]) => {
    interaction = new XyChartInteraction(new NgZone({ enableLongStackTrace: false }), ids); interaction.bind(chart);
    const grid = (chart.getOption() as unknown as { grid: { left: number; top: number; width: number; height: number }[] }).grid[0];
    const bounds = chart.getDom().getBoundingClientRect();
    chart.getDom().querySelector('canvas')!.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true,
      deltaY: -120, clientX: bounds.left + grid.left + grid.width / 2, clientY: bounds.top + grid.top + grid.height / 2 }));
    await frame();
  };
  beforeEach(() => { charts = []; });
  afterEach(() => {
    interaction?.destroy(); interaction = undefined;
    for (const chart of charts) { const dom = chart.getDom(); chart.dispose(); dom.remove(); }
  });

  it('keeps every Orbit observation in the first render after tracking, wheel zoom, reset and resize', async () => {
    const chart = mount(orbitChartOptions(orbitAnalysis, DEFAULT_ORBIT_SETTINGS, 1, 0).orbit);
    expectComplete(chart);
    const visibleFrames: number[] = [];
    chart.on('rendered', () => { visibleFrames.push(renderedPoints(chart)); });
    for (const index of [2300, 5000, count - 1]) {
      chart.setOption(orbitTrackingOptions(points[index]).orbit);
      expectComplete(chart);
    }
    await wheel(chart, ORBIT_POSITION_ZOOM_IDS);
    expectComplete(chart);
    interaction!.reset(); expectComplete(chart);
    chart.resize({ width: 620, height: 440 }); expectComplete(chart);
    expect(visibleFrames.length).toBeGreaterThan(0);
    expect(Math.min(...visibleFrames)).withContext('no incomplete frame during interaction').toBeGreaterThanOrEqual(count);
    expect((chart.getOption() as unknown as { series: { data: unknown[] }[] }).series[0].data.length).toBe(count);
  });

  it('keeps filtered Orbit and its direct overlay complete when moving the sample cursor', () => {
    const settings = { ...DEFAULT_ORBIT_SETTINGS, filter: 'order' as const, overlayDirect: true };
    const options = orbitChartOptions({ ...orbitAnalysis, filter: 'order' }, settings, 1, 0).orbit;
    const chart = mount(options);
    expectComplete(chart);
    chart.setOption(orbitTrackingOptions(points[5000]).orbit); expectComplete(chart);
    // Both original and filtered observations must remain drawn; the overlay uses a theme colour.
    const scatterSymbols = chart.getZr().storage.getDisplayList(true).filter(item => item.type === 'path' && item.z === 2);
    expect(scatterSymbols.length).toBeGreaterThanOrEqual(count * 2);
  });

  it('keeps Rotor position and both X/Y trends complete after tracking and independent zoom', async () => {
    const options = rotorPositionChartOptions(rotorAnalysis, DEFAULT_ROTOR_POSITION_SETTINGS, 0);
    const position = mount(options.position), trend = mount(options.trend);
    expectComplete(position); expectComplete(trend); expectComplete(trend, vibrationChartColor(1));
    const visibleFrames: number[] = [];
    position.on('rendered', () => { visibleFrames.push(renderedPoints(position)); });
    trend.on('rendered', () => { visibleFrames.push(renderedPoints(trend)); });
    for (const index of [2300, 5000, count - 1]) {
      const tracking = rotorPositionTrackingOptions(rotorAnalysis.points[index], DEFAULT_ROTOR_POSITION_SETTINGS, index);
      position.setOption(tracking.position); trend.setOption(tracking.trend);
      expectComplete(position); expectComplete(trend); expectComplete(trend, vibrationChartColor(1));
    }
    await wheel(position, [POSITION_ZOOM_X, POSITION_ZOOM_Y]); expectComplete(position);
    // Narrow the trend slightly, leaving more than 7000 actual observations in its visible window.
    trend.dispatchAction({ type: 'dataZoom', dataZoomId: 'rotor-trend-inside', start: 1, end: 99 });
    expect(renderedPoints(trend)).toBeGreaterThan(7000);
    expect(visibleFrames.length).toBeGreaterThan(0);
    expect(Math.min(...visibleFrames)).withContext('no incomplete position/trend frame').toBeGreaterThan(7000);
  });
});
