import { TaxonomyMeasurement } from 'src/app/core/models/asset.model';
import { MeasurementUiStateService } from './measurement-ui-state.service';

describe('Measurement frontend state', () => {
  let state: MeasurementUiStateService;
  const payload = { name: 'Velocity', tag: 'V-1', componentId: 10 };
  const configuration = { measurementTypeId: 1, sensitivity: 0.25 };
  const row = (id: number, componentId = 10): TaxonomyMeasurement => ({
    id, ...payload, componentId, componentName: 'Bearing', componentLabel: 'Pump - Bearing', hierarchyLabel: 'Pump - Bearing - Velocity',
  });

  beforeEach(() => {
    state = new MeasurementUiStateService();
    state.saveType({ name: 'Velocity', unit: 'mm/s' });
  });

  it('waits for the newly created record and does not attach configuration to an existing same-name record', () => {
    state.queueCreatedConfiguration(payload, [20], configuration);
    state.reconcile([row(20)]);
    expect(state.getConfiguration(20)).toBeUndefined();
    state.reconcile([row(20), row(21), row(22, 11)]);
    expect(state.getConfiguration(20)).toBeUndefined();
    expect(state.getConfiguration(21)).toEqual(configuration);
    expect(state.getConfiguration(22)).toBeUndefined();
    state.setConfiguration(21, { measurementTypeId: 1, sensitivity: 0 });
    state.reconcile([row(21)]);
    expect(state.getConfiguration(21)?.sensitivity).toBe(0);
  });

  it('does not guess the created ID when multiple new records match', () => {
    state.queueCreatedConfiguration(payload, [20], configuration);
    state.reconcile([row(20), row(21), row(22)]);
    expect(state.getConfiguration(20)).toBeUndefined();
    expect(state.getConfiguration(21)).toBeUndefined();
    expect(state.getConfiguration(22)).toBeUndefined();
  });

  it('does not guess which configuration belongs to a single row shared by pending saves', () => {
    state.queueCreatedConfiguration(payload, [20], configuration);
    state.queueCreatedConfiguration(payload, [20], { ...configuration, sensitivity: 2 });
    state.reconcile([row(20), row(21)]);
    expect(state.getConfiguration(21)).toBeUndefined();
  });

  it('protects assigned and pending types and releases the type after its measurement is deleted', () => {
    state.setConfiguration(20, configuration);
    expect(state.deleteType(1)).toBeFalse();
    state.deleteConfiguration(20);
    expect(state.deleteType(1)).toBeTrue();
    state.saveType({ name: 'Acceleration', unit: 'g' });
    state.queueCreatedConfiguration(payload, [], { measurementTypeId: 2, sensitivity: 100 });
    expect(state.deleteType(2)).toBeFalse();
    expect(state.getTypes()[0].id).toBe(2);
  });
});
