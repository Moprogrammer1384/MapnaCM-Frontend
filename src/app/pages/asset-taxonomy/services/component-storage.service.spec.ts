import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ComponentStorageService } from './component-storage.service';

describe('ComponentStorageService', () => {
  let service: ComponentStorageService;
  let stored: Record<string, string>;

  beforeEach(() => {
    stored = {};
    spyOn(Storage.prototype, 'getItem').and.callFake((key) => stored[key] ?? null);
    spyOn(Storage.prototype, 'setItem').and.callFake((key, value) => { stored[key] = value; });
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentStorageService);
  });

  it('persists creation, editing and deletion across service instances', async () => {
    expect(await firstValueFrom(service.getAllComponents())).toEqual([]);
    await firstValueFrom(service.createComponent({ name: 'Bearing', assetId: 7 }));
    await firstValueFrom(service.createComponent({ name: 'Seal', assetId: 8 }));
    const reopened = new ComponentStorageService();
    expect(await firstValueFrom(reopened.getAllComponents())).toEqual([
      { id: 1, name: 'Bearing', assetId: 7 },
      { id: 2, name: 'Seal', assetId: 8 },
    ]);
    await firstValueFrom(reopened.updateComponent({ id: 1, name: 'Updated bearing', assetId: 8 }));
    await firstValueFrom(reopened.deleteComponent(2));
    expect(await firstValueFrom(service.getAllComponents())).toEqual([
      { id: 1, name: 'Updated bearing', assetId: 8 },
    ]);
  });

  it('reports stale edits and deletes without overwriting saved data', async () => {
    await firstValueFrom(service.createComponent({ name: 'Bearing', assetId: 7 }));
    const snapshot = stored['asset-taxonomy-components'];
    await expectAsync(firstValueFrom(service.updateComponent({ id: 99, name: 'Missing', assetId: 7 })))
      .toBeRejectedWithError(/no longer available/);
    await expectAsync(firstValueFrom(service.deleteComponent(99))).toBeRejectedWithError(/no longer available/);
    expect(stored['asset-taxonomy-components']).toBe(snapshot);
  });

  it('preserves malformed saved data and reports the read failure', async () => {
    stored['asset-taxonomy-components'] = '{"unexpected":true}';
    await expectAsync(firstValueFrom(service.createComponent({ name: 'Bearing', assetId: 7 })))
      .toBeRejectedWithError(/Unable to read/);
    expect(stored['asset-taxonomy-components']).toBe('{"unexpected":true}');
  });

  it('surfaces browser storage write failures', async () => {
    (localStorage.setItem as jasmine.Spy).and.throwError('Storage quota exceeded');
    await expectAsync(firstValueFrom(service.createComponent({ name: 'Bearing', assetId: 7 })))
      .toBeRejectedWithError('Storage quota exceeded');
    expect(await firstValueFrom(service.getAllComponents())).toEqual([]);
  });
});
