import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Measurement } from '../models/asset-taxonomy.model';
import { AssetApiService } from './asset-taxonomy-api.service';

describe('Measurement API without Measurement Type', () => {
  let api: AssetApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(AssetApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads only Measurements and ignores retired type/unit joins in a legacy response', () => {
    let rows: Measurement[] = [];
    api.getAllMeasurements().subscribe(result => rows = result);
    const request = http.expectOne(req => req.url === `${environment.apiUrl}/Measurement/GetAll`);
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: { totalCount: 1, items: [{
      id: 7, name: 'Bearing X', tag: 'X', sensitivity: 0, componentId: 2,
      componentLabel: 'Plant - Unit - Component', employerName: 'Employer',
      measurementTypeId: 9, typeName: 'Unused legacy type', unit: 'mm/s',
    }] } });
    expect(rows.length).toBe(1);
    expect(rows[0]).toEqual(jasmine.objectContaining({ id: 7, name: 'Bearing X', tag: 'X',
      sensitivity: 0, componentId: 2, componentLabel: 'Plant - Unit - Component', employerName: 'Employer' }));
    for (const field of ['measurementTypeId', 'typeName', 'unit']) { expect(field in rows[0]).toBeFalse(); }
    http.expectNone(req => req.url.includes('/MeasurementType/'));
  });

  it('sends create/update fields without a type ID or derived unit, even for a stale caller', () => {
    const payload = { name: 'Bearing X', tag: '', componentId: 2, sensitivity: -0.25,
      measurementTypeId: 9, typeName: 'Old type', unit: 'mm/s' };
    api.createMeasurement(payload).subscribe();
    const add = http.expectOne(`${environment.apiUrl}/Measurement/Add`);
    expect(add.request.method).toBe('POST');
    expect(add.request.body).toEqual({ name: 'Bearing X', tag: '', componentId: 2, sensitivity: -0.25 });
    add.flush({ success: true });
    api.updateMeasurement({ ...payload, id: 7 }).subscribe();
    const edit = http.expectOne(`${environment.apiUrl}/Measurement/Update`);
    expect(edit.request.method).toBe('PUT');
    expect(edit.request.body).toEqual({ id: 7, name: 'Bearing X', tag: '', componentId: 2, sensitivity: -0.25 });
    edit.flush({ success: true });
    http.expectNone(req => req.url.includes('/MeasurementType/'));
  });

  it('preserves API business errors for load and save', () => {
    let loadError = '', saveError = '';
    api.getAllMeasurements().subscribe({ error: error => loadError = error.message });
    http.expectOne(req => req.url.endsWith('/Measurement/GetAll')).flush({ success: false, message: 'List failed' });
    expect(loadError).toBe('List failed');
    api.createMeasurement({ name: 'X', componentId: 2, sensitivity: 1 }).subscribe({ error: error => saveError = error.message });
    http.expectOne(`${environment.apiUrl}/Measurement/Add`).flush({ success: false, message: 'Save failed' });
    expect(saveError).toBe('Save failed');
  });
});
