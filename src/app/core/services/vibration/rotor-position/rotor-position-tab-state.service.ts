import { computed, Injectable, signal } from '@angular/core';
import { AnalysisTab } from 'src/app/core/models/analysis-panel.model';
import { DEFAULT_ROTOR_POSITION_SETTINGS, RotorPositionEvent, RotorPositionSettings, RotorPositionUnit } from 'src/app/core/models/rotor-position.model';
import { resolveOrbitProbePairs } from '../orbit-analysis/orbit-probe-pairing';

function createTabState(tab: AnalysisTab) {
  const pairing = resolveOrbitProbePairs(tab);
  const sourceUnits = signal<Readonly<Record<string, RotorPositionUnit>>>({});
  const settings = signal<RotorPositionSettings>({ ...DEFAULT_ROTOR_POSITION_SETTINGS });
  return { pairs: pairing.pairs, error: pairing.error,
    event: signal<RotorPositionEvent | undefined>(undefined),
    settings, nativeUnits: computed(() => Object.values(sourceUnits())),
    setSourceUnit: (key: string, unit?: RotorPositionUnit) => {
      const units = { ...sourceUnits() };
      if (unit) { units[key] = unit; } else { delete units[key]; }
      sourceUnits.set(units);
      if (settings().unit === 'mil' && !Object.values(units).includes('mil')) {
        settings.update(value => ({ ...value, unit: 'µm' }));
      }
    } };
}

/** A weak key retains settings across route navigation without keeping closed/logout tabs alive. */
@Injectable({ providedIn: 'root' })
export class RotorPositionTabStateService {
  private readonly states = new WeakMap<AnalysisTab, ReturnType<typeof createTabState>>();
  forTab(tab: AnalysisTab): ReturnType<typeof createTabState> {
    let value = this.states.get(tab);
    if (!value) { value = createTabState(tab); this.states.set(tab, value); }
    return value;
  }
}
