import { PrimeNGConfigType } from 'primeng/config';

/** No PrimeNG visual preset. Metronic classes and scoped adapters supply visuals.
 * Put PrimeNG's structural CSS in a lower layer so it cannot override Metronic. */
export const METRONIC_PRIMENG_CONFIG: PrimeNGConfigType = {
  ripple: false,
  theme: {
    preset: {},
    options: {
      cssLayer: { name: 'primeng', order: 'primeng' },
      darkModeSelector: '[data-bs-theme="dark"]',
    },
  },
};
