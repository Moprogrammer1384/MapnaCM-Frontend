import type { DataZoomComponentOption, EChartsOption, GridComponentOption, LegendComponentOption, TooltipComponentOption } from 'echarts';
import { formatNumber } from '../../pipes/number-format.pipe';
import { POSITION_MIN_SPAN } from './xy-chart-interaction';

export function vibrationChartAppearance() {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(`--bs-${name}`).trim();
  const text = token('gray-700'), muted = token('gray-500'), border = token('border-color');
  const base: EChartsOption = { animation: false, aria: { enabled: true },
    textStyle: { fontFamily: styles.fontFamily, fontSize: 12, color: text } };
  const legend: LegendComponentOption = { type: 'scroll', top: 0, left: 'center', itemWidth: 14, itemHeight: 8, itemGap: 16,
    textStyle: { color: text, fontFamily: styles.fontFamily, fontSize: 12 }, pageIconColor: text, pageIconInactiveColor: border,
    pageTextStyle: { color: text } };
  const tooltip: TooltipComponentOption = { confine: true, backgroundColor: token('body-bg'), borderColor: border,
    textStyle: { color: text, fontFamily: styles.fontFamily, fontSize: 12 }, padding: 10 };
  const axis = (name: string, vertical = false) => ({
    type: 'value' as const, name, nameLocation: vertical ? 'end' as const : 'middle' as const, nameGap: vertical ? 16 : 32,
    nameTextStyle: { color: text, fontSize: 12, ...(vertical ? { align: 'left' as const } : {}) },
    axisLabel: { color: token('gray-600'), fontSize: 12, formatter: formatNumber, hideOverlap: true },
    axisTick: { show: false }, axisLine: { show: true, onZero: false, lineStyle: { color: muted, width: 1 } },
    splitLine: { show: vertical, lineStyle: { color: border, type: 'dashed' as const, width: 1 } },
    axisPointer: { label: { formatter: (params: { value: unknown }) => formatNumber(Number(params.value)), backgroundColor: text }, lineStyle: { color: muted } },
  });
  return { token, text, muted, border, base, legend, tooltip, axis };
}
export function vibrationLinearGrid(): GridComponentOption {
  return { left: 64, right: 24, top: 52, bottom: 88, containLabel: false };
}
export function vibrationLinearZoom(ids: readonly [string, string], axes: number | number[]): DataZoomComponentOption[] {
  const { token, text, muted, border } = vibrationChartAppearance();
  return [
    { id: ids[0], type: 'inside', xAxisIndex: axes, filterMode: 'none', throttle: 16 },
    { id: ids[1], type: 'slider', xAxisIndex: axes, filterMode: 'none', height: 20, bottom: 10,
      labelFormatter: formatNumber, borderColor: border, backgroundColor: token('gray-100'), fillerColor: token('primary-light'),
      textStyle: { color: text }, handleStyle: { color: token('primary'), borderColor: token('primary') },
      moveHandleStyle: { color: token('primary') },
      dataBackground: { lineStyle: { color: muted }, areaStyle: { color: token('gray-200') } },
      selectedDataBackground: { lineStyle: { color: token('primary') }, areaStyle: { color: token('primary-light') } } },
  ];
}
export function vibrationPositionGrid(width: number, height: number) {
  const side = Math.max(80, Math.min(width - 120, height - 115));
  return { left: (width - side) / 2, top: 55, width: side, height: side, containLabel: false, outerBoundsMode: 'none' as const };
}
export function vibrationPositionZoom(ids: readonly [string, string]): DataZoomComponentOption[] {
  return ids.map((id, index) => ({ id, type: 'inside', ...(index === 0 ? { xAxisIndex: 0 } : { yAxisIndex: 0 }),
    filterMode: 'none', minSpan: POSITION_MIN_SPAN, maxSpan: 100, throttle: 16, zoomOnMouseWheel: false, moveOnMouseWheel: false }));
}
