# DARP vibration data and processing

Updated 2026-11-22. Time Domain and Frequency Domain share
`VibrationTimeDomainAcquisitionApiService` for exact offline captures. Time
Domain also uses it for recent online data. Signal Indicators use the range-based
`VibrationTimeDomainApiService`. HTTP adapters are grouped in
[api/](api/README.md), with explicit Vibration/feature/purpose names.
The old Time/Frequency workbook fixture and tenfold repetition were removed.
Overview has no chart. Rotor Position uses recorded DC acquisitions through its
own API adapter; see [Rotor Position](rotor-position/README.md).
Waterfall is frontend-only with an isolated mock source and sequential FFT
snapshots; see [Waterfall](waterfall/README.md). It introduces no backend endpoints.
Bode Analysis uses its
separate BodeAnalysis API and database entities, with discrete event selection;
see [Bode methods and source](bode-analysis/README.md).
Synthetic Time/Frequency workload data exists under src/testing/ for regression tests.

## Data access and selection

The active backend contract is docs/Vibration-TimeDomain-API.fa.md (seconds version).
API time coordinates are in seconds. Time Domain Offline and Frequency Domain
use `GetCaptureAvailability` to list common captures. Date filters that list,
and Event time loads all selected channels in one `GetCaptures` request.
Time Domain Online loads all selected channels in one `GetRecent` request.
An empty start date uses the latest stored seconds. The optional Tehran date
and minute picker uses the shared online bounds from `GetCaptureAvailability`.
Display requests the chosen number of seconds forward from that start by sending
`EndedAtUtc` as the exclusive UTC end. Clearing the start returns the form to
latest mode. The form checks that an anchored request fits in the common window
and the server's duration limit.
Signal Indicators use one `Get` request per measurement and applied UTC range.

The API returns all requested raw samples up to 1,000,000 per measurement, inclusive.
If any measurement exceeds its limit, the request returns a business error.
The frontend submits the selection and
shows the API's message if the request fails. Reported gaps or insufficient
raw input prevent FFT. Complete contiguous points map to the existing workers.

Exact capture requests use the server's `SourceKey`. For range requests,
`HttpParams` carries the measurement ID and explicit UTC ISO timestamps.
`From` is inclusive and `To` is exclusive. Both adapters use
`environment.apiUrl` and the JWT interceptor. Errors show the message and
offer Retry. Replacing a selection or closing its tab cancels pending reads.

## Preserve vibration meaning and the existing charts

Time Domain displays a numeric Time (ms) axis, instantaneous physical waveform and
acquisition footer. Offline mode adds RMS, 0p and pp trends. Frequency Domain keeps FFT, resampling/windowing,
Fourier quantity conversion, units/amplitudes and Hz/CPM/Order with explicit RPM.
Settings and zoom work on the already loaded record and do not cause HTTP calls.
There is no calendar-axis replacement or server fetch on zoom.

The raw mapping requires representation=raw, all original points present, no
reported gaps or internal breakBefore markers, and at least three samples. Quantity
and unit come from the actual response and remain explicit for the existing SI
conversion functions. The HTTP adapter preserves each returned X/Y value and the
response timeOriginUtc without rounding, repetition, resampling or client capping.
The raw numerical modules/formulas and chart axes remain unchanged.

## File organization

- api/: named HTTP adapters for Time/Frequency data, Bode data and each feature's availability.
- core/models/vibration/vibration-api.model.ts: backend DTOs and display-only record type.
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
7. `selectTimeDomainAmplitude` reads the measured RMS/0p/pp scalar from the
   record statistics. The waveform tooltip pairs the default full-record 0p
   with the instantaneous physical value. The Y axis uses the measured bounds
   and amplitude extent. A compact wrapping footer shows full-record Min/Max
   with the selected unit and two-decimal display, alongside the total sample
   count. It reuses the result statistics without another pass over the data;
   zoom does not change the full-record extrema.
8. Time Domain uses prepared sample times in seconds for analysis and converts
   them to milliseconds for chart coordinates.
   The redundant `timeDomainAxis` selection/validation helper was removed on
   2026-11-09 with the Time Domain X-axis selector. CPM/Order remain Frequency
   Domain choices, using its actual reference speed.

These are documented numerical approximations, tested against analytical signals;
they do not claim ISO instrument compliance or replace acquisition calibration.
Future parameters should add a named pure stage here and become part of the
worker request/cache key, preserving source metadata and raw samples.

### Offline amplitude trends

The lower plot uses the displayed quantity and unit of the same raw waveform.
`time-domain-amplitude-trend.ts` measures 100 ms windows with a nominal 50 ms hop.
At 2560 Hz each window contains 256 samples and the regular hop is 128 samples.
The last full window ends at the last observation. A capture shorter than one
window produces a single point from all its samples. Each point is plotted at
the window centre and its tooltip shows the first and last contributing times.

RMS is `sqrt(sum(y²) / N)`, 0p is `max(abs(y))`, and pp is `max(y) − min(y)`.
The worker measures each directly from that window and preserves any DC in the
displayed waveform. The waveform and the three curves share the Bode-style
zoom and cursor. The Time Domain controls omit the Amplitude selector. [SKF vibration guide](https://www.skf.com/binaries/pub12/Images/0901d196802179ea-JM02001_Introduction_Guide_to_Vibration_Monitoring_2017_tcm_12-312756.pdf) · [MathWorks windowed RMS](https://www.mathworks.com/help/dsp/ug/energy-detection-in-time-domain.html)

The lower plot's series colours are blue for RMS, orange for 0p and teal for
pp. The waveform uses a 2 px blue line in both Online and Offline modes.

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

VibrationTimeDomainAvailabilityApiService calls GetAvailability for the selected IDs before date
confirmation. The connected vibration-date-time-range wrapper enables only proven
commonRanges through native Flatpickr rules, initially disabling all days. Calendar
labels keep their day meaning and exclusive To; no UTC conversion applies to this
metadata. Unknown months are queried on navigation and failed reads remain closed
to selection with Retry. Metadata reads do not trigger waveform/analysis loads.
Hours/minutes keep their existing behavior, as explicitly requested by the user.

## Orbit Analysis

The independent [Orbit pipeline](orbit-analysis/README.md) owns paired-probe validation, received acquisition validation, Keyphasor reference and fractional/integer order extraction. HTTP adapters in `api/` read `/OrbitAnalysis/Get` and `/OrbitAnalysis/GetAvailability`. The page retains the shared workspace/ECharts and selects an exact stored Daily acquisition, including variable/subsecond durations through the independent Orbit date component. Orbit never sends a From/To waveform range. No Orbit reference data or runtime generators remain in the frontend.
