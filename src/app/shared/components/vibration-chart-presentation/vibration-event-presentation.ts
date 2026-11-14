/** Metronic event identity shared by Bode and Waterfall. */
export const VIBRATION_EVENT_CLASSES = {
  Startup: 'badge-light-success', CoastDown: 'badge-light-info', Trip: 'badge-light-danger',
  LoadChange: 'badge-light-warning', SteadyState: 'badge-light-primary',
} as const;

export const VIBRATION_EVENT_LABELS = {
  Startup: 'Startup', CoastDown: 'CoastDown', Trip: 'Trip', LoadChange: 'Load change', SteadyState: 'Steady state',
} as const;
