import { Pipe, PipeTransform } from '@angular/core';

const tehranDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/** UTC instants use Tehran; already-local event times retain their wall clock. */
@Pipe({ name: 'acquisitionDate', standalone: true })
export class AcquisitionDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value || !Number.isFinite(Date.parse(value))) { return '—'; }
    const local = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(value);
    if (local) { return `${local[1]} ${local[2]}:${local[3] ?? '00'}`; }
    if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) { return '—'; }
    const parts = tehranDate.formatToParts(new Date(value));
    const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}:${part('second')}`;
  }
}
