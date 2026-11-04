import { OrbitPoint } from 'src/app/core/models/orbit-analysis.model';
import { shaftPhaseAt } from './orbit-keyphasor';

/** Least squares: DC + a*cos(n*shaftPhase) + b*sin(n*shaftPhase), independently for X/Y. */
function solveProjection(matrix: number[][], values: number[]): number[] {
  const a = matrix.map((row, i) => [...row, values[i]]);
  for (let c = 0; c < 3; c++) {
    let pivot = c;
    for (let r = c + 1; r < 3; r++) { if (Math.abs(a[r][c]) > Math.abs(a[pivot][c])) { pivot = r; } }
    [a[c], a[pivot]] = [a[pivot], a[c]];
    if (Math.abs(a[c][c]) < 1e-10) { throw new Error('Insufficient phase coverage for this order.'); }
    const divisor = a[c][c];
    for (let k = c; k < 4; k++) { a[c][k] /= divisor; }
    for (let r = 0; r < 3; r++) {
      if (r === c) { continue; }
      const factor = a[r][c];
      for (let k = c; k < 4; k++) { a[r][k] -= factor * a[c][k]; }
    }
  }
  return a.map(row => row[3]);
}
export function filterOrbitOrder(input: readonly OrbitPoint[], pulses: readonly number[], order: number): OrbitPoint[] {
  if (!Number.isFinite(order) || order <= 0) { throw new Error('Order must be positive; fractional orders are supported.'); }
  if (pulses.length < 2) { throw new Error('Order filtering requires a shaft phase reference. Direct orbit remains available.'); }
  const points = input.filter(p => p.time >= pulses[0] && p.time <= pulses[pulses.length - 1]);
  if (points.length < 4) { throw new Error('Too few samples between reference pulses.'); }
  const phase = points.map(p => order * shaftPhaseAt(p.time, pulses));
  if (phase[phase.length - 1] - phase[0] < 2 * Math.PI * (1 - 1e-9)) { throw new Error('The record must contain a complete cycle of the selected order.'); }
  if (phase.some((value, i) => i > 0 && value - phase[i - 1] >= Math.PI)) { throw new Error('Selected order reaches the sampling Nyquist limit.'); }
  const basis = phase.map(value => [1, Math.cos(value), Math.sin(value)]);
  const matrix = [0, 1, 2].map(r => [0, 1, 2].map(c => basis.reduce((sum, row) => sum + row[r] * row[c], 0)));
  const project = (axis: 'x' | 'y') => solveProjection(matrix, [0, 1, 2].map(c => basis.reduce((sum, row, i) => sum + row[c] * points[i][axis], 0)));
  const x = project('x'), y = project('y');
  return points.map((point, i) => ({ time: point.time, x: x[1] * basis[i][1] + x[2] * basis[i][2], y: y[1] * basis[i][1] + y[2] * basis[i][2] }));
}
