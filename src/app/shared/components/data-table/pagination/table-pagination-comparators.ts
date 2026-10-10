/** Only columns explicitly configured as numeric text use this parser.
 * Blank/unparseable text precedes valid numbers; ties retain response order. */
export function compareNumericText(left: string, right: string): number {
  const leftNumber = numericText(left);
  const rightNumber = numericText(right);
  if (leftNumber === null || rightNumber === null) {
    if (leftNumber === null && rightNumber === null) {
      return left.localeCompare(right);
    }
    return leftNumber === null ? -1 : 1;
  }
  return leftNumber - rightNumber;
}

/** Site elevation is text in the API, sometimes formatted as "1,190 m". */
export function compareElevationText(left: string, right: string): number {
  return compareNumericText(left.replace(/(\d)\s*m$/i, '$1'), right.replace(/(\d)\s*m$/i, '$1'));
}

function numericText(value: string): number | null {
  const text = value.trim();
  // Match the entire decimal/scientific value, including properly grouped commas.
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+|\d{1,3}(?:,\d{3})+(?:\.\d*)?)(?:e[+-]?\d+)?$/i.test(text)) {
    return null;
  }
  const number = Number(text.replace(/,/g, ''));
  return Number.isFinite(number) ? number : null;
}
