export interface ComplexSpectrum { real: Float64Array; imaginary: Float64Array }

/** In-place radix-2 DFT, exp(-j*2*pi*k*n/N); inverse includes 1/N. */
function radix2(real: Float64Array, imaginary: Float64Array, inverse = false): void {
  const count = real.length;
  for (let index = 1, reverse = 0; index < count; index++) {
    let bit = count >> 1;
    for (; reverse & bit; bit >>= 1) { reverse ^= bit; }
    reverse ^= bit;
    if (index < reverse) {
      [real[index], real[reverse]] = [real[reverse], real[index]];
      [imaginary[index], imaginary[reverse]] = [imaginary[reverse], imaginary[index]];
    }
  }
  for (let size = 2; size <= count; size *= 2) {
    const angle = (inverse ? 2 : -2) * Math.PI / size;
    const stepReal = Math.cos(angle), stepImaginary = Math.sin(angle);
    for (let start = 0; start < count; start += size) {
      let wr = 1, wi = 0;
      for (let index = start; index < start + size / 2; index++) {
        const other = index + size / 2;
        const tr = wr * real[other] - wi * imaginary[other];
        const ti = wr * imaginary[other] + wi * real[other];
        real[other] = real[index] - tr; imaginary[other] = imaginary[index] - ti;
        real[index] += tr; imaginary[index] += ti;
        const next = wr * stepReal - wi * stepImaginary;
        wi = wr * stepImaginary + wi * stepReal; wr = next;
      }
    }
  }
  if (inverse) {
    for (let index = 0; index < count; index++) { real[index] /= count; imaginary[index] /= count; }
  }
}

/** Arbitrary-length Float64 FFT via Bluestein convolution. No truncation or
 * record zero-padding: returned N bins have spacing Fs/N, including odd N. */
export function frequencyDomainFft(values: Float64Array): ComplexSpectrum {
  const count = values.length;
  if (!count) { throw new Error('FFT requires samples.'); }
  if ((count & (count - 1)) === 0) {
    const real = values.slice(), imaginary = new Float64Array(count);
    radix2(real, imaginary);
    return { real, imaginary };
  }
  let size = 1;
  while (size < 2 * count - 1) { size *= 2; }
  const ar = new Float64Array(size), ai = new Float64Array(size);
  const br = new Float64Array(size), bi = new Float64Array(size);
  for (let index = 0; index < count; index++) {
    const angle = Math.PI * ((index * index) % (2 * count)) / count;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    ar[index] = values[index] * cosine; ai[index] = -values[index] * sine;
    br[index] = cosine; bi[index] = sine;
    if (index) { br[size - index] = cosine; bi[size - index] = sine; }
  }
  radix2(ar, ai); radix2(br, bi);
  for (let index = 0; index < size; index++) {
    const real = ar[index] * br[index] - ai[index] * bi[index];
    ai[index] = ar[index] * bi[index] + ai[index] * br[index]; ar[index] = real;
  }
  radix2(ar, ai, true);
  const real = new Float64Array(count), imaginary = new Float64Array(count);
  for (let index = 0; index < count; index++) {
    const angle = Math.PI * ((index * index) % (2 * count)) / count;
    real[index] = ar[index] * Math.cos(angle) + ai[index] * Math.sin(angle);
    imaginary[index] = ai[index] * Math.cos(angle) - ar[index] * Math.sin(angle);
  }
  return { real, imaginary };
}
