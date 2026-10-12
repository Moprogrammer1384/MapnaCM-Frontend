# DARP shared analysis workspace panel

The workspace component, its tests and the sample chart live in
`shared/components/analysis-workspace-panel/`. The nested `analysis-panel/`
folder contains `AnalysisPanelComponent` and its template.

`AnalysisWorkspaceComponent` and `AnalysisPanelComponent` are standalone UI
components for analysis screens in any module. They use shared `AnalysisTab`,
`AnalysisDateRange` and `AnalysisDateRangeChange` types from
`core/models/analysis-panel.model.ts` and do not inject feature services, read
routes or own storage. A consumer can supply a chart or explicitly enable the
existing Vibration sample preview.

The workspace accepts `title`, `tabs` and `activeId`. It emits
`selectMeasurements`, `activeIdChange`, `tabClose` and `dateRangeChange` (containing
`tabId` and `dateRange`). The consuming module owns tab creation/removal, active-tab
selection and data loading. A projected `ng-template` receives the active
`AnalysisTab` as its implicit value, allowing each module to render its own chart.

```html
<app-analysis-workspace [title]="title" [tabs]="tabs" [activeId]="activeId"
  (selectMeasurements)="openMeasurements()" (activeIdChange)="activeId = $event"
  (tabClose)="closeTab($event)" (dateRangeChange)="updateDates($event)">
  <ng-template let-tab>
    <!-- Render this module's chart using tab.selection and tab.dateRange. -->
  </ng-template>
</app-analysis-workspace>
```

`AnalysisPanelComponent` can also be used independently with its required `tab`
input, optional `chartContent` template input and `dateRangeChange` output.

Alternatively, pass a module-owned `AnalysisWorkspaceState` as `state`. The
workspace reads its title/tabs/active ID and delegates selection, activation,
closing and date updates to it. When `state` is supplied, its values take
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
the chart uses full width. The preference lives only in the workspace instance
and survives tab switches; changing layout preserves chart instances and zoom.
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
It displays an ideal one-sided velocity peak-amplitude spectrum from 0 to 125 Hz
in 0.5 Hz bins, with 2 mm/s at 10 Hz and 1 mm/s at 25 Hz, matching the existing
synthetic time signal. The data is isolated in `frequency-domain-sample.data.ts`;
it is not an FFT of selected Measurement data. Other Vibration pages continue to
use the existing Time Domain sample. Both previews use Metronic tokens, the same
400px ECharts host and its resize/zoom/disposal behavior.

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

`../date-range/` wraps the Flatpickr picker used by Metronic. The installed runtime
is pinned to 4.6.13; its base CSS is in a lower cascade layer, under the existing
Metronic `_flatpickr.scss`. A single input/calendar uses Flatpickr's `range` mode
to select inclusive start/end dates, including the same day. It emits only a
complete range and restores the last committed value if an unfinished selection
is dismissed. Values remain local `YYYY-MM-DD` strings, with defaults and
persistence supplied by the consumer. The component synchronizes external values
without emitting changes and disposes its one plugin instance on destroy.

The Vibration service retains independent tabs/dates per route in layout memory; Execute
creates a new snapshot and activates it. Reload/logout clears that feature state.
The synthetic waveform remains independent of the selected dates/measurements.
Other modules can supply their own state and charts without a Vibration provider.

References used:
- [PrimeNG Tabs](https://primeng.dev/tabs) and [installed v18 API](https://v18.primeng.org/tabs)
- [Metronic Flatpickr examples](https://preview.keenthemes.com/metronic8/react/docs/flatpickr)
- [Flatpickr options](https://flatpickr.js.org/options/)
- [Flatpickr range calendar](https://flatpickr.js.org/examples/#range-calendar)
