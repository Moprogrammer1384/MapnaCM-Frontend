export type OrbitPixel = readonly [number, number];

/** Hit-test the displayed polyline, including the space between discrete samples. */
export function nearestOrbitSample(pixels: readonly OrbitPixel[], pointer: OrbitPixel,
  previousIndex: number | null, tolerance = 12): number | null {
  let selected: number | null = null, bestDistance = tolerance * tolerance;
  for (let i = 1; i < pixels.length; i++) {
    const a = pixels[i - 1], b = pixels[i];
    if (![...a, ...b].every(Number.isFinite)) { continue; }
    const dx = b[0] - a[0], dy = b[1] - a[1], lengthSquared = dx * dx + dy * dy;
    const fraction = lengthSquared ? Math.max(0, Math.min(1,
      ((pointer[0] - a[0]) * dx + (pointer[1] - a[1]) * dy) / lengthSquared)) : 0;
    const distance = (pointer[0] - a[0] - fraction * dx) ** 2 + (pointer[1] - a[1] - fraction * dy) ** 2;
    const index = fraction <= 0.5 ? i - 1 : i;
    // Repeated revolutions may overlap. Keep the closest chronological branch on a tie.
    const closerInTime = previousIndex !== null && selected !== null &&
      Math.abs(index - previousIndex) < Math.abs(selected - previousIndex);
    if (distance <= tolerance * tolerance && (selected === null || distance < bestDistance - 0.01 ||
      (Math.abs(distance - bestDistance) <= 0.01 && closerInTime))) {
      bestDistance = distance; selected = index;
    }
  }
  return selected;
}
