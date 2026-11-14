# Waterfall — DARP frontend

Route: `/cm/vibration/waterfall`; sidebar entry immediately after Rotor Position.
Uses the existing taxonomy drawer, single-channel Execute gate, analysis tabs,
measurement headings, event date/time picker and chart column preference. Each tab
retains its exact selected event and `WaterfallSettings` in the layout's memory-only state.
Closing a tab/logout releases its state; no browser persistence is added.

## Data and numerical behavior

`WATERFALL_DATA_SOURCE` is a replaceable frontend interface whose default is
`MockWaterfallDataSource`. No HTTP adapter, endpoint, database or backend contract
is introduced. Existing taxonomy selection still uses the existing integration.
The source remains mock-only. The Mock data/spectrum-count header row was removed
at the user's request; event-type badges and acquisition statistics remain.

`listEvents(measurementIds)` exposes the mock common recording catalogue for
2026-11-01 through 2026-11-14. Every day has one or two SteadyState acquisitions
at 10:00 and optionally 17:00. Some days contain only normal records; transient
days include every recorded Startup/CoastDown/Trip, including two independent
Startup events on selected days, plus at least one normal acquisition. Record
IDs remain distinct even when dates, types or time bounds coincide.

An Event type Select2 before Date filters the supplied mock acquisition states,
with All states as its default. Date is an optional local filter:
without Date, Event time exposes the entire catalogue; selecting a day narrows
the list and clearing Date restores all events. Options show date/time and type.
State and Date filters intersect; neither filter alone requests chart data.
Selecting an event time loads immediately by its exact event ID; it does not edit
bounds or require Apply. Date filtering alone does not load/recompute charts.
Unknown/loading/failed/empty catalogue states disable selection and have feedback
with Retry on failure. Only catalogue-proven dates are enabled in the calendar.

`load({ measurementId, eventId })` generates deterministic velocity frames for
that exact acquisition. Each frame contains 1,024 samples at 512 Hz and covers
two seconds. All frames span the full selected interval: SteadyState 64 seconds
(32 spectra), Startup 180 seconds (90), CoastDown 240 seconds (120), Trip 90
seconds (45). These are synthetic independent frames with constant speed inside
each frame, not a physically continuous simulation of acceleration. Dates are
Tehran wall-clock values, independent of browser timezone. The chart checks the
returned event identity, type and bounds before accepting its frames.

Startup sweeps from 0 to 3,600 RPM; coast down reverses that sweep; Trip has a
faster nonlinear decay and an illustrative transient amplitude increase; steady
state is 3,000 RPM. Standstill frames are valid. Signals have 1×/2×/3× components,
a fixed 72 Hz component and a 1× amplitude enhancement near 2,400 RPM, solely
for demonstrating spectral patterns. RPM is explicit mock metadata, never
estimated from the spectral maximum. Snapshots assume constant speed internally.

`prepareWaterfall` / `analyzeWaterfall` reuse the existing Frequency Domain
preparation, FFT, quantity conversion, unit and amplitude helpers. FFT length
1,024 gives 0.50 Hz resolution and 256 Hz Nyquist; all 513 one-sided bins are
retained at full precision. Hann uses coherent-gain correction. RMS/0p/pp are
**spectral line amplitudes**, not broadband RMS or PSD; AC conversions exclude
DC. CPM is Hz × 60. The UI does not claim variable-speed order tracking and
does not expose an Order axis or invent ISO severity thresholds.

## Presentation and lifecycle

The ECharts host renders either perspective Waterfall traces or a spectral map,
plus a linked selected spectrum. The perspective is a fixed projection of
frequency, amplitude and elapsed seconds/RPM, with real shared scales and no
WebGL dependency. RPM depth sorts observations by their supplied RPM while
selection continues to identify the original chronological frame. Steady
state uses time depth because all speed coordinates would coincide.

Clicking a trace/map cell or using Previous/Next/the native accessible range
selects an existing snapshot. Both plots share the full-capture amplitude scale;
the detail plot has independent frequency zoom. The Metronic palette supplies
surfaces, typography, axes, controls and map ramp; the established blue signal
colour is reused. Theme changes update existing instances and preserve detail
zoom. The feature uses the same Metronic event classes as Bode through
`vibration-event-presentation.ts`: Startup success, CoastDown info, Trip danger;
SteadyState uses primary. The event badge is beside each measurement heading.
Operating condition is immutable acquisition metadata, not a manual setting.
The shared host handles resize/disposal; the feature cancels pending catalogue
and capture reads and releases listeners/theme observers on destruction.
Error/Retry, empty, loading and before-event-selection states are explicit.

Engineering references for the presentation (not a claim of certification):

- [NI: Performing Order Analysis in LabVIEW](https://www.ni.com/en/shop/labview/performing-order-analysis-in-labview-with-sound-and-vibration-so.html)
- [Brüel & Kjær: Order Tracking Analysis, Technical Review 2/1995](https://www.bksv.com/media/doc/bv0047.pdf)

These describe frequency/time or speed-based spectral histories and distinguish
frequency spectra from angle-sampled order analysis.
