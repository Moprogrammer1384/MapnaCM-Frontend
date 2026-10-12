import { VibrationSelectionService } from './vibration-selection.service';
import { assetTaxonomyFixture } from 'src/app/shared/components/asset-taxonomy-drawer/testing/asset-taxonomy-fixture';
import { buildAssetTaxonomyExecution } from '../utils/asset-taxonomy-execution';

describe('VibrationSelectionService', () => {
  it('shares saved measurements across all vibration routes and preserves them during other pages', () => {
    const state = new VibrationSelectionService();
    state.setRoute('/cm/vibration/time-domain');
    state.save({ plantId: 0, unitId: 0, measurementIds: [0, 2] });
    for (const route of ['overview', 'frequency-domain', 'bode-analysis', 'rotor-position']) {
      state.setRoute(`/cm/vibration/${route}?tab=1`);
      expect(state.active()).toBeTrue();
      expect(state.selection()?.measurementIds).toEqual([0, 2]);
    }
    state.open();
    state.setRoute('/asset-taxonomy/asset');
    expect(state.active()).toBeFalse();
    expect(state.drawerOpen()).toBeFalse();
    state.open();
    expect(state.drawerOpen()).toBeFalse();
    state.setRoute('/cm/vibration');
    expect(state.selection()?.measurementIds).toEqual([0, 2]);
    state.setRoute('/cm/vibration-extra');
    expect(state.active()).toBeFalse();
  });

  it('copies saved values, supports reset and isolates separate layout sessions', () => {
    const state = new VibrationSelectionService();
    const ids = [0, 2, 2];
    state.save({ plantId: 0, unitId: 0, measurementIds: ids });
    ids.push(10);
    expect(state.selection()?.measurementIds).toEqual([0, 2]);
    expect(new VibrationSelectionService().selection()).toBeNull();
    state.save(null);
    expect(state.selection()).toBeNull();
  });

  it('opens a new independent tab on every Execute and isolates tabs and dates by route', () => {
    const state = new VibrationSelectionService();
    const execution = buildAssetTaxonomyExecution(assetTaxonomyFixture(), { plantId: 0, unitId: 0, measurementIds: [0] })!;
    state.setRoute('/cm/vibration/time-domain');
    state.execute(execution);
    const first = state.activeTab()!;
    state.updateDateRange(first.id, { from: '2026-09-01', to: '2026-09-12' });
    state.execute(execution);
    expect(state.tabs().length).toBe(2);
    expect(state.activeTabId()).not.toBe(first.id);
    expect(state.activeTab()!.measurements).not.toBe(execution.measurements);
    state.save(null);
    expect(state.tabs()[0].selection.measurementIds).toEqual([0]);
    expect(state.tabs()[0].dateRange).toEqual({ from: '2026-09-01', to: '2026-09-12' });
    for (const route of ['overview', 'frequency-domain', 'bode-analysis', 'rotor-position']) {
      state.setRoute(`/cm/vibration/${route}`);
      expect(state.tabs()).toEqual([]);
      state.execute(execution);
      expect(state.tabs().length).toBe(1);
    }
    state.setRoute('/asset-taxonomy/asset');
    state.execute(execution);
    state.setRoute('/cm/vibration/time-domain');
    expect(state.tabs().length).toBe(2);
    state.activateTab(first.id);
    expect(state.activeTab()?.dateRange.from).toBe('2026-09-01');
    expect(new VibrationSelectionService().tabs()).toEqual([]);
  });

  it('keeps an unrelated active tab and selects a surviving neighbor when closing the active tab', () => {
    const state = new VibrationSelectionService();
    const execution = buildAssetTaxonomyExecution(assetTaxonomyFixture(), { plantId: 0, unitId: 0, measurementIds: [0] })!;
    state.setRoute('/cm/vibration/time-domain');
    for (let i = 0; i < 3; i++) { state.execute(execution); }
    const [first, middle, last] = state.tabs();
    state.closeTab(first.id);
    expect(state.activeTabId()).toBe(last.id);
    state.closeTab(last.id);
    expect(state.activeTabId()).toBe(middle.id);
    state.closeTab(middle.id);
    expect(state.tabs()).toEqual([]);
    expect(state.activeTabId()).toBe('');
    state.closeTab('missing');
    state.activateTab('missing');
    expect(state.activeTab()).toBeUndefined();
  });
});
