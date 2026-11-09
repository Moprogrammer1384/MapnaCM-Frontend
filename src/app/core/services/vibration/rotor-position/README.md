# Rotor Position — DARP frontend

Implemented 2026-11-09. This is the radial Shaft Average Centerline page, using
the existing Vibration workspace, measurement drawer, preserved tabs, Metronic
controls and ECharts host. Backend/database files and other analyses' numerical
processing are unchanged.

## Acquisition and frontend data source

One event is one independent Startup, CoastDown or Trip acquisition. The same
`VibrationEventPickerComponent` used by Bode supplies optional Date filtering,
searchable Event time, all dates by default and the date-clear icon. There is no
range, Apply, acquisition cadence or merging of separate events. Choosing an
event loads each selected bearing pair once; changing a display setting or zoom
does not read again.

`ROTOR_POSITION_DATA_SOURCE` is a local interface with `listEvents(pairs)` and
`load(pair, eventId)`. Its default is the explicitly separated
`RotorPositionMockDataSource`. It generates **simulated**, pre-averaged,
DC-preserving displacement observations, not measurements from a real turbine.
Each loaded demonstration is visibly marked Simulated data. The catalogue has
three dates (2026-11-03, 06 and 08), each with Startup at 10:00, Coast down at
16:00 and Trip at 22:00. Each record has its own bounds, speed profile and
position trajectory. Trip deceleration is faster than a normal coast down.

This is not a Bode API adapter, an assumed server contract or a fallback after
API failure. Bode amplitudes/phase cannot supply DC position. A future adapter
can replace the token after agreement on the actual data contract; no endpoint,
database change, browser data persistence or dependency is introduced here.
Event `from`/`to` values are local calendar strings for the existing picker;
an eventual adapter must convert server UTC values once at that boundary.

## Selection and ownership

The existing layout binding to `requiresOrbitPairs` now enables its existing
`validateOrbitExecution` callback for both Orbit and Rotor Position. Both use
the exact same `resolveOrbitProbePairs` rules: one unambiguous X and Y per
Component within one Asset. The drawer disables Execute for an incomplete pair,
validates the fresh hierarchy again when executing, and the selection service
also rejects an invalid direct execution. Rotor does not receive Orbit period,
capture or filter state. Sensor names establish pairing only; native quantity
and calibration still belong to acquisition metadata.

`RotorPositionTabStateService` stores event/settings in a WeakMap keyed by the
existing immutable tab snapshot. Switching tabs retains mounted charts/zoom;
route navigation restores selected event and settings and reloads chart data.
Closed/logout tabs are not retained by the new service. The picker and charts
cancel pending subscriptions on input replacement/destruction. Theme observers
and chart listeners are released on destruction. Rotor Position displays one
full-width bearing section per row, without a chart-layout toggle or dependence
on other pages' saved column preference (user decision, 2026-11-09).
Orbit and Rotor Position use the same heading typography and format:
`Bearing 1 · X: X vi508 · Y: Y vi510`, populated from the Component name and
each measurement's name and optional tag. Orbit's separate X/Y subtitle is removed.
Loaded plots follow the bearing heading directly. Subchart titles are
screen-reader-only. A visible definition-list readout follows the plots and
initially shows the first valid sample. Hover/click/arrows update it and the
linked cursor without resetting zoom; hover focuses the interactive group.
The same label/value structure and typography is used by Orbit. A separate
right-aligned lower row shows event start followed by original observation
count. The former capture/averaging description is no longer in the footer.
Centerline/X are blue `#2563EB`, Y is orange `#EA580C`, and speed remains muted;
colours reset inside each analysis, independent of Asset selection order.

## Position semantics

The input model requires synchronized displacement, explicit retained DC,
native unit, averaging interval, probe angles and a calibrated reference.
Observations are already **DC means**, not AC waveform samples or RMS/peak
amplitudes. No averaging of an entire transient, mean removal, high-pass,
integration or order filtering is applied. The source is responsible for
producing validated time-weighted means from raw channels if needed.

For signed probe changes `q1`, `q2` and positive probe-axis angles `a`, `b`,
the pure analysis solves:

```text
q1 = cos(a) * dx + sin(a) * dy
q2 = cos(b) * dx + sin(b) * dy
position = referencePosition + [dx, dy]
```

Angles are counterclockwise from positive machine X in the configured viewing
direction; the source must supply already correct polarity/calibration.
Ill-conditioned probe geometry, unsynchronized/AC-only input, non-finite
calibration and out-of-order/out-of-event times are rejected. Invalid mean
observations are omitted and break the trace. Missing/invalid speed stays null,
so DC position remains usable without Keyphasor or a full revolution.

Bearing-centre reference retains the calibrated DC position. First valid point
is an explicit relative offset and suppresses bearing clearance and the
bearing-relative eccentricity readout. An unknown bearing centre requires this
relative mode. Clearance dimensions are explicitly **radial** X/Y semiaxes in
the record unit; no diameter conversion is guessed. Unit conversion between
The UI offers µm/mm; mil appears only when a measured record declares mil.
Native unit exceptions are scoped per pair/event in the weak tab state and are
removed on capture replacement/failure. Simulated data does not unlock extra
units. The retained µm/mm/mil conversions preserve full calculation precision;
display uses the shared
two-decimal formatter. There are no automatic severity classifications.

## Charts and interaction

The XY chart uses a square pixel grid and equal engineering ranges, including
when resizing or zooming both axes. **All measured position, X/Y mean and speed
observations are scatter points with circular symbols, without connecting
measurement lines** (user clarification, 2026-11-09). Start/End and the selected
position have distinct markers. The optional known clearance outline and cursor
reference lines are auxiliary geometry. The Bearing clearance checkbox is removed;
the existing reference/settings rules still govern the outline. X/Y means
and speed trends share a cursor/zoom and can use time or recorded RPM as their
horizontal coordinate. RPM mode retains acquisition order and never sorts a
coast down into a different time sequence. Invalid/missing spans are not joined.

Clicking anywhere inside the XY plot selects the nearest valid recorded point,
including after zoom/pan; its selected marker, readout and trend cursor update.
No synthetic observation is inserted at an arbitrary click coordinate.
Hover/click a plotted observation or use arrow keys/Home/End in the focusable
position group to update the selected marker and numeric readout. The selected
time/speed/X/Y and, when bearing-centre reference is valid, eccentricity are
linked. Zoom/theme/unit/selection changes preserve the chart instance. A new
acquisition resets its zoom while keeping interaction listeners even for a
synchronous source. Metronic CSS tokens supply all chart colours; page controls
use existing Metronic classes and Select2 integration.

Centerline gesture correction (2026-11-09): X and Y have independent native pan
controllers, so vertical dragging no longer uses the horizontal transform. The
wheel uses normalized pixel/line/page deltas, a small bounded step per animation
frame, pointer anchoring in the rendered grid and a shared 1–20× scale. Native
pinch retains equal bounded axis spans. The square grid disables ECharts' automatic
outer-bound adjustment so changing tick labels cannot move the viewport; the
host initializer fits the first render to its actual container. Hover updates
only tracking series rather than reapplying axes/zoom configuration. Double-click
inside the plot or press `0` in its focus group to reset both position axes;
the trend zoom is independent. No visible instruction row or zoom toolbar was
added. Wheel listeners and pending animation frames are released on destruction.

## Validation

Adjacent Jasmine suites cover numeric DC/reference/geometry/unit/gap behavior,
sample event integrity, picker cancellation/errors/retry, chart ownership and
event identity, real drawer X/Y Execute gating, Bode-style event selection,
tab/route settings, chart zoom and responsive/theme invariants. Existing
Time/Frequency/Bode/Orbit coverage is included in focused regression runs.
See `agent.md` for the final commands/results and remaining acceptance limits.
The earlier [mechanical study](../../../../../../docs/rotor-position-study.fa.md)
describes the engineering basis; its source-status section records the earlier
pre-implementation state.
