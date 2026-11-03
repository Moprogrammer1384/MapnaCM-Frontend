# DARP Bode tracking analysis

Updated 2026-11-03. Bode uses its own database-backed API and the existing Angular
workspace/ECharts plots. No measurement data is stored in the browser.

## Meaning

A rotating-machine Bode display pairs vibration amplitude versus shaft speed
with phase versus the same speed during a run-up/coast-down. Synchronous
tracking normally follows 1X or another specified shaft order. It is not an FFT
of this table or a transfer-function gain in dB. Amplitude peaks together with
phase behavior help investigate resonances; a maximum observation alone is not
a verified critical speed. See the manufacturer's
[STI transient-analysis note](https://www.stiweb.com/v/vspfiles/downloadables/appnotes/trans1.pdf).

The user confirmed RPM and 1X for the source workbook. It contains tracked
velocity amplitude in mm/s RMS with phase in degrees; there is no raw waveform
or tachometer signal here to recompute tracking or establish its phase convention.

## Database integration and event selection

- `BODE_DATA_SOURCE` resolves to `VibrationBodeAnalysisApiService` in
  `../api/vibration-bode-analysis-api.service.ts`. `GET /BodeAnalysis/Get` sends
  only MeasurementId/From/To, with UTC instants and exclusive To. Each response
  contains independent runs; the chart never joins different events into one trace.
- Native quantity/unit, 1X RMS amplitude, phase and EventType come from the API.
  Event badges use Metronic success (Startup), info (CoastDown), danger (Trip)
  and warning (LoadChange). Dataset generation is explicitly simulated.
- `VibrationBodeAnalysisAvailabilityApiService` in `../api/` uses
  `/BodeAnalysis/GetAvailability`. Proven common
  event windows enable blue dates; bounds guide navigation and never fill holes.
- The user requested **discrete event selection**, replacing Bode's range and
  hour/minute fields. `shared/components/vibration-event-picker/` uses Flatpickr
  single-date mode and the existing searchable Select2 adapter. Selecting a time
  immediately loads that event; there is no extra Apply step or inline event list.
  Time/Frequency keep their original range picker and explicit Apply behavior.
- Date is optional and defaults to **all dates**. Its cross icon clears only the
  date filter, restoring the full searchable Event time list. Choosing an event
  keeps the unfiltered mode; selecting a day narrows the list locally. The chosen
  chart is retained until another event is selected. No textual All dates button.
- Availability discovery initially covers at most 366 days. To make all dates
  complete, the shared availability wrapper fetches uncovered common history in
  bounded metadata requests, deduplicates events and enables selection only after
  completion. Errors expose Retry and keep partial history disabled. Measurement
  changes/destruction cancel reads. Calendar filtering needs no extra waveform read.
- Backend implementation/storage/seed details are in
  `BackEnd/docs/Vibration-Bode-API.md`. Local verification populated six events
  for each of six active measurements (36 runs, 36,360 points) in independent
  Vibration.BodeRun/BodePoint tables. The native profile currently stored for
  these reference acquisitions is now Velocity/mm/s RMS; waveform metadata is separate.
- **2026-11-03 source correction:** first Startup of all six sensors now contains
  the exact 1,020 workbook triples. The later 30 runs follow that same pattern
  with amplitude factors 0.981–1.0195. Existing times/counts/IDs/types/audit remain;
  CoastDown/Trip reverse the source order, and differing counts use interpolation
  (shortest arcs for phase). All Bode profiles match the workbook's native Velocity;
  no physical-quantity conversion is inferred. First-run values and derived arrays
  were independently compared bit-for-bit; a complete pre-import backup is retained.

## Data source

Bode displays only acquisitions returned by the database API. There is no local
data adapter, bundled acquisition dataset, alternate window or restore action
in application code. Workbook ingestion is owned by the backend reference importer.
Automated tests keep their independent source and numeric fixture under
`src/testing/`; those files are never imported by the application.

## Analytical choices

- Preserve the source quantity and phase: its lead/lag sign convention is unknown
  to the user. Quantity is read from each record's metadata and remains readonly;
  native Displacement, Velocity and Acceleration are supported. Do not infer ±90°
  quantity shifts. Adapters declare quantity/unit and supply RMS amplitude in that
  unit. The source workbook declares Velocity; other quantities require their
  own correctly declared incoming records, not reinterpretation of this workbook.
- Unit conversions stay within the native quantity and use the established dimensional factors in
  `analysis-chart-settings.model.ts`. For confirmed single-harmonic 1X data,
  `0p = RMS × √2` and `pp = RMS × 2√2`; these are not broadband waveform conversions.
- RPM is the default speed axis; shaft Hz is RPM/60. This does not change the
  tracked order or reinterpret the axis as a spectrum.
- Wrapped phase uses [0,360), keeps every point visible with a small marker, and
  breaks the trace at wraps instead of drawing a false line across the phase axis.
  Markers preserve isolated points between consecutive wraps. Continuous phase adds/subtracts 360° when
  successive exported angles differ by more than 180°. Unwrapping is a display
  choice; noise and missing acquisition information limit its diagnostic meaning.
- Every observation remains in acquisition order. Stored numbers/calculations
  retain precision; only displayed measured labels/tooltips use two decimals.
- The highlighted/summary peak is the maximum in the selected acquisition,
  independent of zoom, and is labeled Peak rather than Critical speed.

## Architecture and lifecycle

- `core/models/bode-analysis.model.ts`: observations, record metadata and results.
- `VibrationBodeAnalysisApiService` / `BODE_DATA_SOURCE`: database API adapter in
  [the shared API folder](../api/README.md), with no local-data
  fallback. Services stay in core/services/; test doubles stay in src/testing/.
- `bode-analysis.ts`: binds settings to native quantity/unit metadata and performs
  pure display transformations and input validation, separate
  from Time/Frequency numerical processing. No worker is needed for 1,020 triples.
- `shared/components/vibration-bode-chart/`: standalone OnPush ECharts adapter.
  Owns the sensor heading/tag and the opposite event-type badge in one responsive
  header; Bode disables the duplicate workspace heading and preserves its label ID.
  One ECharts instance contains **amplitude above phase**, aligned speed grids,
  shared cursor/zoom, Metronic theme tokens, source/empty/error/retry feedback.
- The page uses the existing `AnalysisWorkspaceComponent`, measurement drawer,
  per-route/per-tab state, closable tabs, date/time picker and chart-column layout.
  New Bode tabs wait for an event selection. Existing selections are preserved
  on return. Unit/amplitude/axis/phase changes transform loaded data without
  reloading the source; selecting an event makes one read per measurement.
  Tab switching retains the chart/zoom; closing unsubscribes and disposes resources.
- `AnalysisDomain='bode'` configures the shared panel's RPM/Hz and phase controls,
  native-quantity lock and RMS default. Source-settings events update the shared
  controls from the first channel after data arrives, including empty intervals;
  each chart retains its own native quantity/unit if a tab contains mixed sources.
  Compatible display choices survive reloads; incompatible old units reset to
  the incoming source unit. Time/Frequency controls retain
  their existing domains and defaults.

Adjacent tests cover calculations, unknown-phase safeguards, all source values and
timeline boundaries, API/native metadata, shared workspace/calendar/Select2/ECharts,
single-click event selection, 1000 options, loading failures/retry, tab retention,
event badges and theme/responsive bounds. Test fixtures do not establish a manual
browser login; real-host authenticated HTTP/SQL integration is tested separately.
