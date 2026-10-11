import type { Plant, Unit } from '../models/asset-taxonomy.model';
import { buildParentIdMap, buildParentOptions, buildPlantEmployerMap, resolveInheritedEmployer } from './asset-taxonomy-hierarchy';

function plant(values: Partial<Plant>): Plant {
  return { name: 'Plant', siteId: null, plantTypeId: null, ...values };
}

describe('Taxonomy hierarchy transformations', () => {
  it('sorts saved parent options by display label without mutating the input', () => {
    const parents: readonly Pick<Plant, 'id' | 'name' | 'hierarchyLabel'>[] = Object.freeze([
      Object.freeze({ id: 2, name: 'Zulu' }),
      Object.freeze({ name: 'Unsaved' }),
      Object.freeze({ id: 1, name: 'Name', hierarchyLabel: 'Alpha hierarchy' }),
      Object.freeze({ id: 0, name: 'Blank label', hierarchyLabel: '' }),
    ]);
    expect(buildParentOptions(parents)).toEqual([
      { id: 0, label: '' }, { id: 1, label: 'Alpha hierarchy' }, { id: 2, label: 'Zulu' },
    ]);
    expect(parents[0].id).toBe(2);
  });

  it('keeps duplicate display labels as distinct ID-based options in response order', () => {
    expect(buildParentOptions([{ id: 3, name: 'Same' }, { id: 1, name: 'Same' }])).toEqual([
      { id: 3, label: 'Same' }, { id: 1, label: 'Same' },
    ]);
  });

  it('maps native parent IDs, including zero, and skips unsaved or unselected records', () => {
    const units: readonly Pick<Unit, 'id' | 'plantId'>[] = Object.freeze([
      Object.freeze({ id: 0, plantId: 0 }), Object.freeze({ id: 1, plantId: 7 }),
      Object.freeze({ id: 2, plantId: null }), Object.freeze({ plantId: 7 }),
    ]);
    expect(buildParentIdMap(units, (unit) => unit.plantId)).toEqual({ 0: 0, 1: 7 });
  });

  it('retains the last selected relationship when duplicate IDs appear', () => {
    const units = [{ id: 1, plantId: 7 }, { id: 1, plantId: 8 }, { id: 1, plantId: null }];
    expect(buildParentIdMap(units, (unit) => unit.plantId)).toEqual({ 1: 8 });
  });

  it('normalizes absent employer data without trimming names or changing empty employer IDs', () => {
    const plants = Object.freeze([
      Object.freeze(plant({ id: 0, employerId: '', employerName: '  Employer  ' })),
      Object.freeze(plant({ id: 1, employerId: null, employerName: '' })),
      Object.freeze(plant({ id: 2, employerName: null })),
      Object.freeze(plant({ id: 3 })), Object.freeze(plant({ employerId: 'Unsaved' })),
    ]);
    expect(buildPlantEmployerMap(plants)).toEqual({
      0: { id: '', name: '  Employer  ' }, 1: { id: null, name: '\u2014' },
      2: { id: null, name: '\u2014' }, 3: { id: null, name: '\u2014' },
    });
  });

  it('replaces the employer snapshot when duplicate Plant IDs appear', () => {
    expect(buildPlantEmployerMap([
      plant({ id: 1, employerId: 'Old', employerName: 'Old' }), plant({ id: 1 }),
    ])).toEqual({ 1: { id: null, name: '\u2014' } });
  });

  it('creates independent results so a reload cannot retain old relationships or employers', () => {
    const previousIds = buildParentIdMap([{ id: 1, plantId: 7 }], (unit) => unit.plantId);
    const previousEmployers = buildPlantEmployerMap([plant({ id: 7, employerId: 'User', employerName: 'Employer' })]);
    expect(buildParentOptions([])).toEqual([]);
    expect(buildParentIdMap<Pick<Unit, 'id' | 'plantId'>>([], (unit) => unit.plantId)).toEqual({});
    expect(buildPlantEmployerMap([])).toEqual({});
    expect(previousIds).toEqual({ 1: 7 });
    expect(previousEmployers).toEqual({ 7: { id: 'User', name: 'Employer' } });
  });

  it('resolves a direct Plant reference and returns its existing employer snapshot', () => {
    const snapshot = Object.freeze({ id: 'User', name: 'Employer' });
    expect(resolveInheritedEmployer(7, Object.freeze({ 7: snapshot }))).toBe(snapshot);
  });

  it('follows the complete Component-to-Plant chain in the supplied order', () => {
    const employers = Object.freeze({ 7: Object.freeze({ id: 'User', name: 'Employer' }) });
    expect(resolveInheritedEmployer(
      50, employers, Object.freeze({ 50: 40 }), Object.freeze({ 40: 30 }),
      Object.freeze({ 30: 20 }), Object.freeze({ 20: 7 })
    )).toBe(employers[7]);
  });

  it('preserves zero-valued references throughout an inherited chain', () => {
    const employers = { 0: { id: null, name: 'Unassigned' } };
    expect(resolveInheritedEmployer(0, employers, { 0: 0 }, { 0: 0 })).toBe(employers[0]);
  });

  it('does not infer an employer when the selection, an ancestor, or the Plant is missing', () => {
    const employers = { 7: { id: 'User', name: 'Employer' } };
    expect(resolveInheritedEmployer(null, employers)).toBeUndefined();
    expect(resolveInheritedEmployer(99, employers)).toBeUndefined();
    expect(resolveInheritedEmployer(50, employers, {}, { 40: 7 })).toBeUndefined();
    expect(resolveInheritedEmployer(50, employers, { 50: 40 }, {}, { 20: 7 })).toBeUndefined();
    expect(resolveInheritedEmployer(50, employers, { 50: 99 })).toBeUndefined();
  });
});
