# DARP vibration calendar availability

`VibrationDateTimeRangeComponent` wraps the existing `DateTimeRangeComponent` for
Time Domain and Frequency Domain only. It loads calendar metadata through the
shared `TimeAvailabilityService` / `TIME_AVAILABILITY_SOURCE` in
`core/services/time-availability.service.ts`, with its model in
`core/models/time-availability.model.ts`. Other modules can consume this source
without importing vibration services.

On measurement selection it requests `GET /TimeDomain/GetAvailability` with repeated
`MeasurementIds`, omitting dates for discovery of actual data history. It uses
`commonRanges`: a day must have data in **every selected measurement**. It never
enables days from union `ranges`, `dataBounds`, today's date or the seed interval.

All days begin disabled. The child calendar uses Flatpickr's native `enable`
predicate, disabled-day visuals, keyboard behavior and range selection rules.
Responses are day labels in Tehran, with inclusive `from` and exclusive `to`;
they are not converted to UTC. Bounds only limit navigation, and their last
exclusive day is reduced by one calendar day for Flatpickr's inclusive `maxDate`.

Discovery can cover at most 366 days. Navigating to an unqueried month loads an
explicit month window (clipped to navigation bounds). Unknown days stay disabled
until a successful response confirms them. Confirmed windows/ranges are retained
only in this component instance, without browser storage. Repeated month visits
reuse that proof; changing measurements clears it and cancels old requests.
Updates preserve the visible month and unfinished date selections.

Initial loading and failed discovery keep selection unavailable. Failures show
Retry and never become successful empty availability. A successful empty response
keeps all days disabled and displays a no-common-dates status. Pending month reads
also block Apply. Waveform/analysis requests still start only after explicit Apply.

The API's `granularity: day` does not describe hours, minutes or FFT continuity.
As clarified by the user on 2026-10-25, hour/minute choices keep their existing
behavior. No `minTime`, `maxTime` or new time filtering is applied.
