import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MeasurementStorageService } from './measurement-storage.service';

describe('MeasurementStorageService', () => {
  let service: MeasurementStorageService;
  let stored: Record<string, string>;

  beforeEach(() => {
    stored = {};
    spyOn(Storage.prototype, 'getItem').and.callFake((key) => stored[key] ?? null);
    spyOn(Storage.prototype, 'setItem').and.callFake((key, value) => { stored[key] = value; });
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeasurementStorageService);
  });

  it('persists creation, editing and deletion across service instances', async () => {
    expect(await firstValueFrom(service.getAllMeasurements())).toEqual([]);
    await firstValueFrom(service.createMeasurement({ name: 'RMS velocity', componentId: 7 }));
    await firstValueFrom(service.createMeasurement({ name: 'Peak velocity', componentId: 8 }));
    const reopened = new MeasurementStorageService();
    expect(await firstValueFrom(reopened.getAllMeasurements())).toEqual([
      { id: 1, name: 'RMS velocity', componentId: 7 },
      { id: 2, name: 'Peak velocity', componentId: 8 },
    ]);
    await firstValueFrom(reopened.updateMeasurement({ id: 1, name: 'Updated velocity', componentId: 8 }));
    await firstValueFrom(reopened.deleteMeasurement(2));
    expect(await firstValueFrom(service.getAllMeasurements())).toEqual([
      { id: 1, name: 'Updated velocity', componentId: 8 },
    ]);
  });

  it('reports stale edits and deletes without overwriting saved data', async () => {
    await firstValueFrom(service.createMeasurement({ name: 'RMS velocity', componentId: 7 }));
    const snapshot = stored['asset-taxonomy-measurements'];
    await expectAsync(firstValueFrom(service.updateMeasurement({ id: 99, name: 'Missing', componentId: 7 })))
      .toBeRejectedWithError(/no longer available/);
    await expectAsync(firstValueFrom(service.deleteMeasurement(99))).toBeRejectedWithError(/no longer available/);
    expect(stored['asset-taxonomy-measurements']).toBe(snapshot);
  });

  it('preserves malformed saved data and reports the read failure', async () => {
    stored['asset-taxonomy-measurements'] = '{"unexpected":true}';
    await expectAsync(firstValueFrom(service.createMeasurement({ name: 'RMS velocity', componentId: 7 })))
      .toBeRejectedWithError(/Unable to read/);
    expect(stored['asset-taxonomy-measurements']).toBe('{"unexpected":true}');
  });

  it('surfaces browser storage write failures', async () => {
    (localStorage.setItem as jasmine.Spy).and.throwError('Storage quota exceeded');
    await expectAsync(firstValueFrom(service.createMeasurement({ name: 'RMS velocity', componentId: 7 })))
      .toBeRejectedWithError('Storage quota exceeded');
    expect(await firstValueFrom(service.getAllMeasurements())).toEqual([]);
  });
});
