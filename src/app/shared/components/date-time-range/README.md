# DARP date and time range picker

Import the standalone `DateTimeRangeComponent` in the consuming component or
NgModule. Use a unique, stable `inputId` for each instance:

```html
<app-date-time-range inputId="report-period" [(value)]="period"
  [disabled]="loading"></app-date-time-range>
```

```ts
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import { DateTimeRangeComponent } from 'src/app/shared/components/date-time-range/date-time-range.component';

period: DateTimeRange = {
  from: '2026-10-13T08:30',
  to: '2026-10-14T17:45',
};
```

One input opens the existing Metronic Flatpickr range calendar with independent
24-hour hour/minute fields for both endpoints in its footer. Select two dates
(click the same day twice for a same-day range), set the times, and press Apply.
Enter in a time field also applies. Only complete, ordered ranges emit
`valueChange`; equal endpoints and ranges spanning midnight are supported.
Cancel, Escape or clicking outside discards pending edits. Applying an unchanged
range emits nothing. External updates synchronize silently and replace drafts.

Values are local `YYYY-MM-DDTHH:mm` wall-clock strings with minute precision;
the component performs no UTC conversion, storage or API calls. An empty
`{ from: '', to: '' }` starts without selected dates and with 00:00/23:59 times.
Invalid external ranges have no selected calendar dates and require reselection.
All presentation uses existing Metronic classes/tokens and Flatpickr styling.
The shared analysis panel uses this picker on all five Vibration pages, adapting
its values to the existing tab date/time fields and change events. The original
date-only and time-only components remain available for other consumers.

Flatpickr behavior reference: [range/options](https://flatpickr.js.org/options/).
