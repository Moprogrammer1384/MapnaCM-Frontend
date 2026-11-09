# DARP vibration chart presentation

These are ECharts option/interaction helpers, not a shared chart component.
Orbit, Rotor Position and Bode retain their components and domain processing.
Time Domain and Frequency Domain explicitly retain their original independent
appearance/configuration at the user's request (2026-11-09).

- The same Metronic tokens supply primary blue, secondary green, muted speed,
  warning selection/Keyphasor indicators, axes, legends, tooltips and zoom sliders.
- Measurement markers use circles; position selection uses a persistent outlined
  circle. Orbit and Rotor position observations are scatter data on square,
  equally scaled X/Y grids. Rotor's X/Y-mean and speed observations are also
  scatter data; its existing two-grid layout remains. Clearance geometry is
  distinguished from observations. Bode and Orbit waveforms retain line series,
  with matching line/marker colours and widths. Bode wrapped phase still exposes
  isolated markers and breaks false phase-wrap connections.
- `XyChartInteraction` scopes native pan/pinch, normalized bounded wheel gestures
  and double-click reset to one chart instance. Each owner keeps its keyboard,
  click selection, cursor and lifecycle responsibilities. It owns no HTTP or
  physical calculation. Listeners and animation frames are cleaned up on destroy.
- Plot data, acquisition identity, units, full precision, workers and existing
  numerical summaries are untouched. No bearing geometry is invented for Orbit.

Validation results and acceptance limits are recorded in `agent.md`.
