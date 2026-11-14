import type { CustomSeriesRenderItem, EChartsOption } from 'echarts';
import { AMPLITUDE_LABELS } from 'src/app/core/models/analysis-chart-settings.model';
import { WaterfallSettings, WaterfallSpectrum } from 'src/app/core/models/waterfall.model';
import { formatNumber } from '../../pipes/number-format.pipe';
import { vibrationChartAppearance, vibrationLinearGrid, vibrationLinearZoom } from '../vibration-chart-presentation/vibration-chart-presentation';
import { vibrationChartColor } from '../vibration-chart-presentation/vibration-chart-colors';

export function waterfallFrameOrder(frames: readonly WaterfallSpectrum[], settings: WaterfallSettings): number[] {
  return frames.map((_, index) => index).sort((a, b) => settings.depthAxis === 'rpm'
    ? frames[a].rpm - frames[b].rpm || a - b : frames[a].elapsedSeconds - frames[b].elapsedSeconds);
}

export function waterfallOptions(frames: readonly WaterfallSpectrum[], settings: WaterfallSettings, selected: number): EChartsOption {
  const { base, text, border, muted, token, tooltip } = vibrationChartAppearance();
  const first = frames[0], order = waterfallFrameOrder(frames, settings);
  const frequencyMax = first.frequency[first.frequency.length - 1];
  const amplitudeMax = Math.max(...frames.map(frame => frame.max), Number.EPSILON) * 1.1;
  const amplitudeLabel = `${first.unit} ${AMPLITUDE_LABELS[settings.amplitude]}`;
  const depthLabel = settings.depthAxis === 'rpm' ? 'Speed (RPM)' : 'Elapsed time (s)';
  const depth = (index: number) => settings.depthAxis === 'rpm' ? frames[index].rpm : frames[index].elapsedSeconds;
  const depthMin = depth(order[0]), depthMax = depth(order[order.length - 1]);

  if (settings.view === 'map') {
    return { ...base, tooltip: { ...tooltip, formatter: params => {
      const value = (params as { value: number[] }).value;
      const frame = frames[order[value[1]]];
      return `Spectrum ${order[value[1]] + 1}<br/>${formatNumber(first.frequency[value[0]])} ${first.axisUnit}`
        + `<br/>${formatNumber(frame.values[value[0]])} ${amplitudeLabel}<br/>${formatNumber(frame.rpm)} RPM`
        + `<br/>${formatNumber(frame.elapsedSeconds)} s`;
    } },
    grid: { left: 85, right: 30, top: 35, bottom: 95 },
    xAxis: { type: 'category', name: `Frequency (${first.axisUnit})`, nameLocation: 'middle', nameGap: 35,
      data: Array.from(first.frequency, formatNumber), axisLabel: { color: muted, hideOverlap: true },
      axisLine: { lineStyle: { color: border } }, axisTick: { show: false } },
    yAxis: { type: 'category', name: depthLabel, nameTextStyle: { color: text },
      data: order.map(index => formatNumber(depth(index))), axisLabel: { color: muted },
      axisLine: { lineStyle: { color: border } }, axisTick: { show: false } },
    visualMap: { min: 0, max: amplitudeMax, dimension: 2, orient: 'horizontal', left: 'center', bottom: 10,
      text: [amplitudeLabel, '0'], textStyle: { color: text }, calculable: false,
      inRange: { color: [token('primary-light'), vibrationChartColor()] } },
    series: [{ id: 'waterfall-map', type: 'heatmap', progressive: 0, emphasis: { itemStyle: { borderColor: text, borderWidth: 1 } },
      data: ([] as number[][]).concat(...order.map((index, row) => Array.from(frames[index].values, (value, bin) => [bin, row, value]))) }] };
  }

  // A perspective projection of the three physical coordinates. The frequency and
  // amplitude scales are shared by every trace; the depth uses actual metadata.
  const render: CustomSeriesRenderItem = (params, api) => {
    const box = params.coordSys as unknown as { x: number; y: number; width: number; height: number };
    const point = (frequency: number, amplitude: number, z: number): number[] => [
      box.x + box.width * (0.78 * frequency / frequencyMax + 0.18 * z),
      box.y + box.height * (1 - 0.7 * amplitude / amplitudeMax - 0.25 * z),
    ];
    const index = Number(api.value(0)), frame = frames[index];
    const z = (depth(index) - depthMin) / (depthMax - depthMin || 1);
    const points = Array.from(frame.frequency, (frequency, bin) => point(frequency, frame.values[bin], z));
    return { type: 'group', children: [
      { type: 'polygon', shape: { points: [point(0, 0, z), ...points, point(frequencyMax, 0, z)] },
        style: { fill: token('body-bg'), opacity: 0.96 } },
      { type: 'polyline', shape: { points }, style: { fill: 'none', stroke: vibrationChartColor(),
        lineWidth: index === selected ? 2.5 : 1, opacity: index === selected ? 1 : 0.65 } },
      { type: 'line', shape: { x1: points[0][0], y1: point(0, 0, z)[1],
        x2: point(frequencyMax, 0, z)[0], y2: point(frequencyMax, 0, z)[1] }, style: { stroke: border, lineWidth: 0.5 } },
    ] };
  };
  const axes: CustomSeriesRenderItem = params => {
    const box = params.coordSys as unknown as { x: number; y: number; width: number; height: number };
    const left = box.x, bottom = box.y + box.height, width = box.width * 0.78, height = box.height * 0.7;
    const dx = box.width * 0.18, dy = box.height * 0.25;
    const line = (x1: number, y1: number, x2: number, y2: number, color = border) => ({ type: 'line' as const,
      shape: { x1, y1, x2, y2 }, style: { stroke: color, lineWidth: 1 } });
    const label = (x: number, y: number, value: string, align: 'left' | 'center' | 'right' = 'center') => ({
      type: 'text' as const, style: { x, y, text: value, fill: text, fontSize: 11, fontFamily: base.textStyle?.fontFamily,
        align, verticalAlign: 'middle' as const } });
    return { type: 'group', silent: true, children: [
      line(left, bottom, left + width, bottom, muted), line(left, bottom, left, bottom - height, muted),
      line(left + width, bottom, left + width + dx, bottom - dy, muted),
      label(left + width / 2, bottom + 43, `Frequency (${first.axisUnit})`),
      label(left, bottom - height - 22, amplitudeLabel, 'left'),
      label(left + width + dx, bottom - dy - 24, depthLabel, 'right'),
      ...[0, 0.25, 0.5, 0.75, 1].map(t => line(left + width * t, bottom, left + width * t + dx, bottom - dy)),
      ...[0, 0.25, 0.5, 0.75, 1].map(t => label(left + width * t, bottom + 18, formatNumber(frequencyMax * t))),
      ...[0, 0.25, 0.5, 0.75, 1].map(t => line(left, bottom - height * t, left + width, bottom - height * t)),
      ...[0, 0.25, 0.5, 0.75, 1].map(t => label(left - 8, bottom - height * t, formatNumber(amplitudeMax * t), 'right')),
      ...[0, 0.5, 1].map(t => label(left + width + dx * t + 8, bottom - dy * t,
        formatNumber(depthMin + (depthMax - depthMin) * t), 'left')),
    ] };
  };
  return { ...base, tooltip: { ...tooltip, formatter: params => {
    const index = Number((params as { value: number[] }).value[0]), frame = frames[index];
    return `Spectrum ${index + 1}<br/>${formatNumber(frame.elapsedSeconds)} s · ${formatNumber(frame.rpm)} RPM`
      + `<br/>Peak: ${formatNumber(frame.max)} ${amplitudeLabel} @ ${formatNumber(frame.peakFrequency)} ${frame.axisUnit}`;
  } },
  grid: { left: 65, right: 85, top: 55, bottom: 65 },
  xAxis: { show: false, min: 0, max: 1 }, yAxis: { show: false, min: 0, max: 1 },
  series: [
    { id: 'waterfall-axes', type: 'custom', renderItem: axes, silent: true, clip: false, data: [0] },
    { id: 'waterfall-traces', type: 'custom', renderItem: render, clip: false,
      data: [...order].reverse().map(index => [index]), encode: { tooltip: [0] } },
  ] };
}

export function waterfallSliceOptions(frame: WaterfallSpectrum, amplitude: WaterfallSettings['amplitude'], maximum: number): EChartsOption {
  const { base, tooltip, axis } = vibrationChartAppearance();
  return { ...base, color: [vibrationChartColor()], grid: vibrationLinearGrid(), tooltip: { ...tooltip, trigger: 'axis',
    valueFormatter: value => formatNumber(Number(value)) },
    xAxis: { ...axis(`Frequency (${frame.axisUnit})`), min: 0, max: frame.frequency[frame.frequency.length - 1] },
    yAxis: { ...axis(`${frame.unit} ${AMPLITUDE_LABELS[amplitude]}`, true), min: 0, max: maximum },
    dataZoom: vibrationLinearZoom(['waterfall-slice-inside', 'waterfall-slice-slider'], 0),
    series: [{ id: 'waterfall-slice', name: 'Selected spectrum', type: 'line', showSymbol: false, lineStyle: { width: 1.5 },
      data: Array.from(frame.frequency, (frequency, bin) => [frequency, frame.values[bin]]) }] };
}
