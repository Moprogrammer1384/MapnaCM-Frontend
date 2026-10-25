# DARP vibration data and processing

Updated 2026-10-25. Only Time Domain and Frequency Domain use the real
VibrationApiService through VIBRATION_DATA_SOURCE in vibration-api.service.ts.
The workbook reader, tenfold repetition, JSON asset and importer were removed.
Overview, Bode Analysis and Rotor Position keep their existing previews.
Synthetic workload data exists only under src/testing/ for regression tests.

## Data access and selection

The active backend contract is docs/Vibration-TimeDomain-API.fa.md (seconds version).
Both backend documents, DTOs and query/service implementations were reviewed.
All X/time values are seconds (timeUnit=s). The current development data is sampled
at one point per second; the frontend derives FFT sample rate from actual times.

1. Measurement Execute opens the same workspace/controls, awaiting date confirmation.
2. The existing date/hour/minute picker Apply confirms the range, including when
   unchanged defaults are explicitly accepted. No API call occurs before this.
3. VibrationApiService requests GET /TimeDomain/Get for the actual measurement and
   UTC From/To. The backend decides whether that interval returns raw or summary.
4. Complete raw selections with no reported gaps map the SAME response points
   directly into time/values arrays for the existing Time/Frequency Domain workers.
   Each measurement/range uses one Get request; there is no second waveform request.
5. Summary/discontinuous selections stay display-only. Time Domain renders their
   server statistics/extrema. Frequency Domain displays a frontend FFT error and
   never passes them to its worker. There is no raw retry, chunking or fixture fallback.

Point limits, counts and resolution selection belong entirely to the backend.
Get sends ONLY MeasurementId, From and To. MaxPoints,
ChartWidthPixels and client-selected counts are omitted. There is no local point
ceiling, count-based budget division, truncation or rejection by response size.
Checks for complete arrays, supported metadata and at least three native samples
remain numerical/contract validation, not display caps. Separate native-channel
requests avoid GetMultiple's automatic cross-quantity calculus; selectors remain
frontend operations. GetMultiple batching is not implemented.

HttpParams carries measurement ID and explicit UTC ISO timestamps. Local picker
values are converted once; existing offsets are respected. From is inclusive, To
exclusive. Existing environment.apiUrl and JWT AuthInterceptor are reused.
Business success=false, transport and malformed-contract failures show actual
messages and Retry. Range changes and destruction cancel the pending request.
There is no new storage, credential, dependency or backend/database implementation.

## Preserve vibration meaning and the existing charts

The raw mathematical modules, workers, caches and formulas are unchanged. Time
Domain keeps its numeric Time (s) axis, instantaneous physical waveform, RMS/0p/pp
reference levels and footer. Frequency Domain keeps FFT, resampling/windowing,
Fourier quantity conversion, units/amplitudes and Hz/CPM/Order with explicit RPM.
Settings and zoom work on the already loaded record and do not cause HTTP calls.
There is no calendar-axis replacement or server fetch on zoom.

For a Time Domain summary, time-domain-display.ts uses the server's full-record
statistics/count and exact compatible unit scaling. It lifts the pen at breakBefore
and labels the summary. It never computes new statistics from extrema or applies
calculus to them. If another Quantity is selected, the chart explicitly retains
and labels the available response Quantity, with an informational explanation.

For a Frequency Domain summary response, the existing Metronic error alert says
FFT cannot be calculated from summary data and raw waveform samples are required.
Discontinuous or fewer-than-three-point raw responses also show an FFT input error.
These are explicit frontend errors, as requested by the user on 2026-10-25.
They do not trigger extra HTTP reads or numerical processing of extrema.

The raw mapping requires representation=raw, all original points present, no
reported gaps or internal breakBefore markers, and at least three samples. Quantity
and unit come from the actual response and remain explicit for the existing SI
conversion functions. The HTTP adapter preserves each returned X/Y value and the
response timeOriginUtc without rounding, repetition, resampling or client capping.
The raw numerical modules/formulas and chart axes remain unchanged.

## File organization

- vibration-api.service.ts: bounded cancellable HTTP reads and native/display discrimination.
- core/models/vibration-api.model.ts: backend DTOs and display-only record type.
- time-domain/: existing raw time mathematics/workers, plus the separate summary display adapter.
- frequency-domain/: existing FFT mathematics, FFT-only resampling/windowing and workers.
- shared/components/vibration-*-domain-chart/: existing charts and minimal data-lifecycle adaptation.

The numerical pipeline below applies ONLY to native raw analysis records.

## Numerical pipeline

All time-signal functions are separate pure TypeScript functions under `time-domain/`.
No math is embedded in page/chart components. All analyses start from the raw
record, never from an earlier unit/quantity display or a downsampled waveform.

1. `prepareTimeDomainRecord`: validate and normalize time to seconds and amplitudes
   to SI (m, m/s, m/s²), once per immutable source record.
2. `convertTimeDomainQuantity`: all nine source/target pairs use the physical
   relations `v = dx/dt`, `a = dv/dt`; up to two derivative/integral stages.
   The resulting SI arrays are cached by target quantity (at most three).
3. `differentiateSignal`: second-order three-point Lagrange differences, including
   one-sided endpoints, using actual nonuniform timestamps. Successive derivatives
   implement displacement → acceleration. Differentiation amplifies noise,
   especially when timestamps have been rounded. No hidden filter or invented
   sensor bandwidth is applied.
4. `integrateSignal`: cumulative trapezoidal integration using every actual time
   interval, with an explicit initial condition when used directly.
   The quantity converter uses `integrateDynamicSignal`: remove the time-weighted
   record mean before integration, integrate, then center the integrated result;
   repeat for acceleration → displacement. This defines **AC dynamic motion**.
   It does not recover physical initial position/velocity, static components or
   sensor drift. Incomplete cycles and low-frequency noise affect integrations.
   No arbitrary high-pass cutoff is guessed. A real instrument's bandwidth,
   filtering and calibration require an explicit acquisition specification.
   `detrendSignal` is a separate least-squares utility; it is not silently applied.
5. `unitToSi` / `convertTimeDomainUnit` / `scaleSignal`: exact dimensional factors,
   including 1 inch = 25.4 mm, 1 mil = 0.001 inch, standard gravity 9.80665 m/s².
6. `calculateTimeDomainStatistics`: full-record **sample RMS** `sqrt(sum(y²)/N)`,
   absolute zero-to-peak `max(abs(y))`, peak-to-peak `max(y)-min(y)` and mean/min/max.
   RMS includes DC when present in the selected signal. The sample RMS definition
   is explicitly sample-weighted (not a continuous-time quadrature estimate).
   A scaled sum-of-squares avoids squaring overflow for ordinary finite inputs.
7. `selectTimeDomainAmplitude`: selects the measured RMS/0p/pp scalar. Changing
   Amplitude recomputes/selects record statistics; it **does not multiply the time
   samples** by √2 or 2. Those factors describe individual sinusoids, not arbitrary
   time records. Axes/tooltips show instantaneous physical values and the chosen
   amplitude statistic is shown inside the chart and in the point tooltip.
   `timeDomainAmplitudeReference` supplies symmetric +/-RMS or +/-absolute-peak
   levels, or the actual minimum/maximum for pp. These are full-record reference
   levels; pp's displayed value remains max-minus-min. The waveform retains its
   instantaneous values. A compact wrapping footer shows full-record Min/Max
   with the selected unit and two-decimal display, alongside the total sample
   count. It reuses the result statistics without another pass over the data;
   zoom does not change the full-record extrema.
8. `timeDomainAxis`: Time only, normalized to seconds. CPM/Order belong to a
   frequency analysis with its actual speed metadata, not to a time record.

These are documented numerical approximations, tested against analytical signals;
they do not claim ISO instrument compliance or replace acquisition calibration.
Future parameters should add a named pure stage here and become part of the
worker request/cache key, preserving source metadata and raw samples.

## Runtime and verification

Existing reference-counted worker sessions, bounded numerical caches, fallback,
OnPush notifications, 16 ms selector coalescing, stale-result guards and cleanup
remain. Raw points/statistics retain numerical precision; only display labels use
two decimal places. Sample counts remain integers. Summary statistics are server
statistics over the full original interval, never recalculated from reduced points.

Tests cover real Angular/Select2/ECharts interactions, both API stages, UTC/ranges,
shared point budgets, native units and values, summary-only successful reads,
no FFT/calculus on extrema, cancellation/retry, first-Apply gating, unchanged
frontend formulas, theme/responsive behavior and large isolated worker workloads.
See the latest dated agent.md maintenance entry for executed results and live-test limits.

## Method references

- [Brüel & Kjær: Measuring Vibration, quantifying vibration level](https://www.bksv.com/doc/br0094.pdf)
  — RMS/peak/peak-to-peak are measurements of a time waveform; reference levels
  visualize the selected measurement while preserving instantaneous samples.
- [MathWorks: integration of numeric data](https://www.mathworks.com/help/matlab/math/integration-of-numeric-data.html)
  — trapezoidal integration of sampled velocity with actual timestamps.
- [MathWorks: numerical gradient](https://www.mathworks.com/help/matlab/ref/gradient.html)
  — central differences and coordinate-spacing dependence; our endpoints use
  second-order one-sided Lagrange differences.
- [Brüel & Kjær Sound and Vibration Handbook](https://www.bksv.com/downloads/svpockethandbook/index.html)
  — RMS/peak definitions and sinusoidal displacement/velocity/acceleration
  relations; sinusoidal amplitude ratios are not arbitrary waveform conversions.
- [NIST SI conversion factors](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9)
  — unit factors and standard gravity.

## Available calendar days (2026-10-25)

TimeAvailabilityService calls GetAvailability for the selected IDs before date
confirmation. The connected vibration-date-time-range wrapper enables only proven
commonRanges through native Flatpickr rules, initially disabling all days. Calendar
labels keep their day meaning and exclusive To; no UTC conversion applies to this
metadata. Unknown months are queried on navigation and failed reads remain closed
to selection with Retry. Metadata reads do not trigger waveform/analysis loads.
Hours/minutes keep their existing behavior, as explicitly requested by the user.
