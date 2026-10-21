# DARP raw vibration processing

Time Domain now reads the user's Book1 X-direction record through
`RAW_VIBRATION_DATA_SOURCE`, rather than synthesizing a waveform. The other analysis
pages retain their existing synthetic previews; no FFT/API results are implied.

## File organization

```text
vibration/
  raw-data-source.service.ts          Raw source interface, injection token and sample adapter
  time-domain/
    time-domain-preparation.ts       Time-record validation and SI normalization
    time-domain-quantity-conversion.ts  Quantity conversion using time derivatives/integrals
    time-domain-calculus.ts          Derivatives, integrals, mean removal and detrending
    time-domain-statistics.ts        Full-time-record statistics and amplitude selection
    time-domain-unit-conversion.ts   Unit conversion of time-signal samples
    time-domain-preprocessing.spec.ts
    time-domain-amplitude.ts         Selected amplitude's numeric reference levels
    time-domain-analysis.ts          Time-axis validation and Time Domain result assembly
    time-domain-analysis.spec.ts     Time Domain numerical analysis tests
    time-domain-analysis.service.ts  TimeDomainAnalysisService, sessions and result cache
    time-domain-analysis.service.spec.ts
    time-domain-analysis.worker.ts   Background Time Domain message handling
```

Organization follows the **domain of the data being analyzed**, as specified by
the user. Every operation on a time record belongs to `time-domain/`, including
preparation, quantity calculus, sample-unit conversion and RMS/peak statistics.
The parent folder holds only domain-independent infrastructure such as raw-data
retrieval. Future FFT/frequency-spectrum analysis belongs to `frequency-domain/`;
any preprocessing performed on time samples still belongs to Time Domain even
if its output will later feed an FFT. The existing frequency-page sample preview
does not implement an actual raw-data FFT, so no empty service folder is added.
The worker entry URL points to the colocated `time-domain-analysis.worker.ts`.

## Source and later API wiring

- `assets/data/vibration/book1-x.json` preserves all 40,960 numeric Time/Value
  observations from `Book1.xlsx`, sheet `X direction`, `A2:B40961`. It is loaded
  lazily over HTTP, outside the JS bundle; one shared replayed load serves charts.
- For the requested larger sample, the fixture adapter repeats this record
  **10 times total**, yielding **409,600 points**. Expansion uses preallocated
  arrays once before `shareReplay`; subsequent loads/settings reuse that raw
  object. The HTTP asset stays at its original size. No API data is repeated.
- Time is **milliseconds**, confirmed by the user on 2026-10-21. The last sample
  in the original is 2499.94 ms. Copies start every 2500 ms, continuing the
  timestamps through **24999.94 ms** without duplicates at joins. Small
  0.06/0.07 ms spacing variations are preserved within each copy. Values repeat
  exactly without smoothing at joins; resulting derivative transients are part
  of this repeated performance fixture, not additional sensor observations.
- Source quantity **Displacement**, amplitude unit **µm** are an explicitly
  user-authorized sample assumption, not verified sensor metadata. This remains
  in source metadata/documentation. Quantity/unit cannot be inferred from numeric magnitudes.
- `SampleVibrationDataSource` adds this metadata to the imported observations.
  It deliberately serves the same sample for any selected measurement/date
  range. It does not pretend those dates filter a workbook without timestamps.
- `RawVibrationRecord` is the frontend domain model: immutable time/value arrays,
  quantity tag (`displacement` / `velocity` / `acceleration`), explicit amplitude
  unit and time unit, plus identity/label. Time and values have equal lengths;
  timestamps must be finite and strictly increasing. Missing/non-finite samples,
  incompatible source units and unknown source tags are errors, not filled zeros.
- For an API: implement `RawVibrationDataSource.load(request)` and override the
  `RAW_VIBRATION_DATA_SOURCE` provider. Map the **agreed backend response** into this
  domain model, including real quantity/unit/time metadata. The existing request
  carries measurement ID and local from/to date-times. No endpoint, server
  schema, timezone conversion, or database/storage implementation is introduced.
  API adapters must return a new immutable record object when data changes.
- Time Domain initializes each new tab's Quantity/Unit from the arriving record.
  Subsequent user settings remain independent per tab and route. There is no
  new persistent browser storage.

Reimport read-only numeric observations from the original workbook:

```powershell
powershell -NoProfile -File tools/import-vibration-workbook.ps1 -WorkbookPath <Book1.xlsx>
```

The workbook is not modified. The script accepts only numeric time/value cells;
document strings are never treated as instructions.

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

## Runtime and performance

- User display policy: measurements show **two decimal places**, through the
  presentation-only `analysis-number-format.ts` helper. Tooltip values, axis/
  pointer labels, amplitude annotations and slider details format text only.
  Raw/Float64 data, statistics, cached results, chart coordinates and reference/
  axis/zoom bounds retain full precision. Sample counts remain integers.
- `TimeDomainAnalysisService.acquire(raw)` shares a worker/session across charts
  using the same source object. Raw data is posted once; numerical work runs in a
  module Web Worker, outside Angular. Numerical stages are O(N), Float64, with no
  FFT dependency. Worker responses transfer time/value buffers rather than copy.
- At most three quantity arrays and six display-result promises are cached per
  active record. Identical concurrent analyses share the same promise. Releasing
  the final consumer terminates its worker and drops caches; tab close/navigation
  also dispose charts, subscriptions, timers and theme observers.
- Without worker support, the same functions run in a scheduled main-thread
  fallback. This preserves numerical behavior; background responsiveness then
  depends on record size. Worker failures surface through retry feedback.
- The chart coalesces settings changes for 16 ms and rejects stale responses by
  request version. Full data/statistics are recalculated before ECharts rendering.
  All 409,600 points are passed to ECharts; `sampling: 'minmax'` reduces pixel-level
  drawing work while retaining extrema and supports zooming into full data.
- Chart updates merge data/options into the existing ECharts instance so zoom is
  retained. Theme updates reuse existing analysis/points without running math.
  Amplitude-only changes recompute the full-record statistic and reuse unchanged
  plotted points. The merged ECharts update contains only reference lines,
  tooltip and Y-axis bounds; it does not resend the 409,600-point series array.
  Reference styles use Metronic warning/body tokens and follow theme updates.
  Metronic supplies every form, loading, error, button and chart color token.

## Validation (2026-10-21)

The display-only two-decimal change passed all 42 focused ChromeHeadless tests,
production build and lint. Existing integration cases assert formatted labels
while checking full numerical precision across all raw/chart samples and units.

After applying the user's domain-based classification, all **42 focused
ChromeHeadless tests**, production build and lint passed. Raw retrieval remains
at the parent level; every time-signal calculation and numerical test is inside
`time-domain/`. Public prepared-record/statistics types and computational entry
points now use TimeDomain names. All numerical assertions and worker/chart
behavior remain covered, including 409,600 samples and visible amplitude markers.

The visible amplitude fix passed 19 focused numerical/worker/chart/page tests,
production build and lint. A new real-chart OnPush regression failed before the
fix because no RMS reference existed. It now checks RMS/pp/0p/cached RMS after
single selections, numeric reference levels/label/unit, Metronic color, waveform
preservation, zoom/instance retention and absence of waveform data in the delta.

After the naming/folder refactor, **41 focused ChromeHeadless tests**, production
build and project lint passed. The shared and Time Domain numerical suites are
separate; the earlier combined invalid-input test is now two layer-specific cases.
Validation includes the relocated real worker, fallback/cleanup, 409,600-point
chart, single-selection rendering, dates, Select2, tabs, zoom and theme geometry.

The expanded **409,600-point** fixture passed 17 focused numerical, worker,
chart and page tests, production build and project lint. Tests compare every
repeated raw value with the untouched HTTP asset, check strictly increasing
times and verify all chart conversions against the complete expanded record.
One local measurement of preparation plus 12 numerical analyses took 137.6 ms,
excluding HTTP, worker startup, Angular and chart rendering.

The Time Domain integration tests use automatic Angular change detection beneath
an OnPush ancestor, matching the application root. A single Select2 change must
update the actual ECharts data/axis and visible sample count without forced
fixture refreshes. This reproduced the delayed-render bug before the fix: entering
NgZone on worker completion did not mark OnPush ancestors. The chart now calls
markForCheck for completed analyses (including cached/amplitude-only results),
loading/error updates and theme changes. All three integration cases failed before
the fix and pass afterward; the complete 40-test suite, build and lint also pass.

The original 40,960-point baseline passed production build, project lint and
40 focused ChromeHeadless tests. Tests
cover all nine quantity source/target pairs against analytical waveforms,
nonuniform calculus/endpoints, DC integration policy, all units and true waveform
statistics, real worker execution/fallback/sharing/cleanup, stale results, retry,
the actual workbook asset, all-sample chart conversions, tab defaults/restoration,
zoom, dates, Select2 and Metronic light/dark geometry at 320/768/1280px.
An independent XML-to-JSON comparison verified exact numeric equality of every
imported Time/Value pair with all 40,960 original worksheet observations.

One local ChromeHeadless measurement of **preparation plus 12 full-record
analyses** of the actual Book1 data took **30.8 ms**. This measures numerical
work only, excluding HTTP, worker startup, Angular and chart rendering; it is not
a cross-device latency guarantee. The benchmark is in the Time Domain integration
spec for repeatable measurement. No authenticated API or manual application
screenshot audit was performed. Existing build bundle/CSS warnings remain.

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
