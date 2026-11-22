import * as echarts from 'echarts';
import { storedIndicatorRecord } from 'src/testing/signal-indicators-fixture';
import { signalIndicatorAlarmColor } from './signal-indicators-alarm-colors';
import { signalIndicatorsChartOptions } from './signal-indicators-chart-options';

describe('Signal indicator alarm line rendering', () => {
  const palette = { normal: '#2563EB', yellow: '#F6C000', orange: '#fd7e14', red: '#F8285A' };
  const limits = { upperNormal: 20, upperCaution: 22, upperDanger: 25 };
  it('uses the exact configured band colours with no low-vibration alarm', () => {
    for (const value of [0, 1, 3, 10, 15, 20]) { expect(signalIndicatorAlarmColor(value, limits, palette)).toBe(palette.normal); }
    for (const value of [20.01, 22]) { expect(signalIndicatorAlarmColor(value, limits, palette)).toBe(palette.yellow); }
    for (const value of [22.01, 25]) { expect(signalIndicatorAlarmColor(value, limits, palette)).toBe(palette.orange); }
    for (const value of [25.01, 100]) { expect(signalIndicatorAlarmColor(value, limits, palette)).toBe(palette.red); }
  });
  it('colours the actual line without reference lines or changes to observed samples', () => {
    const values = [0, 2, 3, 4, 5, 10, 15, 20, 21, 22, 23, 25, 30];
    const analysis = storedIndicatorRecord(values);
    const original = analysis.points.map(point => point.rms);
    const dom = document.createElement('div'); document.body.append(dom);
    const chart = echarts.init(dom, undefined, { width: 700, height: 380 });
    try {
      chart.setOption(signalIndicatorsChartOptions(analysis, 'rms', limits));
      const snapshot = chart.getOption() as unknown as { series: { data: number[][]; markLine: { data: { yAxis: number }[] } }[] };
      expect(snapshot.series[0].data.map(point => point[1])).toEqual(original);
      expect(snapshot.series.every(series => series.markLine.data.length === 0)).toBeTrue();
      expect(snapshot.series.slice(1).every(series => series.data.length === 0)).toBeTrue();
      const strokes = chart.getZr().storage.getDisplayList(true).map(item => (item.style as { stroke?: unknown }).stroke);
      const gradient = strokes.find(stroke => typeof stroke === 'object' && stroke !== null && 'colorStops' in stroke) as { colorStops: { color: string; offset: number }[] };
      expect(gradient).toBeDefined();
      expect(gradient.colorStops.some(stop => stop.color === '#2563EB')).toBeTrue();
      expect(gradient.colorStops.every(stop => stop.offset >= 0 && stop.offset <= 1)).toBeTrue();
      chart.dispatchAction({ type: 'dataZoom', dataZoomId: 'signal-indicators-inside', start: 20, end: 70 });
      const afterZoom = chart.getZr().storage.getDisplayList(true).map(item => (item.style as { stroke?: unknown }).stroke);
      expect(afterZoom.some(stroke => typeof stroke === 'object' && stroke !== null && 'colorStops' in stroke)).toBeTrue();
      chart.setOption(signalIndicatorsChartOptions(analysis));
      const restored = chart.getOption() as unknown as { color: string[]; series: { data: unknown[]; markLine: { data: unknown[] } }[] };
      expect(restored.color).toEqual(['#2563EB', '#EA580C', '#0D9488']);
      expect(restored.series.every(series => series.data.length === values.length && series.markLine.data.length === 0)).toBeTrue();
    } finally { chart.dispose(); dom.remove(); }
  });
});
