import { vibrationChartColor } from '../vibration-chart-presentation/vibration-chart-colors';
import type { EChartsOption, ScatterSeriesOption, TooltipComponentOption } from 'echarts';
import { RotorPositionAnalysis, RotorPositionPoint, RotorPositionSettings } from 'src/app/core/models/rotor-position.model';
import { formatNumber } from '../../pipes/number-format.pipe';
import { POSITION_ZOOM_X, POSITION_ZOOM_Y } from './rotor-position-zoom';
import { vibrationChartAppearance, vibrationLinearZoom, vibrationPositionGrid, vibrationPositionZoom } from '../vibration-chart-presentation/vibration-chart-presentation';

/** A square plotting area makes equal engineering ranges equal in physical pixels. */
export function rotorPositionGrid(width: number, height: number) {
  return vibrationPositionGrid(width, height);
}

export function rotorPositionChartOptions(analysis: RotorPositionAnalysis, settings: RotorPositionSettings,
  selected: number, width = 600, height = 440): { position: EChartsOption; trend: EChartsOption } {
  const { token, text, base, legend, tooltip: tooltipStyle, axis } = vibrationChartAppearance();
  const primary = vibrationChartColor(), secondary = vibrationChartColor(1), success = token('success'), muted = token('gray-500');
  const points = analysis.points, unit = analysis.unit;
  const tooltip: TooltipComponentOption['formatter'] = params => {
    const entries = Array.isArray(params) ? params : [params];
    const entry = entries.find(item => Array.isArray(item.value) && Number.isInteger(item.value[2]));
    const point = entry && Array.isArray(entry.value) ? points[Number(entry.value[2])] : undefined;
    return point ? `Time: ${formatNumber(point.time)} s<br/>X: ${formatNumber(point.x)} ${unit}<br/>Y: ${formatNumber(point.y)} ${unit}` +
      `<br/>Speed: ${point.speedRpm === null ? 'Unavailable' : formatNumber(point.speedRpm) + ' RPM'}` : '';
  };
  const shared = { ...base, tooltip: { ...tooltipStyle, trigger: 'item' as const, formatter: tooltip } };
  const positionAxis = (name: string) => ({ ...axis(name), nameGap: name.startsWith('Y') ? 48 : 32,
    axisLine: { ...axis(name).axisLine, onZero: true }, splitLine: { show: true, lineStyle: { color: token('border-color'), width: 1 } } });
  const radius = points.reduce((extent, point) => Math.max(extent, Math.abs(point.x), Math.abs(point.y)),
    Math.max(analysis.clearance?.radialX ?? 0, analysis.clearance?.radialY ?? 0, 0.001)) * 1.15;
  const trace: (number | null)[][] = [];
  points.forEach((point, index) => {
    if (point.breakBefore) { trace.push([null, null, null]); }
    trace.push([point.x, point.y, index]);
  });
  const clearance = analysis.clearance;
  const marker = (point: RotorPositionPoint, name: string, color: string) => ({ name, coord: [point.x, point.y],
    itemStyle: { color }, label: { show: true, formatter: name, color: text, position: 'right' as const } });
  const position: EChartsOption = {
    ...shared, legend: { ...legend, data: ['Centerline', ...(clearance ? ['Clearance'] : [])] },
    grid: rotorPositionGrid(width, height),
    xAxis: { ...positionAxis(`X (${unit})`), min: -radius, max: radius },
    yAxis: { ...positionAxis(`Y (${unit})`), min: -radius, max: radius },
    // Each axis needs its own pan transform. Wheel gestures are normalized by the
    // component; native drag/pinch remains available with equal bounded spans.
    dataZoom: vibrationPositionZoom([POSITION_ZOOM_X, POSITION_ZOOM_Y]),
    series: [
      { id: 'clearance', name: 'Clearance', type: 'line', silent: true, showSymbol: false, tooltip: { show: false },
        data: clearance ? Array.from({ length: 181 }, (_, i) => [clearance.radialX * Math.cos(i * Math.PI / 90), clearance.radialY * Math.sin(i * Math.PI / 90)]) : [],
        lineStyle: { color: muted, type: 'dashed', width: 1 } },
      { id: 'centerline', name: 'Centerline', type: 'scatter', symbol: 'circle', symbolSize: 4,
        data: trace, encode: { x: 0, y: 1 }, itemStyle: { color: primary },
        markPoint: { symbol: 'circle', symbolSize: 9, tooltip: { show: false },
          data: points.length ? [marker(points[0], 'Start', success), marker(points[points.length - 1], 'End', token('danger'))] : [] } },
      { id: 'selected-position', type: 'scatter', silent: true, symbol: 'circle', symbolSize: 13, z: 10, tooltip: { show: false },
        encode: { x: 0, y: 1 },
        itemStyle: { color: token('body-bg'), borderColor: token('warning'), borderWidth: 3 },
        data: points[selected] ? [[points[selected].x, points[selected].y, selected]] : [] },
    ],
  };
  const trendValue = (point: RotorPositionPoint) => settings.trendAxis === 'time' ? point.time : point.speedRpm;
  const series = (['x', 'y', 'speedRpm'] as const).map((key, seriesIndex): ScatterSeriesOption => {
    const data: (number | null)[][] = [];
    points.forEach((point, index) => {
      if (point.breakBefore || trendValue(point) === null) { data.push([null, null, null]); }
      data.push([trendValue(point), point[key], index]);
    });
    const color = [primary, secondary, muted][seriesIndex];
    return { id: `trend-${key}`, name: ['X mean', 'Y mean', 'Speed'][seriesIndex], type: 'scatter',
      xAxisIndex: seriesIndex === 2 ? 1 : 0, yAxisIndex: seriesIndex === 2 ? 1 : 0,
      symbol: 'circle', symbolSize: 4, data, encode: { x: 0, y: 1 }, itemStyle: { color },
      markLine: { silent: true, symbol: 'none', label: { show: false },
        lineStyle: { color: token('warning'), type: 'dashed' },
        data: points[selected] && trendValue(points[selected]) !== null ? [{ xAxis: trendValue(points[selected])! }] : [] } };
  });
  const trend: EChartsOption = {
    ...shared, tooltip: { ...shared.tooltip, trigger: 'axis' },
    legend,
    axisPointer: { link: [{ xAxisIndex: 'all' }], snap: true, lineStyle: { color: muted } },
    grid: [{ left: 64, right: 24, top: 55, height: '40%' }, { left: 64, right: 24, top: '61%', height: '18%' }],
    xAxis: [0, 1].map(gridIndex => ({ ...axis(gridIndex === 1 ? settings.trendAxis === 'time' ? 'Time (s)' : 'Speed (RPM)' : ''), gridIndex })),
    yAxis: [{ ...axis(`Mean (${unit})`, true), gridIndex: 0 }, { ...axis('RPM', true), gridIndex: 1, min: 0 }],
    dataZoom: vibrationLinearZoom(['rotor-trend-inside', 'rotor-trend-slider'], [0, 1]),
    series: [...series, ...rotorPositionTrackingSeries(points[selected], settings, selected)],
  };
  return { position, trend };
}

/** Hover changes only the linked cursor, leaving the axes and gesture state alone. */
export function rotorPositionTrackingOptions(point: RotorPositionPoint, settings: RotorPositionSettings, index: number) {
  const position: EChartsOption = { series: [{ id: 'selected-position', data: [[point.x, point.y, index]] }] };
  const value = settings.trendAxis === 'time' ? point.time : point.speedRpm;
  const trend: EChartsOption = { series: [...['x', 'y', 'speedRpm'].map(key => ({
    id: `trend-${key}`, markLine: { data: value === null ? [] : [{ xAxis: value }] },
  })), ...rotorPositionTrackingSeries(point, settings, index)] };
  return { position, trend };
}

/** The same hollow selected-sample circles as Orbit, on each corresponding trend. */
function rotorPositionTrackingSeries(point: RotorPositionPoint | undefined, settings: RotorPositionSettings, index: number): ScatterSeriesOption[] {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(`--bs-${name}`).trim();
  const value = settings.trendAxis === 'time' ? point?.time : point?.speedRpm;
  return (['x', 'y', 'speedRpm'] as const).map((key, seriesIndex) => ({
    id: `tracking-${key}`, name: ['X mean', 'Y mean', 'Speed'][seriesIndex],
    type: 'scatter', silent: true, symbol: 'circle', symbolSize: 13, z: 10, tooltip: { show: false },
    encode: { x: 0, y: 1 }, xAxisIndex: seriesIndex === 2 ? 1 : 0, yAxisIndex: seriesIndex === 2 ? 1 : 0,
    itemStyle: { color: token('body-bg'), borderColor: [token('warning'), vibrationChartColor(1), token('gray-500')][seriesIndex], borderWidth: 3 },
    data: point && value !== null && value !== undefined && point[key] !== null ? [[value, point[key], index]] : [],
  }));
}
