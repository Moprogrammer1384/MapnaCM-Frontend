const tehranDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/** Display only: UTC/offset instants use Tehran; local acquisition bounds keep their wall clock. */
export function formatVibrationDateTime(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) { return '—'; }
  let local = value;
  if (/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    const parts = tehranDate.formatToParts(new Date(value));
    const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
    local = `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`;
  }
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(local);
  if (!match) { return '—'; }
  const hour = Number(match[2]);
  return `${match[1]} ${String(hour % 12 || 12).padStart(2, '0')}:${match[3]}:${match[4] ?? '00'} ${hour < 12 ? 'AM' : 'PM'}`;
}
