import { VibrationSelectionService } from './vibration-selection.service';

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
});
