import * as echarts from 'echarts';
import { storedIndicatorRecord } from 'src/testing/signal-indicators-fixture';
import { signalIndicatorsChartOptions } from './signal-indicators-chart-options';

describe('Signal indicator visible-curve scaling', () => {
  let element: HTMLDivElement, chart: echarts.ECharts;
  // The shared chart grid starts at y=52; converting that pixel reads its actual rendered maximum.
  const axisMaximum = () => Number(chart.convertFromPixel({ yAxisIndex: 0 }, 52));
  const analysis = () => storedIndicatorRecord();
  beforeEach(() => {
    element = document.createElement('div'); document.body.append(element);
    chart = echarts.init(element, undefined, { width: 700, height: 380 });
  });
  afterEach(() => { chart.dispose(); element.remove(); });

  it('fits the remaining curve after hiding larger indicators and expands when they return', () => {
    const data = analysis();
    chart.setOption(signalIndicatorsChartOptions(data));
    const fullMaximum = axisMaximum();
    chart.dispatchAction({ type: 'legendToggleSelect', name: 'pp' });
    const peakMaximum = axisMaximum();
    expect(peakMaximum).toBeLessThan(fullMaximum);
    chart.dispatchAction({ type: 'legendToggleSelect', name: '0p' });
    const rmsMaximum = axisMaximum();
    expect(rmsMaximum).toBeLessThan(peakMaximum);
    expect(rmsMaximum).toBeCloseTo(Math.max(...data.points.map(point => point.rms)) * 1.1, 10);
    chart.dispatchAction({ type: 'legendToggleSelect', name: 'pp' });
    expect(axisMaximum()).toBeCloseTo(fullMaximum, 10);
  });

  it('ignores distant alarm thresholds and clears old reference lines when options are merged', () => {
    const data = analysis();
    chart.setOption(signalIndicatorsChartOptions(data, 'rms'));
    chart.setOption({ series: [{ id: 'signal-indicator-rms', type: 'line', markLine: { data: [{ yAxis: 1000000 }] } }] });
    const alarms = { upperNormal: 10000, upperCaution: 20000, upperDanger: 30000 };
    chart.setOption(signalIndicatorsChartOptions(data, 'rms', alarms));
    expect(axisMaximum()).toBeCloseTo(Math.max(...data.points.map(point => point.rms)) * 1.1, 10);
    const snapshot = chart.getOption() as unknown as { series: { markLine: { data: unknown[] } }[] };
    expect(snapshot.series.every(series => series.markLine.data.length === 0)).toBeTrue();
    expect(chart.getZr().storage.getDisplayList(true).some(item => 'style' in item &&
      String((item.style as { text?: unknown }).text ?? '').includes('Upper danger'))).toBeFalse();
  });

  it('keeps a finite usable axis when every curve is hidden or all samples are zero', () => {
    chart.setOption(signalIndicatorsChartOptions(analysis()));
    for (const name of ['RMS', '0p', 'pp']) { chart.dispatchAction({ type: 'legendToggleSelect', name }); }
    expect(Number.isFinite(axisMaximum())).toBeTrue(); expect(axisMaximum()).toBeGreaterThan(0);
    const zero = storedIndicatorRecord([0, 0, 0]);
    chart.setOption(signalIndicatorsChartOptions(zero, 'rms'));
    expect(Number.isFinite(axisMaximum())).toBeTrue(); expect(axisMaximum()).toBeGreaterThan(0);
  });
});
