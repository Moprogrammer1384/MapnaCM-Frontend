import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SensorApiService } from './sensor-api.service';

describe('SensorApiService', () => {
  let api: SensorApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    api = TestBed.inject(SensorApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('reads the paginated lists and sends only sensor fields', () => {
    let name = '';
    api.getSensors().subscribe((rows) => { name = rows[0].typeName ?? ''; });
    const read = http.expectOne((request) => request.url.endsWith('/Sensor/GetAll'));
    expect(read.request.params.get('Take')).toBe('10000');
    read.flush({ success: true, data: { items: [{ id: 3, name: 'T7', sensorTypeId: 4, typeName: 'performance' }], totalCount: 1 } });
    expect(name).toBe('performance');
    api.createSensor({ name: 'T7', sensorTypeId: 4 }).subscribe();
    const add = http.expectOne((request) => request.url.endsWith('/Sensor/Add'));
    expect(add.request.method).toBe('POST');
    expect(add.request.body).toEqual({ name: 'T7', sensorTypeId: 4 });
    add.flush({ success: true, data: {} });
  });

  it('propagates business rejection and deletes types with the expected ID', () => {
    let error = '';
    api.deleteType(4).subscribe({ error: (value: Error) => { error = value.message; } });
    const request = http.expectOne((item) => item.url.endsWith('/SensorType/Delete'));
    expect(request.request.params.get('Id')).toBe('4');
    request.flush({ success: false, message: 'Type in use', errors: [], data: null });
    expect(error).toContain('Type in use');
  });
});
