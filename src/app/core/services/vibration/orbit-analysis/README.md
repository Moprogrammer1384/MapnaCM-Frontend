# DARP Orbit Analysis

Updated 2026-11-09. Orbit reads authenticated backend acquisitions and calendar metadata. No frontend acquisition files, fallback data or browser persistence.

## Workflow and ownership

- `/cm/vibration/orbit-analysis` is registered immediately after Bode in `VibrationModule` and the sidebar. The page uses the existing `AnalysisWorkspaceComponent`, closable tabs and discrete acquisition selection. Orbit has no editable date/time range or Apply.
- Execute requires exactly one X and one Y measurement per Component, within one Asset. Multiple complete bearing pairs are supported. X/Y are identified automatically by unambiguous standalone name tokens, independently of selection order. Missing, duplicate or ambiguous axes keep Execute disabled; no separate probe-role selector or assignment state exists. Physical synchronization is validated on the acquired record by both backend and frontend.
- The generic drawer accepts an optional `executionValidator` callback and has no Orbit dependency. Layout enables the same pair validation for Orbit and Rotor Position; the service checks the same rule again before creating a tab.
- `controlsContent` projects `OrbitAnalysisControlsComponent` into `app-analysis-panel`, below the date/time input and before chart content. All display selects are available before Apply. The drawer retains its existing Plant selector and measurement checkboxes.
- `VibrationSelectionService` keeps immutable pairs/settings per tab. Settings are shared by the bearing charts in that tab. Visited tabs retain chart instances and scale; route navigation retains tab data/settings but remounts the charts, following the existing workspace lifecycle.
- `shared/components/vibration-orbit-chart/` renders two ECharts hosts side by side at Bootstrap `md` and above, stacked on smaller screens. It cancels superseded reads, ignores stale results, preserves instances on settings/theme changes and disposes subscriptions/observers on destruction.

## Stored acquisition selection

**2026-11-08:** Date filters the existing Event time dropdown to separate captures on the chosen day. Event identity includes periodStart and capturedAtUtc; selecting one sends CapturedAtUtc to Get. Availability intersects exact pair/period/capture instants across selected pairs. Complete uniform captures may have variable durations, including less than one second, with duration matching count/rate. Event labels identify the actual capture. User-authorized Orbit-only backend/schema/data changes are applied and verified; there are no new UI controls.

The standalone [OrbitAcquisitionPickerComponent](../../../../shared/components/orbit-acquisition-picker/orbit-acquisition-picker.component.ts) owns daily discovery, optional date filtering, exact event selection, cancellation, cache and retry. The Acquisition period selector and cadence state/output were removed on 2026-11-09. It reuses Bode's Date (col-md-4) and Event time (col-md-8) row; mobile stacks them. Changing probe pairs resets date filtering. Each day can retain several separate event times. There is no range, editable hour/minute, Apply or latest fallback.

Only Daily is accepted by frontend validation, backend enum/domain/query rules and the database constraint. The existing period/periodStart fields remain as Daily/date identity for compatible API reads. No selectable period state remains in Analysis tabs.

ORBIT_DATA_SOURCE resolves to api/VibrationOrbitAnalysisApiService. GET /OrbitAnalysis/Get takes XMeasurementId, YMeasurementId, Period and PeriodStart (yyyy-MM-dd); the frontend also sends CapturedAtUtc for an explicitly selected event. The backend resolves that exact instant and rejects an ambiguous period-only read. The frontend checks the returned record's selected instant. It never requests From/To or combines captures. UTC capture start/finish describe the immutable recorded duration, not a query window; input arrays, clock/channel metadata, µm displacement, rate/count, nullable received speed, voltage samples and counter-edge timestamps come only from the API.

VibrationOrbitAnalysisAvailabilityApiService independently reads GET /OrbitAnalysis/GetAvailability with repeated MeasurementIds and Period, without calendar-window bounds or the Time Domain availability contract. Metadata includes stored pair IDs, periodStart, capture bounds, sample count/rate and identity. The adapter intersects exact requested X/Y pairs and period keys. Only proven common acquisitions enable calendar dates and event choices; bounds never create missing dates. Empty/failed/loading metadata blocks event selection, with Retry on failure.

Current local backend history (verified 2026-11-09) contains **456 Daily captures / 1183968 points / 456 reference channels / 2052 pulses**, across three pairs and 92 dates (2026-08-04 to exclusive 2026-11-04). Each pair retains 152 captures, including multiple 10:00/13:00/16:00/22:00 Tehran events on some days. Rates and subsecond durations are unchanged. At the user's explicit request, 78 non-daily captures and their dependent rows were backed up and removed transactionally. SHA-256 over every retained Daily header/point/reference/pulse matched before, after and on independent committed readback; Time Domain/Bode counts remained unchanged. See backend `artifacts/orbit-analysis/daily-only-verification-2026-11-09.json` and the flushed `pre-daily-only-2026-11-09.json` backup. Historical migrations/backups remain intact.

Explicit offline development authoring varies shape, scale, orientation, rate and duration. Direct traces have 2–5 expanding turns rather than 50 repeated identical revolutions. This is authored development input, not a runtime display transform. A fitted single-order trace is inherently periodic and remains unchanged. Source authoring lives only in the backend tool. The previous 327 generated one-second frames were checked against their original values, fully backed up and replaced atomically; unrelated Time Domain/Bode data stayed unchanged. Test vectors remain outside the application graph.

## Mechanical interpretation and calculations

| File | Responsibility |
| --- | --- |
| `orbit-probe-pairing.ts` | Validate same-bearing X/Y selection and resolve roles |
| `orbit-data-source.service.ts` | Injectable data-source contract/token, backed by the Orbit HTTP adapter |
| `orbit-capture-selection.ts` | Validate cadence/date identity without creating acquisition inputs |
| `orbit-acquisition-validation.ts` | Validate received metadata, synchronized channels, counts, units, quality and capture boundaries |
| `orbit-signal-preparation.ts` | Remove mean and convert compatible displacement units |
| `orbit-point-interpolation.ts` | Interpolate reference positions from existing displacement samples |
| `orbit-keyphasor.ts` | Validate pulses, interpolate unwrapped shaft phase, locate reference markers |
| `orbit-order-filter.ts` | Extract arbitrary positive fractional/integer nX by least squares |
| `orbit-analysis.ts` | Compose the pipeline and compute displayed statistics |

For a direct AC orbit, `xAC[i] = x[i] - mean(x)` and similarly for Y; disabling mean removal displays the original coordinates. The UI offers only µm/mm (2026-11-09); the current API contract declares native µm only. Existing µm/mm/mil/in conversion factors remain available in the numerical layer for supported source data. An orbit uses instantaneous displacement, so no RMS/peak sine multiplier is applied.

Between pulses `tj` and `tj+1`, unwrapped shaft phase is `theta(t) = 2π[j + (t-tj)/(tj+1-tj)]`. Order analysis uses only samples between valid references and never extrapolates shaft phase. Missing/invalid Keyphasor, or fewer than two pulses, keeps the direct orbit and both charts visible, with an explanatory notice if order filtering was requested. `analysis.filter` records the actual applied filter so tracking and legends stay accurate. The display toggle hides reference markers without removing the reference used for filtering.

For requested order `n`, fit `z(t) = c + a*cos(n*theta(t)) + b*sin(n*theta(t))` independently to X and Y using a pivoted 3×3 normal-equation solver. Reconstruct only the sine/cosine terms. The DC term is a nuisance parameter and is excluded from the filtered orbit. This is a finite-record order-component extraction, not an ideal infinite-duration bandpass. Nearby/nonperiodic components can leak into a short record. It retains relative X/Y phase and supports subsynchronous and higher harmonic orders without rounding n.

Presets are Direct, ⅛X, ¼X, ⅓X, ½X and 1X–10X. Custom nX covers other positive orders; availability depends on the acquisition. Require at least one complete selected-order cycle, at least four supported samples, nonsingular phase coverage and consecutive selected-order phase increments below π (Nyquist). Available upper orders depend on the stored timestamps and pulse intervals. Invalid/insufficient input produces a recoverable message rather than a misleading trace.

The position host now displays the original processed X/Y coordinates as circular scatter markers on a square Cartesian grid, matching Rotor Position's marker/axis appearance (2026-11-09). Equal engineering ranges and pixel dimensions preserve orbit shape. This replaces only the former polar rendering; signal preparation, order filtering and measurements are unchanged. The companion waveform uses the same processed X/Y and timestamps, with Keyphasor reference lines at the corresponding times. Keyphasor markers use interpolated positions on the displayed trajectory. `X pp = max(x)-min(x)`, similarly Y; maximum radius is `max(hypot(x,y))`, not an ISO severity limit or Smax substitute. Only displayed labels are rounded to two decimals.

The workbook does not specify probe mounting angles, machine viewing direction, shaft rotation, clearance or slow-roll runout. The UI uses its provided orthogonal X/Y display frame. No machine-frame rotation, clearance circle, fault diagnosis, runout compensation or severity threshold is fabricated.

## Following individual samples

The blue orbit points support mouse/touch and keyboard sample tracking. Hovering near the chronological trajectory selects a sample; clicking anywhere inside the plot selects the nearest recorded sample and focuses the interactive chart without scrolling. Pixel projections are cached until data, scale, zoom/pan or chart dimensions change. Overlapping revolutions retain the nearest chronological branch on hover ties. The selected sample has a persistent warning-colour ring, a time/speed/X/Y readout and synchronized X/Y markers plus a time reference in the companion waveform. Both X/Y views use the same bounded, pointer-anchored wheel, independent pan/pinch and double-click/`0` reset interaction. These helpers live beside the presentation defaults; the separate chart components remain in place.

With the chart focused, Right/Down advances one sample and Left/Up goes back one; Home/End select the first/last sample. Holding an arrow uses the browser's normal key repeat. Navigation stops at the acquisition boundaries and does not wrap or reinterpret the orbit's spatial angle as time. Keyboard handling is local to the focused plot; other page controls retain their keys. The cursor is independent of Keyphasor and remains usable with reference marks hidden.

Tracking updates only dedicated cursor series through the public ECharts API; it does not rerun numerical analysis, refetch data, recreate charts or change the measured samples. Selected time survives compatible unit/filter changes and visited-tab switches. A new acquisition selects its first sample immediately. The visible readout uses exactly Rotor Position's definition-list structure, label/value typography, spacing and alignment below the plots and above the footer. Waveform hover selects the closest time sample too. Component-owned ZRender listeners are removed on replacement/destruction; the existing shared ECharts host continues to own chart creation/disposal. See `shared/components/vibration-orbit-chart/orbit-point-tracking.ts` for screen-space hit testing.

## References reviewed

- [ISO 20816-1:2026 official scope](https://committee.iso.org/standard/89921.html): includes radial shaft vibration and machine-dependent evaluation. The public scope was reviewed; this UI does not claim certification or apply unspecified machine limits.
- [Siemens Simcenter Orbit Plots](https://community.sw.siemens.com/articles/en_US/Knowledge/Orbit-Plots): paired probes, AC/DC displacement, reference marks and direct versus order-filtered orbits.
- [Dewesoft Orbit Analysis manual](https://manual.dewesoft.com/x/setupmodule/modules/machinery/orbit-analysis) and [solution manual](https://downloads.dewesoft.com/manuals/dewesoft-orbit-analysis-manual-en.pdf): separate rotational reference, harmonic/subharmonic extraction and Orbit configuration.
- [Original ECharts polar line reference](https://echarts.apache.org/examples/en/editor.html?c=line-polar): historical rendering reference; current X/Y scatter rendering does not use its coordinate system or demonstration data.

## Validation

App/template and test TypeScript compilation passed. HTTP and real-browser workflow coverage includes exact period identity, complete variable-duration input, wrong-pair/incomplete/mismatched-period rejection, null/absent Keyphasor, direct fallback, proven capture dates, drawer gating, immediate selection, route resolution, settings retention, mouse/arrow tracking and chart cleanup. Live authenticated API reads and full backend seed verification passed. Final build/lint results are recorded in `agent.md`.

The statistics footer shows X/Y pp, maximum radius and RPM on the left; a separate
lower right row shows native captured-at time then original sample count, never
the filtered point count. The blue/orange signal palette resets per analysis;
selecting another Asset never changes that analysis's primary colour.
