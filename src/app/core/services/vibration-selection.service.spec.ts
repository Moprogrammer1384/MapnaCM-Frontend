import { TestBed } from '@angular/core/testing';
import { AssetTaxonomyExecution } from '../models/asset-taxonomy-selection.model';
import { VibrationPage, VIBRATION_PAGES } from '../models/vibration-page.model';
import { VibrationSelectionService } from './vibration-selection.service';

const execution: AssetTaxonomyExecution = {
  selection: { plantId: 1, unitId: 2, measurementIds: [6] },
  measurements: [{ measurement: { id: 6, name: 'X', tag: null }, component: { id: 5, name: 'Bearing', tag: null },
    asset: { id: 4, name: 'Asset', tag: null }, system: { id: 3, name: 'System', tag: null },
    unit: { id: 2, name: 'Unit', tag: null }, typeName: null, measurementUnit: null, sensitivity: null }],
};

describe('Vibration page analysis numbering', () => {
  let state: VibrationSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [VibrationSelectionService] });
    state = TestBed.inject(VibrationSelectionService);
  });

  it('numbers each page independently while keeping tab IDs unique across all pages', () => {
    const pages = Object.keys(VIBRATION_PAGES) as VibrationPage[];
    const ids = new Set<string>();
    for (const round of [1, 2]) {
      for (const page of round === 1 ? pages : [...pages].reverse()) {
        state.setRoute(`/cm/vibration/${page}`);
        state.execute(execution);
        expect(state.activeTab()!.title).withContext(page).toBe(`Analysis ${round}`);
        expect(state.tabs().map(tab => tab.title)).toEqual(round === 1 ? ['Analysis 1'] : ['Analysis 1', 'Analysis 2']);
        expect(ids.has(state.activeTabId())).toBeFalse();
        ids.add(state.activeTabId());
      }
    }
    expect(ids.size).toBe(pages.length * 2);
  });

  it('continues a page counter after closing its tabs and visiting another page', () => {
    state.setRoute('/cm/vibration/time-domain');
    state.execute(execution);
    state.execute(execution);
    for (const tab of [...state.tabs()]) { state.closeTab(tab.id); }
    state.setRoute('/cm/vibration/frequency-domain');
    state.execute(execution);
    expect(state.activeTab()!.title).toBe('Analysis 1');
    state.setRoute('/cm/vibration/time-domain');
    state.execute(execution);
    expect(state.activeTab()!.title).toBe('Analysis 3');
    state.setRoute('/cm/vibration/frequency-domain');
    state.execute(execution);
    expect(state.activeTab()!.title).toBe('Analysis 2');
  });
});
