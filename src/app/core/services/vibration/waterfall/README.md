# Waterfall — DARP

Route `/cm/vibration/waterfall`, below Rotor Position. Existing taxonomy, tabs,
Select2/Flatpickr and Metronic/ECharts behavior remain in use. Date is optional;
blank Date lists all exact common events. State filtering uses API metadata.
Displayed times are Tehran `YYYY-MM-DD hh:mm:ss AM/PM · EventType`.

`WATERFALL_DATA_SOURCE` defaults to `VibrationWaterfallApiService` in `../api/`.
No executable mock source, signal generator, fallback or browser storage remains.
Test fixtures live under `src/testing` and are explicitly provided by tests.

- `GET /api/v1/Waterfall/GetAvailability`, repeated `MeasurementIds` (1–16,
  same Asset): exact shared event IDs/type/UTC bounds/hasSpeed. History intersects
  identities across channels, never dates alone. No chart fetch on date filtering.
- `GET /api/v1/Waterfall/Get?AcquisitionEventId=…&MeasurementId=…`: full original
  native frames and sample-rate/count/profile metadata. Successful null means no
  capture; HTTP/business/invalid-data failures remain errors with Retry.
- Admin ingestion APIs belong to the backend; this analysis page has no input form.

Shared SQL tables are `Vibration.AcquisitionEvent` and `AcquisitionEventPoint`.
Bode/Rotor/Waterfall refer to one clock/RPM trajectory; WaterfallCapture/Frame/Sample
store independent native waveforms. There is no runtime seed. Development signals
are authored in the backend, saved in SQL, and identified in an external provenance
manifest as synthetic rather than field measurements.

The HTTP adapter validates event/channel identities, compatible native quantity/unit,
actual total count, ordered complete frames, finite values and full window bounds.
Limits match the backend: ≤512 frames, 3–65,536 samples/frame, ≤500,000 samples total.
Datetime2(7) fractions and native binary64 values are retained. Within-frame offsets
are sampleIndex/sampleRateHz; elapsed frame time comes from the shared UTC clock.
Unknown RPM stays null, distinct from standstill (zero). Gaps remain gaps.

`prepareWaterfall` / `analyzeWaterfall` reuse Frequency Domain's original preparation,
FFT, window/coherent-gain and physical quantity/unit/amplitude functions. Each native
frame is transformed independently in the browser. Resolution and Nyquist use its
recorded sample rate/count. RMS/0p/pp are spectral line amplitudes, not broadband RMS
or PSD. AC quantity conversion excludes DC; CPM = Hz ×60. Only display text is rounded.

The perspective Waterfall/map and linked spectrum retain common scales, selection,
zoom, themes and teardown. RPM depth orders supplied speeds while retaining original
frame identity. SteadyState/unknown-speed events use time depth; missing speed reads
Unavailable. Badges reuse Bode's state classes. There is no order tracking or invented
severity limit. Requests are cancelled on event replacement/destruction.
