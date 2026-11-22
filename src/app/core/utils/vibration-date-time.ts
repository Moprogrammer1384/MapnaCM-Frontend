const tehranDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/** Convert an explicit instant to Tehran wall time, retaining the source fractional seconds. */
export function tehranWallTime(value: string): string {
  const parts = tehranDate.formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';
  const fraction = value.match(/\.\d{1,7}(?=Z$|[+-]\d{2}:\d{2}$)/i)?.[0] ?? '';
  const hour = part('hour');
  return `${part('year').padStart(4, '0')}-${part('month')}-${part('day')}T${hour === '24' ? '00' : hour}:${part('minute')}:${part('second')}${fraction}`;
}

/** Resolve a Tehran calendar minute independently of the browser's time zone. */
export function utcFromTehranMinute(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) { return undefined; }
  const wall = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(wall)) { return undefined; }

  // The adjacent days supply both offsets near a historical daylight-saving transition.
  const day = 86_400_000;
  const candidates = new Set([wall - day, wall + day].map(probe => {
    const local = Date.parse(`${tehranWallTime(new Date(probe).toISOString())}Z`);
    return new Date(wall - (local - probe)).toISOString();
  }));
  const matching = [...candidates].filter(instant => tehranWallTime(instant).slice(0, 16) === value);
  return matching.length === 1 ? matching[0] : undefined;
}

/** Display only: UTC/offset instants use Tehran; local acquisition bounds keep their wall clock. */
export function formatVibrationDateTime(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) { return '—'; }
  const local = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? tehranWallTime(value) : value;
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(local);
  if (!match) { return '—'; }
  const hour = Number(match[2]);
  return `${match[1]} ${String(hour % 12 || 12).padStart(2, '0')}:${match[3]}:${match[4] ?? '00'} ${hour < 12 ? 'AM' : 'PM'}`;
}
