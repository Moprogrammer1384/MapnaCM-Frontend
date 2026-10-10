import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { configureMetronicPrimeNG } from 'src/app/shared/components/data-table/testing/prime-table-test-support';
import { SiteComponent } from './site.component';

describe('Site numeric elevation', () => {
  let fixture: ComponentFixture<SiteComponent>;
  let api: jasmine.SpyObj<AssetApiService>;
  let modals: NgbModal;
  const site = { id: 11, city: 'Tehran', address: 'Address', latitude: '35', longitude: '51', location: '', elevation: 995 };
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const input = (name: string) => document.querySelector<HTMLInputElement>(`ngb-modal-window input[name="${name}"]`)!;
  const setValue = async (name: string, value: string) => {
    input(name).value = value;
    input(name).dispatchEvent(new Event('input'));
    await settle();
  };
  const submit = async () => {
    document.querySelector<HTMLButtonElement>('ngb-modal-window button[type="submit"]')!.click();
    await settle();
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<AssetApiService>('AssetApiService', ['getAllSites', 'createSite', 'updateSite']);
    api.getAllSites.and.returnValue(of([site]));
    api.createSite.and.returnValue(of(undefined));
    api.updateSite.and.returnValue(of(undefined));
    spyOn(Swal, 'fire').and.stub();
    await TestBed.configureTestingModule({
      declarations: [SiteComponent],
      imports: [CommonModule, SharedModule, FormsModule, NgbModalModule, NoopAnimationsModule],
      providers: [{ provide: AssetApiService, useValue: api }],
    }).compileComponents();
    configureMetronicPrimeNG();
    fixture = TestBed.createComponent(SiteComponent);
    modals = TestBed.inject(NgbModal);
    await settle();
  });

  afterEach(() => {
    modals.dismissAll();
    fixture.destroy();
  });

  for (const value of [0, -12.5, 1190.25]) {
    for (const edit of [false, true]) {
      it(`submits ${value} as a number when ${edit ? 'editing' : 'adding'}`, async () => {
        const root: HTMLElement = fixture.nativeElement;
        root.querySelector<HTMLElement>(edit ? '[aria-label="Edit record"]' : '.card-toolbar a')!.click();
        await settle();
        expect(input('elevation').type).toBe('number');
        expect(input('elevation').step).toBe('any');
        if (!edit) {
          for (const name of ['city', 'address', 'latitude', 'longitude'] as const) {
            await setValue(name, site[name]);
          }
        }
        await setValue('elevation', String(value));
        expect(fixture.componentInstance.siteForm.elevation).toBe(value);
        await submit();
        expect(edit ? api.updateSite : api.createSite).toHaveBeenCalledOnceWith(jasmine.objectContaining({ elevation: value }));
      });
    }
  }

  it('starts blank and rejects empty or nonnumeric elevations', async () => {
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLElement>('.card-toolbar a')!.click();
    await settle();
    expect(fixture.componentInstance.siteForm.elevation).toBeNull();
    expect(input('elevation').value).toBe('');
    for (const name of ['city', 'address', 'latitude', 'longitude'] as const) {
      await setValue(name, site[name]);
    }
    for (const value of ['', '995 m']) {
      await setValue('elevation', value);
      await submit();
      expect(api.createSite).not.toHaveBeenCalled();
      expect(document.querySelector('ngb-modal-window')).not.toBeNull();
    }
  });

  it('rejects nonfinite numbers before sending an API request', async () => {
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLElement>('[aria-label="Edit record"]')!.click();
    await settle();
    for (const value of [NaN, Infinity, -Infinity]) {
      fixture.componentInstance.siteForm.elevation = value;
      await settle();
      await submit();
      expect(api.updateSite).not.toHaveBeenCalled();
      expect(fixture.componentInstance.saving).toBeFalse();
    }
  });

  it('sorts numeric elevations including zero, negatives and decimals', () => {
    const table = fixture.componentInstance.table;
    table.setRows([995, 1190, -12.5, 0, 2.25].map((elevation) => ({ ...site, elevation })));
    table.sortBy('elevation');
    expect(table.filtered.map((row) => row.elevation)).toEqual([-12.5, 0, 2.25, 995, 1190]);
    table.sortBy('elevation');
    expect(table.filtered.map((row) => row.elevation)).toEqual([1190, 995, 2.25, 0, -12.5]);
  });
});
