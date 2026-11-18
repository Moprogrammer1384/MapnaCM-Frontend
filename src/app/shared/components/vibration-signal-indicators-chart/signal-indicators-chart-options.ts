import type { EChartsOption } from 'echarts';
import { SignalIndicatorAlarmRange, SignalIndicatorAnalysis, SignalIndicatorMode } from 'src/app/core/models/signal-indicators.model';
import { signalIndicatorValue } from 'src/app/core/services/vibration/signal-indicators/signal-indicators-alarms';
import { formatNumber } from '../../pipes/number-format.pipe';
import { vibrationChartAppearance, vibrationLinearGrid, vibrationLinearZoom } from '../vibration-chart-presentation/vibration-chart-presentation';
import { VIBRATION_PEAK_TO_PEAK_COLOR, vibrationChartColor } from '../vibration-chart-presentation/vibration-chart-colors';
import { signalIndicatorAlarmColor } from './signal-indicators-alarm-colors';

export function signalIndicatorsChartOptions(analysis: SignalIndicatorAnalysis, mode: SignalIndicatorMode = 'all', alarms?: SignalIndicatorAlarmRange): EChartsOption {
  const { base, tooltip, axis, legend, token } = vibrationChartAppearance();
  const { signal, points } = analysis;
  const metrics = ['rms', '0p', 'pp'] as const, names = ['RMS', '0p', 'pp'];
  const all = mode === 'all', colors = all ? [vibrationChartColor(), vibrationChartColor(1), VIBRATION_PEAK_TO_PEAK_COLOR] : metrics.map(() => vibrationChartColor());
  const palette = { normal: vibrationChartColor(), yellow: token('warning'), orange: token('orange') || vibrationChartColor(1), red: token('danger') };
  return { ...base, color: colors, grid: vibrationLinearGrid(),
    legend: { ...legend, selectedMode: all ? 'multiple' : false, data: all ? names : [names[metrics.indexOf(mode)]],
      ...(!all ? { selected: { RMS: true, '0p': true, pp: true } } : {}) },
    xAxis: { ...axis('Time (s)'), min: points[0].from, max: points[points.length - 1].to },
    yAxis: { ...axis(all ? signal.unit : `${names[metrics.indexOf(mode)]} (${signal.unit})`, true), min: 0,
      // ECharts supplies the extent of the currently visible series after legend filtering.
      max: (extent: { max: number }) => Number.isFinite(extent.max) && extent.max > 0 ? extent.max * 1.1 : 1 },
    tooltip: { ...tooltip, trigger: 'axis', valueFormatter: value => `${formatNumber(Number(value))} ${signal.unit}` },
    dataZoom: vibrationLinearZoom(['signal-indicators-inside', 'signal-indicators-slider'], 0),
    visualMap: [{ id: 'signal-indicator-alarms', type: 'piecewise', show: false, dimension: 1,
      seriesIndex: !all && alarms ? [metrics.indexOf(mode)] : [],
      pieces: !all && alarms ? [
        { lte: alarms.upperNormal, color: palette.normal },
        { gt: alarms.upperNormal, lte: alarms.upperCaution, color: palette.yellow },
        { gt: alarms.upperCaution, lte: alarms.upperDanger, color: palette.orange },
        { gt: alarms.upperDanger, color: palette.red },
      ] : [],
    }],
    series: metrics.map((metric, index) => {
      const active = all || metric === mode, range = !all && active ? alarms : undefined;
      const values = points.map(point => signalIndicatorValue(point.statistics, metric));
      return {
      id: `signal-indicator-${['rms', 'peak', 'peakToPeak'][index]}`, name: names[index], type: 'line',
      showSymbol: points.length <= 120 || points.some(point => point.breakBefore),
      symbol: 'circle', symbolSize: 5, lineStyle: { width: 2 },
      itemStyle: { color: range ? params => signalIndicatorAlarmColor(Number((params.value as number[])[1]), range, palette) : colors[index] },
      connectNulls: false,
      // Clear any previously merged reference lines; limits colour the curve only.
      markLine: { data: [] },
      data: active ? points.reduce<(number | null)[][]>((data, point, pointIndex) => {
        if (pointIndex && (point.breakBefore || (analysis.basis === 'raw' && point.from - points[pointIndex - 1].from > analysis.windowSeconds))) { data.push([point.from, null]); }
        data.push([point.from, values[pointIndex]]); return data;
      }, []) : [],
    }; }) };
}
