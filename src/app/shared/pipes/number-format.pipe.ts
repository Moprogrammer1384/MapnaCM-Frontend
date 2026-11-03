import { Pipe, PipeTransform } from '@angular/core';

/** Display text only. Preserve the original value for calculations and chart coordinates. */
export function formatNumber(value: number | string): string {
  const text = Number(value).toFixed(2);
  return text === '-0.00' ? '0.00' : text;
}

@Pipe({
  name: 'numberFormat',
  standalone: true,
})
export class NumberFormatPipe implements PipeTransform {
  transform(value: number | string): string {
    return formatNumber(value);
  }
}
