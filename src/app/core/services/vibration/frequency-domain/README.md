# DARP Frequency Domain calculations

Implemented 2026-10-21. Uses the **same immutable 409,600-point Book1 fixture** as
Time Domain through `RAW_VIBRATION_DATA_SOURCE`. The original 40,960 observations
are repeated ten times by the existing source adapter; the FFT does not repeat,
truncate or downsample them. Selected measurement/from/to values reach that
adapter. The fixture still returns the same data for every measurement/date.
Displacement/µm remains the user-authorized assumption, not sensor calibration.

## Modules and purpose

| File | Responsibility |
| --- | --- |
| `fft-input-resampling.ts` | Uniformly sample the FFT input using actual timestamps, the same N and endpoints |
| `fft-input-window.ts` | Rectangular/periodic Hann FFT input window and coherent gain |
| `frequency-domain-fft.ts` | Float64 complex forward FFT; radix-2 for powers of two, Bluestein for arbitrary N |
| `frequency-domain-amplitude.ts` | One-sided RMS/0p/pp line amplitudes; separate DC/Nyquist handling |
| `frequency-domain-quantity-conversion.ts` | Complex Fourier differentiation/integration between displacement, velocity and acceleration |
| `frequency-domain-unit-conversion.ts` | Spectrum SI-to-display unit scale; reuses existing exact dimensional factors |
| `frequency-domain-axis.ts` | Hz, CPM and constant-reference-RPM Order axes; validates speed |
| `frequency-domain-analysis.ts` | Assembles the pipeline; caches the source complex spectrum for each window |
| `frequency-domain-analysis.service.ts` | Reference-counted shared sessions, module worker, six-result LRU and scheduled workerless fallback |
| `frequency-domain-analysis.worker.ts` | Background message processing; transfers result buffers without detaching cached spectra |
| `frequency-domain-analysis.spec.ts` | Independent direct DFT, analytical tones, Parseval, DC/Nyquist, units, windows and resampling checks |
| `frequency-domain-analysis.service.spec.ts` | Real-worker equivalence, sharing/release, invalid data and fallback |

FFT-specific input interpolation and windowing live in this folder, as clarified
by the user on 2026-10-21. They are used only by the FFT pipeline. The existing
`../time-domain/time-domain-preparation.ts` is reused for validation/SI normalization;
no new files or behavior are added to Time Domain. No time-domain numerical
derivative or integral is used to obtain the frequency-domain quantities.
The reusable chart is `shared/components/vibration-frequency-domain-chart/`;
page components contain no numerical processing.

## Numerical conventions

1. Normalize actual timestamps to seconds and source amplitudes to SI. Reject
   missing/nonfinite samples, incompatible source units and nonincreasing times.
2. Ordinary FFT requires uniform spacing. If the timestamps differ from a uniform
   grid beyond floating-point tolerance, linearly interpolate onto **N points
   with the same first/last times**. Infer `dt=(tLast-tFirst)/(N-1)` and `Fs=1/dt`.
   This matches the documented nonuniform-input interpolation convention in
   [MathWorks resample](https://www.mathworks.com/help/signal/ref/resample.html).
   It is an approximation for rounded timestamps, preserves the raw record, and
   does not recover a known acquisition rate, calibration or antialias filtering.
   No decimation or arbitrary cutoff is applied. High-frequency magnitudes can
   be attenuated by interpolation; gaps are interpolated and disclosed, not
   repaired sensor observations. Inspect acquisition metadata for instrument work.
3. Default **Rectangular** window: `w[n]=1`. Optional periodic **Hann**:
   `w[n]=0.5-0.5*cos(2*pi*n/N)`. Compute coherent gain `CG=sum(w)/N` explicitly.
   Source DC is retained; there is no hidden mean removal/detrending. Hann spreads
   a DC offset into nearby lines, and off-bin tones leak/scallop. Coherent-gain
   correction gives the line amplitude for an isolated, bin-centered tone away
   from DC/Nyquist; it is not broadband power/PSD normalization or an exact
   off-bin amplitude estimator. The window is chosen independently per tab.
4. FFT convention: `X[k]=sum(x[n]*w[n]*exp(-j*2*pi*k*n/N))`.
   Bluestein uses an internally padded convolution, but returns the **original
   N-point DFT**, not a zero-padded-record spectrum. No power-of-two truncation.
5. Frequency spacing is `df=Fs/N`; return bins `k=0..floor(N/2)`.
   Even N includes Nyquist `Fs/2`; odd N's last bin is below Nyquist.
   This fixture produces 204,801 bins, approximately 0.04 Hz spacing and
   approximately 8192 Hz Nyquist. Ten repeats do **not** add independent
   measurement information or improve the original record's physical resolving
   power; repeated seams influence the spectrum. `df` means DFT bin spacing.
6. Let displacement, velocity, acceleration have orders 0, 1, 2. Convert complex
   coefficients with `(j*2*pi*f)^(targetOrder-sourceOrder)`. This covers all nine
   quantity pairs and retains phase internally. For changed quantity, set DC to
   zero: frequency integration cannot recover initial position/velocity or static
   offsets. For unchanged quantity, retain DC. Near-zero integration magnifies
   low-frequency noise; differentiation magnifies high-frequency noise. No
   instrument bandwidth/high-pass filter or missing integration constants are
   invented. At Nyquist, continuous-time phase/odd-derivative reconstruction is
   ambiguous; converted magnitudes follow the continuous harmonic relation,
   not a claim of recoverable time-domain Nyquist phase.
7. One-sided peak line amplitude is `abs(X[k])/(N*CG)` for DC and even-N
   Nyquist; other positive bins use `2*abs(X[k])/(N*CG)`. Ordinary sinusoidal RMS
   is peak/√2; pp is 2*peak. Sampled Nyquist alternates ±peak, so its sample RMS
   equals peak. DC RMS equals its absolute level and DC pp is zero. Odd-N's last
   bin is paired and receives normal sinusoidal scaling. These are **line
   amplitudes**, not total waveform peak/pp and not power spectral density.
   Rectangular RMS line squares sum to the original sample mean-square (Parseval).
   Summing Hann line RMS squares requires a different energy/window correction;
   this UI does not report broadband RMS from that sum.
8. Convert SI magnitudes to all compatible existing display units. Keep full
   Float64 precision through FFT, conversion, caches, worker and coordinates.
   Display formatting alone uses two decimal places; Data count stays integer.
9. Axis transforms: Hz → CPM is ×60. Hz → Order is ×60/referenceRpm.
   **No default RPM**: Order shows validation until a positive finite speed is
   entered. This is constant-reference axis normalization. Variable-speed order
   tracking needs tachometer/angular resampling and is not inferred from this file.
10. Min/Max are extrema of the full displayed spectrum's line amplitudes, including
    DC when retained; zoom does not change them. Count denotes source observations,
    not FFT bins. The footer also displays df in Hz.

## Runtime and UI

The source adapter is unchanged. A session shares one worker per raw object among
frequency charts, keeps at most two source complex spectra (one per supported
window), and caches at most six display results. Changing Quantity/Unit/Amplitude/
axis/RPM reuses the cached source FFT; changing Window computes that window once.
The final release terminates its worker. Workerless execution schedules the same
math on the main thread. No external numerical dependency, backend or storage.

The chart coalesces rapid controls, ignores stale results, marks OnPush ancestors
after worker completion, supports Retry and releases subscriptions/workers/theme
observers. It uses Metronic tokens, full-bin ECharts data with minmax drawing,
merged updates, independent zoom, existing responsive grid and light/dark styles.
Date reloads keep the chart while loading and merge the new result; load/numerical
errors remove stale results. Tabs restore their controls, including RPM/window.

## Standards context and primary method references

The public scope of [ISO 13373-2:2016](https://www.iso.org/standard/68128.html)
covers processing/presentation of vibration data in time and frequency domains.
[ISO 18431-2:2004](https://www.iso.org/standard/35589.html) covers time windows
including Hann/Hanning and rectangular for vibration Fourier analysis. These
identify relevant standards; the full normative texts/calibrated acquisition
chain were not audited, and this frontend does **not** claim ISO certification or
implement machine-severity thresholds. The implemented equations are verified
against these accessible primary numerical references and analytical tests:

- [MathWorks FFT](https://www.mathworks.com/help/matlab/ref/fft.html): N-point DFT,
  frequency grid and single-sided amplitude normalization.
- [NI FFT and power spectra](https://www.ni.com/en/shop/labview/using-fast-fourier-transforms-and-power-spectra-in-labview.html):
  frequency/amplitude conventions and spectrum interpretation.
- [MathWorks periodic Hann](https://www.mathworks.com/help/signal/ref/hann.html)
  and [NI coherent-gain conversion](https://www.ni.com/docs/es-EC/bundle/labwindows-cvi/page/cvi/libref/cvispectrumunitconversion.htm).
- [B&K Frequency Analysis](https://www.bksv.com/de/knowledge/blog/sound/frequency-analysis)
  and [Measuring Vibration](https://www.bksv.com/doc/br0094.pdf): vibration quantity
  relations and amplitude terminology.
- [NI vibration/order analysis](https://www.ni.com/en/shop/labview/vibration-analysis-and-signal-processing-in-labview.html):
  angular-domain sampling for true order analysis.

Browser numerical, worker, control and actual-Book1 integration tests live beside
their respective modules/components. Current verified commands/results are in
the dated Frequency Domain maintenance entry in the root `agent.md`.
