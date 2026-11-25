# DARP event picker

The shared picker selects exact acquisition IDs and bounds, with optional Date
filtering and the common AM/PM event label supplied by its source.

`showEventTypeFilter=true` adds a Metronic Select2 **Event type** before Date.
Its **All states** default preserves the full catalogue. Options are unique
`AnalysisEventTime.eventType` / `eventTypes` values present in that catalogue;
labels are never parsed to infer a state. Known state display names reuse the
shared vibration presentation map; other supplied state names remain selectable.

Bode supplies `eventTypes` from the existing availability API's measurement-event
metadata. Rotor Position supplies its API's `eventType`. Waterfall supplies the
mock acquisition type. Orbit has no operating-state metadata and retains the
Date/Event time layout with this optional feature disabled. No state-list API,
new request parameters, source fallback or browser storage is introduced.

State and Date filters intersect. With no Date, every recording matching the
state is available. The calendar enables only dates proven by matching events;
switching state clears a date only if it has no matching recording. Clearing
Date preserves the chosen state; All states preserves a compatible Date.
Filtering does not select an acquisition, request chart data or change a loaded
chart. A selection no longer visible is cleared in the dropdown; compatible
exact selections survive. New measurement keys reset both filters. Catalogue
updates refresh the supplied options, and disabled/error/loading states remain
owned by the consumer.

The existing Select2 directive and Flatpickr lifecycle own initialization,
theme styling, option refresh, accessibility and cleanup. Consumers should not
initialize either plugin again.
