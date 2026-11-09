import { vibrationChartColor } from '../vibration-chart-presentation/vibration-chart-colors';
import { EChartsOption, LineSeriesOption, ScatterSeriesOption, TooltipComponentOption } from 'echarts';
import { OrbitAnalysis, OrbitPoint, OrbitSettings } from 'src/app/core/models/orbit-analysis.model';
import { formatNumber } from '../../pipes/number-format.pipe';
import { vibrationChartAppearance, vibrationLinearGrid, vibrationLinearZoom, vibrationPositionGrid, vibrationPositionZoom } from '../vibration-chart-presentation/vibration-chart-presentation';

export const ORBIT_POSITION_ZOOM_IDS = ['orbit-position-zoom', 'orbit-position-y-zoom'] as const;

/** Presentation only. Numerical preparation and filtering belong to the Orbit services. */
export function orbitChartOptions(analysis: OrbitAnalysis, settings: OrbitSettings, zoom: number,
  selectedIndex: number | null = null, width = 600, height = 440): { orbit: EChartsOption; waveform: EChartsOption } {
  const { token, text, base, legend, tooltip, axis } = vibrationChartAppearance();
  const primary = vibrationChartColor(), secondary = vibrationChartColor(1), muted = token('gray-500');
  const filtered = analysis.filter === 'order';
  const xy = (p: OrbitPoint) => [p.x, p.y, p.time];
  const positionTooltip: TooltipComponentOption['formatter'] = params => {
    const item = Array.isArray(params) ? params[0] : params, v = item.value as number[];
    return `Time: ${formatNumber(v[2] * 1000)} ms<br/>X: ${formatNumber(v[0])} ${settings.unit}<br/>Y: ${formatNumber(v[1])} ${settings.unit}`;
  };
  const direct = filtered && settings.overlayDirect ? analysis.direct : [];
  const radius = direct.reduce((extent, point) => Math.max(extent, Math.hypot(point.x, point.y)), Math.max(analysis.maximumRadius, 0.001)) * 1.15 / zoom;
  const positionAxis = (name: string) => ({ ...axis(name), min: -radius, max: radius, nameGap: name.startsWith('Y') ? 48 : 32,
    axisLine: { ...axis(name).axisLine, onZero: true }, splitLine: { show: true, lineStyle: { color: token('border-color'), width: 1 } } });
  const orbitTrace = (id: string, name: string, points: readonly OrbitPoint[], color: string): ScatterSeriesOption => ({
    id, name, type: 'scatter', data: points.map(xy), encode: { x: 0, y: 1 }, symbol: 'circle', symbolSize: name === 'Direct' ? 3 : 4,
    animation: false, itemStyle: { color },
    markPoint: { symbol: 'circle', symbolSize: 9, tooltip: { show: false }, data: points.length && name !== 'Direct' ? [
      { name: 'Start', coord: [points[0].x, points[0].y], itemStyle: { color: token('success') }, label: { formatter: 'Start', color: text, position: 'right' } },
      { name: 'End', coord: [points[points.length - 1].x, points[points.length - 1].y], itemStyle: { color: token('danger') }, label: { formatter: 'End', color: text, position: 'right' } },
    ] : [] },
  });
  const keyphasor: ScatterSeriesOption = { id: 'keyphasor', name: 'Keyphasor', type: 'scatter',
    data: analysis.keyphasor.map(xy), encode: { x: 0, y: 1 }, symbol: 'circle', symbolSize: 9,
    itemStyle: { color: token('warning'), borderColor: text, borderWidth: 1 }, z: 5 };
  const orbit: EChartsOption = {
    ...base,
    legend: { ...legend, data: [filtered ? 'Filtered' : 'Orbit', ...(direct.length ? ['Direct'] : []), ...(analysis.keyphasor.length ? ['Keyphasor'] : [])] },
    tooltip: { ...tooltip, trigger: 'item', formatter: positionTooltip },
    grid: vibrationPositionGrid(width, height),
    xAxis: positionAxis(`X (${settings.unit})`), yAxis: positionAxis(`Y (${settings.unit})`),
    dataZoom: vibrationPositionZoom(ORBIT_POSITION_ZOOM_IDS),
    series: [orbitTrace('direct', filtered ? 'Direct' : 'Orbit', filtered ? direct : analysis.points, filtered ? muted : primary),
      orbitTrace('filtered', 'Filtered', filtered ? analysis.points : [], primary), keyphasor],
  };
  const waveform: EChartsOption = {
    ...base, color: [primary, secondary], legend, grid: vibrationLinearGrid(),
    tooltip: { ...tooltip, trigger: 'axis', valueFormatter: value => formatNumber(Number(value)) + ' ' + settings.unit },
    xAxis: axis('Time (ms)'), yAxis: axis(`Displacement (${settings.unit})`, true),
    dataZoom: vibrationLinearZoom(['orbit-waveform-zoom-inside', 'orbit-waveform-zoom-slider'], 0),
    series: (['x', 'y'] as const).map((axis, i): LineSeriesOption => ({ id: axis, name: axis.toUpperCase(), type: 'line',
      showSymbol: false, smooth: false, lineStyle: { width: 2 }, data: analysis.points.map(p => [p.time * 1000, p[axis]]),
      markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: token('warning'), type: 'dashed' },
        data: i === 0 ? analysis.keyphasor.map(p => ({ xAxis: p.time * 1000 })) : [] } })),
  };
  const tracking = orbitTrackingOptions(selectedIndex === null ? undefined : analysis.points[selectedIndex]);
  orbit.series = [...(orbit.series as (LineSeriesOption | ScatterSeriesOption)[]), ...(tracking.orbit.series as ScatterSeriesOption[])];
  waveform.series = [...(waveform.series as LineSeriesOption[]), ...(tracking.waveform.series as ScatterSeriesOption[])];
  return { orbit, waveform };
}

/** Small cursor-only updates avoid rebuilding the traces or rerunning the analysis on pointer moves. */
export function orbitTrackingOptions(point: OrbitPoint | undefined): { orbit: EChartsOption; waveform: EChartsOption } {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(`--bs-${name}`).trim();
  const cursor = { type: 'scatter' as const, silent: true, symbol: 'circle', symbolSize: 13, z: 10,
    itemStyle: { color: token('body-bg'), borderColor: token('warning'), borderWidth: 3 }, tooltip: { show: false } };
  return {
    orbit: { series: [{ ...cursor, id: 'tracking-orbit', encode: { x: 0, y: 1 }, data: point ? [[point.x, point.y]] : [] }] },
    waveform: { series: [
      { ...cursor, id: 'tracking-x', data: point ? [[point.time * 1000, point.x]] : [],
        markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: vibrationChartColor(), type: 'dashed' },
          data: point ? [{ xAxis: point.time * 1000 }] : [] } },
      { ...cursor, id: 'tracking-y', itemStyle: { ...cursor.itemStyle, borderColor: vibrationChartColor(1) },
        data: point ? [[point.time * 1000, point.y]] : [] },
    ] },
  };
}
