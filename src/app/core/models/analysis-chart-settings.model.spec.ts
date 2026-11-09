import { vibrationUnitOptions } from './analysis-chart-settings.model';

describe('Vibration display unit options', () => {
  it('offers only the requested metric units without native metadata', () => {
    expect(vibrationUnitOptions('displacement').map(unit => unit.value)).toEqual(['µm', 'mm']);
    expect(vibrationUnitOptions('velocity').map(unit => unit.value)).toEqual(['mm/s']);
    expect(vibrationUnitOptions('acceleration').map(unit => unit.value)).toEqual(['mm/s²']);
  });
  it('adds only compatible native units once, after the standard choices', () => {
    expect(vibrationUnitOptions('acceleration', [
      { quantity: 'acceleration', unit: 'g' }, { quantity: 'acceleration', unit: 'g' },
      { quantity: 'velocity', unit: 'in/s' }, { quantity: 'acceleration', unit: 'mil' },
    ]).map(unit => unit.value)).toEqual(['mm/s²', 'g']);
    expect(vibrationUnitOptions('displacement', [{ quantity: 'displacement', unit: 'mil' }])
      .map(unit => unit.value)).toEqual(['µm', 'mm', 'mil']);
  });
});
