import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AssetApiService } from './asset-taxonomy-api.service';

describe('Asset taxonomy shared-model writes', () => {
  let service: AssetApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AssetApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // A saved entity may carry display/audit data when passed to a write method.
  const metadata = {
    id: 17,
    hierarchyLabel: 'Display hierarchy',
    createdAtUtc: '2026-10-10T00:00:00Z',
    lastModifiedAtUtc: '2026-10-10T01:00:00Z',
  };
  const inheritedEmployer = { employerId: 'e1', employerName: 'Inherited employer' };
  const site = { ...metadata, city: 'Tehran', address: 'Address', latitude: '35', longitude: '51', location: '', elevation: 995 };
  const type = { ...metadata, name: 'Thermal' };
  const plant = { ...metadata, name: 'Plant', siteId: 11, plantTypeId: 2, employerId: null, employerName: null, siteLabel: 'Site', typeName: 'Thermal' };
  const unit = { ...metadata, ...inheritedEmployer, name: 'Unit', plantId: 1, plantLabel: 'Parent plant' };
  const system = { ...metadata, ...inheritedEmployer, name: 'System', unitId: 5, unitLabel: 'Parent unit' };
  const asset = { ...metadata, ...inheritedEmployer, name: 'Asset', tag: '', systemId: 3, systemLabel: 'Parent system' };
  const component = { ...metadata, ...inheritedEmployer, name: 'Component', tag: '', assetId: 7, assetLabel: 'Parent asset' };
  const measurement = {
    ...metadata, ...inheritedEmployer, name: 'Measurement', tag: '', componentId: 12,
    measurementTypeId: 0, sensitivity: 0, typeName: 'Velocity', unit: 'mm/s', componentLabel: 'Parent component',
  };
  const measurementType = { ...metadata, name: 'Velocity', unit: 'mm/s' };

  const cases: readonly {
    entity: string;
    create: (api: AssetApiService) => Observable<void>;
    update: (api: AssetApiService) => Observable<void>;
    body: object;
  }[] = [
    { entity: 'Site', create: (api) => api.createSite(site), update: (api) => api.updateSite(site),
      body: { city: 'Tehran', address: 'Address', latitude: '35', longitude: '51', location: '', elevation: 995 } },
    { entity: 'PlantType', create: (api) => api.createPlantType(type), update: (api) => api.updatePlantType(type), body: { name: 'Thermal' } },
    { entity: 'Plant', create: (api) => api.createPlant(plant), update: (api) => api.updatePlant(plant),
      body: { name: 'Plant', siteId: 11, plantTypeId: 2, employerId: null, employerName: null } },
    { entity: 'Unit', create: (api) => api.createUnit(unit), update: (api) => api.updateUnit(unit), body: { name: 'Unit', plantId: 1 } },
    { entity: 'System', create: (api) => api.createSystem(system), update: (api) => api.updateSystem(system), body: { name: 'System', unitId: 5 } },
    { entity: 'Asset', create: (api) => api.createAsset(asset), update: (api) => api.updateAsset(asset), body: { name: 'Asset', tag: '', systemId: 3 } },
    { entity: 'Component', create: (api) => api.createComponent(component), update: (api) => api.updateComponent(component),
      body: { name: 'Component', tag: '', assetId: 7 } },
    { entity: 'Measurement', create: (api) => api.createMeasurement(measurement), update: (api) => api.updateMeasurement(measurement),
      body: { name: 'Measurement', tag: '', componentId: 12, measurementTypeId: 0, sensitivity: 0 } },
    { entity: 'MeasurementType', create: (api) => api.createMeasurementType(measurementType), update: (api) => api.updateMeasurementType(measurementType),
      body: { name: 'Velocity', unit: 'mm/s' } },
  ];

  for (const scenario of cases) {
    it(`preserves the ${scenario.entity} write contract when an entity includes joined and audit fields`, () => {
      const created = jasmine.createSpy('created');
      scenario.create(service).subscribe(created);
      const create = http.expectOne(`${environment.apiUrl}/${scenario.entity}/Add`);
      expect(create.request.method).toBe('POST');
      expect(create.request.body).toEqual(scenario.body);
      create.flush({ success: true, data: { id: 99 } });
      expect(created).toHaveBeenCalledOnceWith(undefined);

      const updated = jasmine.createSpy('updated');
      scenario.update(service).subscribe(updated);
      const update = http.expectOne(`${environment.apiUrl}/${scenario.entity}/Update`);
      expect(update.request.method).toBe('PUT');
      expect(update.request.body).toEqual({ id: 17, ...scenario.body });
      update.flush({ success: true });
      expect(updated).toHaveBeenCalledOnceWith(undefined);
    });
  }

  it('surfaces a rejected write through the existing observable error path', () => {
    const next = jasmine.createSpy('next');
    const error = jasmine.createSpy('error');
    service.updateMeasurement(measurement).subscribe({ next, error });
    http.expectOne(`${environment.apiUrl}/Measurement/Update`).flush({ success: false, message: 'Measurement rejected' });
    expect(next).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledOnceWith(jasmine.objectContaining({ message: 'Measurement rejected' }));
  });
});
