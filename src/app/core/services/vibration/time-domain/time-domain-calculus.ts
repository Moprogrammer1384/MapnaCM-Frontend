/** Time-domain calculus. Least-squares linear detrending returns a new time signal. */
export function detrendSignal(time: Float64Array, values: Float64Array): Float64Array {
  const length = values.length;
  const origin = time[0];
  let meanTime = 0;
  let meanValue = 0;
  for (let index = 0; index < length; index++) {
    meanTime += (time[index] - origin - meanTime) / (index + 1);
    meanValue += (values[index] - meanValue) / (index + 1);
  }
  let covariance = 0;
  let variance = 0;
  for (let index = 0; index < length; index++) {
    const dt = time[index] - origin - meanTime;
    covariance += dt * (values[index] - meanValue);
    variance += dt * dt;
  }
  const slope = covariance / variance;
  return values.map((value, index) => value - meanValue - slope * (time[index] - origin - meanTime));
}

/** Cumulative trapezoidal quadrature, with the specified integration constant. */
export function integrateSignal(time: Float64Array, values: Float64Array, initialValue = 0): Float64Array {
  const result = new Float64Array(values.length);
  result[0] = initialValue;
  for (let index = 1; index < values.length; index++) {
    result[index] = result[index - 1] + (values[index - 1] + values[index]) * 0.5 * (time[index] - time[index - 1]);
  }
  return result;
}

/** Second-order three-point Lagrange derivative, including one-sided endpoints.
 * Supports nonuniform timestamps; differentiation amplifies high-frequency noise.
 */
export function differentiateSignal(time: Float64Array, values: Float64Array): Float64Array {
  const length = values.length;
  const result = new Float64Array(length);
  for (let index = 0; index < length; index++) {
    const first = Math.max(0, Math.min(index - 1, length - 3));
    // Center at the evaluation time to reduce cancellation with large timestamps.
    const a = time[first] - time[index];
    const b = time[first + 1] - time[index];
    const c = time[first + 2] - time[index];
    const slope1 = (values[first + 1] - values[first]) / (b - a);
    const slope2 = (values[first + 2] - values[first + 1]) / (c - b);
    const curvature = (slope2 - slope1) / (c - a);
    result[index] = slope1 - curvature * (a + b);
  }
  return result;
}

/** Time-weighted record mean (actual, possibly nonuniform timestamps). */
export function removeSignalMean(time: Float64Array, values: Float64Array): Float64Array {
  let area = 0;
  for (let index = 1; index < values.length; index++) {
    area += (values[index - 1] + values[index]) * 0.5 * (time[index] - time[index - 1]);
  }
  const mean = area / (time[time.length - 1] - time[0]);
  return values.map(value => value - mean);
}

/** Dynamic vibration integration: remove DC before quadrature, then center the result.
 * Static motion / initial position or velocity cannot be recovered by this AC policy.
 * No arbitrary cutoff, linear detrending or undocumented filter is imposed on the signal.
 */
export function integrateDynamicSignal(time: Float64Array, values: Float64Array): Float64Array {
  return removeSignalMean(time, integrateSignal(time, removeSignalMean(time, values)));
}
