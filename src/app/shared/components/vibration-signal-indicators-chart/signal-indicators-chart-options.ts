import type { EChartsOption } from 'echarts';
import { SignalIndicatorAlarmRange, SignalIndicatorAnalysis, SignalIndicatorMode } from 'src/app/core/models/signal-indicators.model';
import { signalIndicatorValue } from 'src/app/core/services/vibration/signal-indicators/signal-indicators-alarms';
import { formatNumber } from '../../pipes/number-format.pipe';
import { vibrationChartAppearance, vibrationLinearGrid, vibrationLinearZoom } from '../vibration-chart-presentation/vibration-chart-presentation';
import { vibrationChartColor } from '../vibration-chart-presentation/vibration-chart-colors';
import { signalIndicatorAlarmColor, signalIndicatorAlarmLineColor } from './signal-indicators-alarm-colors';

export function signalIndicatorsChartOptions(analysis: SignalIndicatorAnalysis, mode: SignalIndicatorMode = 'all', alarms?: SignalIndicatorAlarmRange): EChartsOption {
  const { base, tooltip, axis, legend, token, text, muted } = vibrationChartAppearance();
  const { signal, points } = analysis;
  const metrics = ['rms', '0p', 'pp'] as const, names = ['RMS', '0p', 'pp'];
  const all = mode === 'all', colors = all ? [vibrationChartColor(), vibrationChartColor(1), '#0D9488'] : metrics.map(() => vibrationChartColor());
  const palette = { normal: vibrationChartColor(), yellow: token('warning'), orange: token('orange') || vibrationChartColor(1), red: token('danger') };
  const maximum = Math.max(...points.map(point => all ? Math.max(point.statistics.rms, point.statistics.peak, point.statistics.peakToPeak) : signalIndicatorValue(point.statistics, mode)), alarms?.upper ?? 0, Number.EPSILON);
  return { ...base, color: colors, grid: vibrationLinearGrid(),
    legend: { ...legend, selectedMode: all ? 'multiple' : false, data: all ? names : [names[metrics.indexOf(mode)]],
      ...(!all ? { selected: { RMS: true, '0p': true, pp: true } } : {}) },
    xAxis: { ...axis('Time (s)'), min: points[0].from, max: points[points.length - 1].to },
    yAxis: { ...axis(all ? signal.unit : `${names[metrics.indexOf(mode)]} (${signal.unit})`, true), min: 0, max: maximum * 1.1 },
    tooltip: { ...tooltip, trigger: 'axis', valueFormatter: value => `${formatNumber(Number(value))} ${signal.unit}` },
    dataZoom: vibrationLinearZoom(['signal-indicators-inside', 'signal-indicators-slider'], 0),
    series: metrics.map((metric, index) => {
      const active = all || metric === mode, range = !all && active ? alarms : undefined;
      const values = points.map(point => signalIndicatorValue(point.statistics, metric));
      return {
      id: `signal-indicator-${['rms', 'peak', 'peakToPeak'][index]}`, name: names[index], type: 'line',
      showSymbol: points.length <= 120 || points.some(point => point.breakBefore),
      symbol: 'circle', symbolSize: 5, lineStyle: { width: 2, color: range ? signalIndicatorAlarmLineColor(values, range, palette) : colors[index] },
      itemStyle: { color: range ? params => signalIndicatorAlarmColor(Number((params.value as number[])[1]), range, palette) : colors[index] },
      connectNulls: false,
      markLine: { silent: true, symbol: 'none', lineStyle: { color: muted, type: 'dashed', width: 1 },
        label: { show: true, color: text, position: 'insideEndTop', fontSize: 11 },
        data: range ? [{ name: 'Upper alarm', yAxis: range.upper, label: { formatter: `Upper alarm: ${formatNumber(range.upper)} ${signal.unit}` } },
          { name: 'Lower alarm', yAxis: range.lower, label: { formatter: `Lower alarm: ${formatNumber(range.lower)} ${signal.unit}` } }] : [] },
      data: active ? points.reduce<(number | null)[][]>((data, point, pointIndex) => {
        if (pointIndex && (point.breakBefore || (analysis.basis === 'raw' && point.from - points[pointIndex - 1].from > analysis.windowSeconds))) { data.push([point.from, null]); }
        data.push([point.from, values[pointIndex]]); return data;
      }, []) : [],
    }; }) };
}
