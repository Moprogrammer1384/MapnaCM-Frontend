import * as echarts from 'echarts';
import { analyzeSignalIndicators } from 'src/app/core/services/vibration/signal-indicators/signal-indicators-analysis';
import { signalIndicatorRecords } from 'src/testing/signal-indicators-fixture';
import { signalIndicatorAlarmColor } from './signal-indicators-alarm-colors';
import { signalIndicatorsChartOptions } from './signal-indicators-chart-options';

describe('Signal indicator alarm line rendering', () => {
  const palette = { normal: '#2563EB', yellow: '#F6C000', orange: '#fd7e14', red: '#F8285A' };
  const limits = { lower: 10, upper: 20 };
  it('uses blue inside the band and a yellow/orange/red gradient outside either boundary', () => {
    for (const value of [10, 15, 20]) { expect(signalIndicatorAlarmColor(value, limits, palette)).toBe(palette.normal); }
    for (const value of [20.001, 9.999]) {
      const actual = echarts.color.parse(signalIndicatorAlarmColor(value, limits, palette))!;
      const yellow = echarts.color.parse(palette.yellow)!;
      expect(Math.abs(actual[0] - yellow[0]) + Math.abs(actual[1] - yellow[1]) + Math.abs(actual[2] - yellow[2])).toBeLessThan(3);
    }
    for (const value of [21, 9]) { expect(echarts.color.parse(signalIndicatorAlarmColor(value, limits, palette))).toEqual(echarts.color.parse(palette.orange)); }
    for (const value of [22.5, 7.5, 100, 0]) { expect(signalIndicatorAlarmColor(value, limits, palette)).toBe(palette.red); }
  });
  it('renders an actual multicolour line and two horizontal limits without inserting or changing samples', () => {
    const values = [5, 8, 9.5, 10, 15, 20, 20.5, 21, 23, 30];
    const analysis = analyzeSignalIndicators({ ...signalIndicatorRecords[0], time: values.map((_, index) => index * 60), values }, 'displacement', 'µm', 60);
    const original = analysis.points.map(point => point.statistics.rms);
    const dom = document.createElement('div'); document.body.append(dom);
    const chart = echarts.init(dom, undefined, { width: 700, height: 380 });
    try {
      chart.setOption(signalIndicatorsChartOptions(analysis, 'rms', limits));
      const snapshot = chart.getOption() as unknown as { series: { data: number[][]; markLine: { data: { yAxis: number }[] } }[] };
      expect(snapshot.series[0].data.map(point => point[1])).toEqual(original);
      expect(snapshot.series[0].markLine.data.map(line => line.yAxis)).toEqual([20, 10]);
      expect(snapshot.series.slice(1).every(series => series.data.length === 0)).toBeTrue();
      const strokes = chart.getZr().storage.getDisplayList(true).map(item => (item.style as { stroke?: unknown }).stroke);
      const gradient = strokes.find(stroke => typeof stroke === 'object' && stroke !== null && 'colorStops' in stroke) as { colorStops: { color: string; offset: number }[] };
      expect(gradient).toBeDefined();
      expect(gradient.colorStops.some(stop => stop.color === '#2563EB')).toBeTrue();
      expect(gradient.colorStops.every(stop => stop.offset >= 0 && stop.offset <= 1)).toBeTrue();
      chart.setOption(signalIndicatorsChartOptions(analysis));
      const restored = chart.getOption() as unknown as { color: string[]; series: { data: unknown[]; markLine: { data: unknown[] } }[] };
      expect(restored.color).toEqual(['#2563EB', '#EA580C', '#0D9488']);
      expect(restored.series.every(series => series.data.length === values.length && series.markLine.data.length === 0)).toBeTrue();
    } finally { chart.dispose(); dom.remove(); }
  });
});
