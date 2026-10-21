# DARP shared analysis workspace panel

The workspace component, its tests and the sample chart live in
`shared/components/analysis-workspace-panel/`. The nested `analysis-panel/`
folder contains `AnalysisPanelComponent` and its template.

`AnalysisWorkspaceComponent` and `AnalysisPanelComponent` are standalone UI
components for analysis screens in any module. They use shared `AnalysisTab`,
`AnalysisDateRange`, `AnalysisTimeRange` and their change-event types from
`core/models/analysis-panel.model.ts` and do not inject feature services, read
routes or own storage. A consumer can supply a chart or explicitly enable the
existing Vibration sample preview.

The workspace accepts `title`, `tabs` and `activeId`. It emits
`selectMeasurements`, `activeIdChange`, `tabClose`, `dateRangeChange` (containing
`tabId` and `dateRange`) and `timeRangeChange` (containing `tabId` and `timeRange`).
Each tab supplies its own required date/time ranges. The consuming module owns tab creation/removal, active-tab
selection and data loading. A projected `ng-template` receives the active
`AnalysisTab` as its implicit value, allowing each module to render its own chart.

```html
<app-analysis-workspace [title]="title" [tabs]="tabs" [activeId]="activeId"
  (selectMeasurements)="openMeasurements()" (activeIdChange)="activeId = $event"
  (tabClose)="closeTab($event)" (dateRangeChange)="updateDates($event)" (timeRangeChange)="updateTimes($event)">
  <ng-template let-tab>
    <!-- Render this module's chart using tab.selection and tab.dateRange. -->
  </ng-template>
</app-analysis-workspace>
```

`AnalysisPanelComponent` can also be used independently with its required `tab`
input, optional `chartContent` template input and date/time range change outputs.

Alternatively, pass a module-owned `AnalysisWorkspaceState` as `state`. The
workspace reads its title/tabs/active ID and delegates selection, activation,
closing and date/time updates (`updateDateRange`/`updateTimeRange`) to it. When `state` is supplied, its values take
precedence over `title`, `tabs` and `activeId`. Outputs are still emitted as action
notifications; consumers using `state` should not bind them back to the same
methods. No feature-service provider is required by the workspace itself.

All five Vibration pages inject the existing layout-owned
`VibrationSelectionService` and pass it directly to the workspace:

```html
<app-analysis-workspace [state]="state" [showSampleChart]="true"></app-analysis-workspace>
```

`showSampleChart` defaults to false. When enabled, the workspace supplies the
Time Domain sample template and `VibrationSampleChartComponent` from this folder.
It renders one independent sample chart per selected Measurement, titled with
its `Component - Measurement` names followed by the Measurement tag when present
(for example `Bearing 1 - X vi508`). Tags use Metronic's gray-500 text color and
normal font weight to distinguish them from the bold names. The hierarchy path, Sample data badge and
waveform description are not repeated above charts.
Each chart has its own heading ID and zoom state; all inactive charts are disposed.
An icon button above the sample charts toggles between one chart per row (the
default) and two equal columns at widths of 768px and above. Smaller screens
remain single-column. With zero or one Measurement, the button is disabled and
the chart uses full width without changing the saved choice. The root-provided
`core/services/chart-layout-preference.service.ts` shares the preference across
all analysis workspaces and saves `1` or `2` in localStorage under
`darp.chart-layout-columns`. It survives navigation, workspace destruction and
application/browser restarts on the same browser. A missing/invalid preference
defaults to one column; blocked storage falls back to shared in-memory state.
Changing layout preserves chart instances and zoom. This browser preference is
separate from the route-owned tabs/measurement/date/time state, which stays in memory.
Theme changes apply in place and also retain the active tab, ranges, chart
instances and zoom; both sample previews opt into merged ECharts option updates.
A consumer-projected chart template always takes precedence over the sample.

To supply a page-specific chart for each Measurement while keeping these shared
headings and layout controls, pass a `measurementChartContent` template input
with `showSampleChart` enabled. Its implicit value is the Measurement's executed
display snapshot, with the active `AnalysisTab` available as `tab`:

```html
<app-analysis-workspace [state]="state" [showSampleChart]="true"
  [measurementChartContent]="measurementChart"></app-analysis-workspace>
<ng-template #measurementChart let-measurement let-tab="tab">
  <!-- Render one chart using measurement and tab.dateRange. -->
</ng-template>
```

Frequency Domain uses this input with its dedicated standalone
`pages/cm/vibration/frequency-domain/frequency-domain-sample-chart.component.ts`.
By default it displays an ideal one-sided velocity peak-amplitude spectrum from 0 to 125 Hz
in 0.5 Hz bins, with 2 mm/s at 10 Hz and 1 mm/s at 25 Hz, matching the existing
synthetic time signal. The data is isolated in `frequency-domain-sample.data.ts`;
it is not an FFT of selected Measurement data. Other Vibration pages continue to
use the existing Time Domain sample. Both previews use Metronic tokens, the same
400px ECharts host and its resize/zoom/disposal behavior.

## Chart controls (2026-10-19)

The nested analysis panel includes four Metronic Select2 controls, using the
existing `SharedModule` directive (no extra plugin initialization):

- Quantity: Displacement, Velocity, Acceleration.
- Unit (2026-10-21): directly after Quantity, with compatible choices only:
  Displacement: µm (default), mm, mil, in; Velocity: mm/s (default), cm/s,
  m/s, in/s; Acceleration: m/s² (default), mm/s², g, in/s². Changing Quantity
  selects its default unit. Unit changes convert both previews' actual values,
  Y-axis labels and tooltips, retaining chart instances and zoom.
- X axis: Time (seconds) for `domain="time"` (the default); Hz, CPM, Order for
  `domain="frequency"`. Frequency Domain explicitly sets this input.
- Amplitude: RMS, 0p (zero-to-peak), pp (peak-to-peak). Defaults remain Velocity,
  Time/Hz and 0p, matching the original sample.

`AnalysisTab.chartSettings` is optional for backward compatibility; omitted
values use those defaults. `AnalysisPanelComponent.chartSettingsChange` emits
the complete `AnalysisChartSettings`. The workspace emits `{ tabId,
chartSettings }`; controlled consumers update the corresponding tab immutably.
State consumers implement `updateChartSettings(id, settings)` (an optional
extension of `AnalysisWorkspaceState`). `VibrationSelectionService` implements
it and retains independent settings per tab and route in layout memory; there
is no new browser persistence or API contract. Projected templates read
`tab.chartSettings`; Frequency Domain binds it to its per-measurement chart.
The optional `chartSettings.unit` also supports older unitless settings; missing
or incompatible units fall back to the Quantity default. Units are retained per
tab/route along with the other settings. Conversion factors use 1 in = 25.4 mm,
1 mil = 0.001 in and standard gravity 1 g = 9.80665 m/s²
([NIST conversion table](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9)).

Both previews update actual point values, axes and tooltips in place for every
choice. Each measurement retains its independent chart instance and zoom.
The synthetic base velocity is `2 sin(2π10t) + sin(2π25t)` mm/s, sampled at 250 Hz
over two seconds. Displacement integrates each harmonic (including its phase)
and converts mm to µm; acceleration differentiates and converts mm/s² to m/s².
Selected units scale those default-unit values without rounding the data;
tooltips use six significant digits to retain small converted values.
Spectrum peaks use the corresponding harmonic magnitudes. RMS scales each
harmonic's peak amplitude by `1/√2`, 0p by `1`, and pp by `2`; the time preview
uses the same display scaling. These are harmonic amplitude conventions, not
the overall RMS or peak-to-peak statistic of the combined time waveform.

CPM is Hz × 60. Order is Hz / 10, using the explicit synthetic reference speed
600 RPM (10 Hz), also shown below the X-axis control. Thus the two peaks appear
at 10/25 Hz, 600/1500 CPM or 1/2.5 Order. This reference is not a measured asset
speed. Sample data helpers are isolated in `vibration-sample.data.ts` and the
page's `frequency-domain-sample.data.ts`; measurements and date/time filters
remain independent of these synthetic previews.

`../closable-tabs/` is the reusable PrimeNG Tabs adapter. The consumer supplies
`tabs`, `activeId`, `activeIdChange`, `tabClose` and a projected `ng-template` for
panel content. PrimeNG owns tab roles, IDs, arrow/Home/End keys and scrolling.
The adapter adds accessible close buttons, Delete handling and focus return. Only
the active panel is instantiated, disposing charts and calendars when switching
or closing. The caller retains panel values and selects a neighbor when closing.
The shared empty PrimeNG preset and `_metronic-tabs.scss` supply Metronic visuals.

The selection heading displays the tab's `plantLabel`, captured when Execute is
pressed, in the existing Plant selector's `Site - Plant Type - Plant` order.
It uses the Plant name if the joined label is unavailable; independent consumers
can supply their own `plantLabel` or omit it for an `Analysis` heading.
Below it, the shared Unit - System - Asset path appears once, for example
`106 - Gas System - SGT 600`, alongside the selection count. The header
does not repeat Component names or Measurement lists; they identify individual
charts below. Presentation uses Metronic utilities and semantic headings.
Full snapshot metadata remains available to consumers.
The drawer and execution builder enforce selection within a single Asset.

`../date-time-range/` supplies the combined picker for all five Vibration pages.
A single input opens the installed Flatpickr 4.6.13 range calendar with independent
Start/End hour/minute fields and Apply/Cancel in its Metronic footer. Select both
dates (the same day twice for a same-day range), then adjust 24-hour times. Apply
or Enter in a time field commits a complete, ordered range; Cancel, Escape or
outside dismissal discards pending edits. Same-day and overnight ranges work.
The existing lower-layer Flatpickr CSS and Metronic `_flatpickr.scss` provide
calendar styling; the footer uses existing Metronic forms/buttons/grid utilities.

The picker accepts local `YYYY-MM-DDTHH:mm` values. `AnalysisPanelComponent`
combines the tab's existing `dateRange`/`timeRange` for that input and splits a
confirmed result back into the existing `dateRangeChange`/`timeRangeChange`
events, emitting only the parts that changed. The workspace/state interface and
separate local date/time storage shape remain compatible with existing consumers.
The combined input keeps a stable reference across unrelated renders and tab
updates with identical ranges, preserving unfinished selections. Switching or
closing tabs disposes the calendar; returning restores the committed range.
The original date-only and time-only standalone components remain available.

The Vibration service retains independent tabs/dates/times per route in layout memory; Execute
creates a new snapshot and activates it. Reload/logout clears that feature state.
New tabs default to `00:00` through `23:59`. The synthetic previews remain independent
of the selected dates/times/measurements; no API or browser storage is added.
Other modules can supply their own state and charts without a Vibration provider.

References used:
- [PrimeNG Tabs](https://primeng.dev/tabs) and [installed v18 API](https://v18.primeng.org/tabs)
- [Metronic Flatpickr examples](https://preview.keenthemes.com/metronic8/react/docs/flatpickr)
- [Flatpickr options](https://flatpickr.js.org/options/)
- [Flatpickr range calendar](https://flatpickr.js.org/examples/#range-calendar)
- [Flatpickr 24-hour time picker](https://flatpickr.js.org/examples/#24-hour-time-picker)
