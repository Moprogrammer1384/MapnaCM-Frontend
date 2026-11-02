/** Display-only formatting. Stored coordinates, sorting and edit payloads retain their sign. */
function formatCoordinate(value: number | null | undefined, limit: number, positive: string, negative: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > limit) {
    return '\u2014';
  }
  return `${Math.abs(value)}° ${value < 0 ? negative : positive}`;
}

export function formatLatitude(value: number | null | undefined): string {
  return formatCoordinate(value, 90, 'N', 'S');
}

export function formatLongitude(value: number | null | undefined): string {
  return formatCoordinate(value, 180, 'E', 'W');
}

export function formatGeoCoordinate(latitude: number | null | undefined, longitude: number | null | undefined): string {
  return `${formatLatitude(latitude)}, ${formatLongitude(longitude)}`;
}
