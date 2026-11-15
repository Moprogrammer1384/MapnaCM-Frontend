# DARP Signal Indicators

Route `/cm/vibration/signal-indicators`, directly below Frequency Domain and above
Waterfall. The page uses the standard Vibration measurement Drawer, Execute-created
tabs, shared available-date/time picker, Apply gate, Quantity/Unit controls,
measurement headings and column layout. It does not have a separate dashboard or
measurement selector.

The shared header has an Indicator Select2 with **All / RMS / 0p / pp**; All is
the default for every new tab. All shows the three metrics on one chart. Colours reset per analysis:
blue `#2563EB`, orange `#EA580C` and teal `#0D9488` (user-defined pp colour). The ECharts multiple-selection legend
independently hides/shows curves; wheel/slider zoom, legend choices, chart instances
and visited-tab settings survive theme/unit changes. This page hides only the
shared single-amplitude selector through `showAmplitude=false`; its default remains
true for all existing pages. The feature selector is projected through the generic
`additionalControlsContent` slot, preserving the existing Quantity/Unit controls.

Single-metric modes show one blue curve with editable lower/upper alarm inputs
and two horizontal dashed limit lines. Initial display limits are 90% of the
loaded metric's minimum and 110% of its maximum (a canonical-unit fallback covers
zero-only data). They are editable data-derived defaults, not backend/machine alarm
settings; the field title explains their origin. Empty, non-finite, negative,
equal or reversed limits show inline validation and disable alarm colouring.

Inside or exactly on either boundary, the curve stays blue. Outside the band,
severity is `max(lower-value, value-upper, 0)/(upper-lower)`: yellow fades to orange
over 0–10% exceedance, orange fades to red over 10–25%, and larger exceedance stays
red. Metronic warning/danger and Bootstrap orange tokens supply the alarm palette.
A y-aligned gradient colours the line itself and matching point colours track the
same severity; no observations are modified or interpolated into the data.

Mode and limits live in the owning `AnalysisTab.signalIndicatorSettings`. Limits
are keyed by measurement, physical quantity and metric and stored in SI, so unit
changes preserve the same physical alarm band. Changing modes/limits redraws only;
it does not refetch data or rerun numerical processing. All removes alarm controls,
limit lines and alarm colours, restoring the original three-curve palette.
The user-requested explanatory paragraph below the chart was removed.

The page uses the same root sources as Time Domain:

- `TIME_AVAILABILITY_SOURCE` / `VibrationTimeDomainAvailabilityApiService` calls
  `GET /TimeDomain/GetAvailability` with repeated MeasurementIds. Shared calendar
  code intersects proven common dates, preserves holes and supports month navigation,
  disabled states, errors and Retry. No static date inventory remains.
- `VIBRATION_DATA_SOURCE` / `VibrationTimeDomainApiService` calls
  `GET /TimeDomain/Get` once per measurement and applied range, sending only
  MeasurementId, From and To, with the existing UTC conversion/authentication.
  Backend resolution and point budgets stay authoritative. Settings, units, themes,
  legend visibility and zoom reuse the loaded response without another read.

The former snapshot source/export utility has been removed. Its recorded numerical
reference data now lives only under `src/testing` and is never imported by application
code. No backend, database, API contract or browser storage was added.

Continuous raw records use `TimeDomainAnalysisService` and its existing worker,
quantity calculus, unit conversion, cache and release lifecycle. Each 60-second
window uses all its actual converted samples, including a partial last window.
RMS includes DC, 0p is the
maximum absolute sample, and pp is maximum minus minimum. There are no sine-wave
multipliers, interpolated values or fabricated windows. Footer statistics use the
entire selected record; plot points use their individual windows. Only displayed
numbers are rounded.

For statistical-envelope/discontinuous responses, existing server `buckets`
provide their native sample count, interval and RMS/peak/extrema statistics.
The frontend scales compatible units and uses those statistics directly, never
recalculating RMS from envelope min/max points. Original acquisition counts remain
in the footer. Nullable pp uses max-minus-min. Series/bucket gaps stay disconnected
with visible markers. The existing response bucket fields were verified against
`ChartDtos.cs`/`SignalStatistics`; adding their optional frontend types changes no API.

As on Time Domain, summary data cannot provide physical quantity calculus. The
native quantity is retained with a visible explanation; compatible units still work.
If an older host supplies only full-range statistics, one full-range summary point
is shown, without inventing per-window values. Loading/error/Retry, canceled HTTP
reads, stale calculation guards, theme/zoom preservation and worker disposal are
owned by the reusable chart.

Validation covers independent direct statistics for the recorded reference inputs,
HTTP date discovery, exact range query parameters, real Drawer/Execute/Apply,
raw conversion and summary bucket handling, error/Retry and request cancellation,
simultaneous curves/colours, legend toggles, units, retained zoom/tabs and cleanup.
The shared-panel suite checks that other pages retain their amplitude controls.
See `agent.md` for final validation and manual acceptance status.
