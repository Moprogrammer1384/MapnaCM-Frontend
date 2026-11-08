import { EChartsOption, LineSeriesOption, ScatterSeriesOption, TooltipComponentOption } from 'echarts';
import { OrbitAnalysis, OrbitPoint, OrbitSettings } from 'src/app/core/models/orbit-analysis.model';
import { formatNumber } from '../../pipes/number-format.pipe';

/** Presentation only. Numerical preparation and filtering belong to the Orbit services. */
export function orbitChartOptions(analysis: OrbitAnalysis, settings: OrbitSettings, zoom: number,
  selectedIndex: number | null = null): { orbit: EChartsOption; waveform: EChartsOption } {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(`--bs-${name}`).trim();
  const primary = token('primary'), secondary = token('success'), muted = token('gray-500');
  const text = token('gray-700'), border = token('gray-300'), background = token('body-bg');
  const filtered = analysis.filter === 'order';
  const polar = (p: OrbitPoint) => [Math.hypot(p.x, p.y), (Math.atan2(p.y, p.x) * 180 / Math.PI + 360) % 360, p.time, p.x, p.y];
  const polarTooltip: TooltipComponentOption['formatter'] = params => {
    const item = Array.isArray(params) ? params[0] : params, v = item.value as number[];
    return `X: ${formatNumber(v[3])} ${settings.unit}<br>Y: ${formatNumber(v[4])} ${settings.unit}<br>Time: ${formatNumber(v[2] * 1000)} ms`;
  };
  const direct = filtered && settings.overlayDirect ? analysis.direct : [];
  const radius = Math.max(analysis.maximumRadius, ...direct.map(p => Math.hypot(p.x, p.y)), 0.001) * 1.15 / zoom;
  const orbitLine = (id: string, name: string, points: readonly OrbitPoint[], color: string, width: number): LineSeriesOption => ({
    id, name, type: 'line', coordinateSystem: 'polar', data: points.map(polar), encode: { radius: 0, angle: 1 },
    showSymbol: false, smooth: false, animation: false, lineStyle: { color, width }, itemStyle: { color },
  });
  const keyphasor: ScatterSeriesOption = { id: 'keyphasor', name: 'Keyphasor', type: 'scatter', coordinateSystem: 'polar',
    data: analysis.keyphasor.map(polar), encode: { radius: 0, angle: 1 }, symbolSize: 9,
    itemStyle: { color: token('warning'), borderColor: text, borderWidth: 1 }, z: 5 };
  const orbit: EChartsOption = {
    animation: false, textStyle: { color: text }, aria: { enabled: true },
    legend: { top: 0, textStyle: { color: text }, data: [filtered ? 'Filtered' : 'Orbit', ...(direct.length ? ['Direct'] : []), ...(analysis.keyphasor.length ? ['Keyphasor'] : [])] },
    tooltip: { trigger: 'item', confine: true, formatter: polarTooltip, backgroundColor: background, borderColor: border, textStyle: { color: text } },
    polar: { center: ['50%', '54%'], radius: '70%' },
    angleAxis: { type: 'value', min: 0, max: 360, interval: 90, startAngle: 0, clockwise: false,
      axisLabel: { color: text, formatter: (value: number) => ({ 0: '+X', 90: '+Y', 180: '−X', 270: '−Y', 360: '' })[value] ?? '' },
      axisLine: { lineStyle: { color: border } }, splitLine: { lineStyle: { color: border } } },
    radiusAxis: { min: 0, max: radius, splitNumber: 4, axisLabel: { color: muted, formatter: (value: number) => formatNumber(value) },
      axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: border } } },
    series: [orbitLine('direct', filtered ? 'Direct' : 'Orbit', filtered ? direct : analysis.points, filtered ? muted : primary, filtered ? 1 : 2),
      orbitLine('filtered', 'Filtered', filtered ? analysis.points : [], primary, 2), keyphasor],
  };
  const waveform: EChartsOption = {
    animation: false, color: [primary, secondary], textStyle: { color: text }, aria: { enabled: true },
    legend: { top: 0, textStyle: { color: text } }, grid: { left: 65, right: 20, top: 55, bottom: 95 },
    tooltip: { trigger: 'axis', confine: true, valueFormatter: value => formatNumber(Number(value)) + ' ' + settings.unit,
      backgroundColor: background, borderColor: border, textStyle: { color: text } },
    xAxis: { type: 'value', name: 'Time (ms)', nameLocation: 'middle', nameGap: 32, nameTextStyle: { color: text },
      axisLabel: { color: text, formatter: value => formatNumber(value) }, axisLine: { lineStyle: { color: border } }, splitLine: { show: false } },
    yAxis: { type: 'value', name: `Displacement (${settings.unit})`, nameTextStyle: { color: text },
      axisLabel: { color: text, formatter: value => formatNumber(value) }, splitLine: { lineStyle: { color: border } } },
    dataZoom: [
      { id: 'orbit-waveform-zoom-inside', type: 'inside', xAxisIndex: 0, filterMode: 'none' },
      { id: 'orbit-waveform-zoom-slider', type: 'slider', xAxisIndex: 0, filterMode: 'none', height: 20, bottom: 10,
        labelFormatter: formatNumber, borderColor: token('border-color'), backgroundColor: token('gray-100'),
        fillerColor: token('primary-light'), textStyle: { color: text },
        handleStyle: { color: primary, borderColor: primary }, moveHandleStyle: { color: primary },
        dataBackground: { lineStyle: { color: muted }, areaStyle: { color: token('gray-200') } },
        selectedDataBackground: { lineStyle: { color: primary }, areaStyle: { color: token('primary-light') } } },
    ],
    series: (['x', 'y'] as const).map((axis, i): LineSeriesOption => ({ id: axis, name: axis.toUpperCase(), type: 'line',
      showSymbol: false, smooth: false, data: analysis.points.map(p => [p.time * 1000, p[axis]]),
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
  const cursor = { type: 'scatter' as const, silent: true, symbolSize: 12, z: 10,
    itemStyle: { color: token('body-bg'), borderColor: token('primary'), borderWidth: 3 }, tooltip: { show: false } };
  return {
    orbit: { series: [{ ...cursor, id: 'tracking-orbit', coordinateSystem: 'polar', encode: { radius: 0, angle: 1 },
      data: point ? [[Math.hypot(point.x, point.y), (Math.atan2(point.y, point.x) * 180 / Math.PI + 360) % 360]] : [] }] },
    waveform: { series: [
      { ...cursor, id: 'tracking-x', data: point ? [[point.time * 1000, point.x]] : [],
        markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: token('primary'), type: 'dashed' },
          data: point ? [{ xAxis: point.time * 1000 }] : [] } },
      { ...cursor, id: 'tracking-y', itemStyle: { ...cursor.itemStyle, borderColor: token('success') },
        data: point ? [[point.time * 1000, point.y]] : [] },
    ] },
  };
}
