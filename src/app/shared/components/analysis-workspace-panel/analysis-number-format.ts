/** Display text only. Keep original numbers in raw data, analysis, chart points and axis bounds. */
export function formatAnalysisNumber(value: number | string): string {
  const text = Number(value).toFixed(2);
  return text === '-0.00' ? '0.00' : text;
}
