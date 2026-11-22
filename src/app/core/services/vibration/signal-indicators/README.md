# DARP Signal Indicators

The Signal Indicators workspace uses the shared Measurement Drawer, Execute
tabs, date and time range, and Apply. Its page-scoped availability adapter
uses `GET /SignalIndicator/GetAvailability` for dates shared by every selected
measurement. Applying the range loads a series per measurement from
`GET /SignalIndicator/Get`. Picker timestamps use the Tehran calendar and
wall clock.

Each plotted point uses the returned RMS, 0p and pp values and timestamp.
The chart shows the stored quantity and unit. Reported gaps break the line.
The footer shows the original point count and full-range maxima returned by
the API. Wide ranges display an overview of stored rows. Applying a shorter
range provides every stored second within the exact-read budget.

All mode shows blue RMS, orange 0p and teal pp with an independent legend.
Single-metric modes use the configured upper alarm settings from
`GET /SignalIndicatorSettings/Get`. The chart expresses the thresholds in
the record's unit and uses them for curve colour. The mode, Show alarms,
visited charts and zoom follow the workspace's tab behavior. A failed series
read or alarm settings read offers its own Retry action.

[Backend contract and storage](../../../../../../../../BackEnd/docs/Vibration-SignalIndicator-API.md)
