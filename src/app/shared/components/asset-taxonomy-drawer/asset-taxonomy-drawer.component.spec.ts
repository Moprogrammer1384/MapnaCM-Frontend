import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, of, throwError } from 'rxjs';
import { DrawerComponent, DrawerStore } from 'src/app/_metronic/kt/components/_DrawerComponent';
import { AssetTaxonomySelection } from 'src/app/core/models/asset-taxonomy-selection.model';
import { Plant } from 'src/app/core/models/asset-taxonomy.model';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { flattenAssetTaxonomyTree } from 'src/app/core/utils/asset-taxonomy-tree';
import { configureMetronicPrimeNG } from '../data-table/testing/prime-table-test-support';
import { AssetTaxonomyDrawerComponent } from './asset-taxonomy-drawer.component';
import { assetTaxonomyFixture } from './testing/asset-taxonomy-fixture';

@Component({
  template: `<button type="button" (click)="open = true">Open</button>
    <app-asset-taxonomy-drawer drawerId="test_taxonomy_drawer" [visible]="open" [selection]="saved"
      (selectionSave)="saved = $event" (closed)="open = false"></app-asset-taxonomy-drawer>`,
})
class DrawerHostComponent {
  open = false;
  saved: AssetTaxonomySelection | null = null;
}

describe('AssetTaxonomyDrawerComponent with real PrimeNG Tree / Select2 / Metronic', () => {
  let fixture: ComponentFixture<DrawerHostComponent>;
  let host: DrawerHostComponent;
  let drawer: AssetTaxonomyDrawerComponent;
  let api: jasmine.SpyObj<AssetApiService>;
  let root: HTMLElement;
  let initialTheme: string | null;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
  };
  const open = async () => { host.open = true; await settle(); };
  const choosePlant = async (id: number) => {
    const select = root.querySelector<HTMLSelectElement>('select')!;
    select.value = Array.from(select.options).find(option => option.text.includes(id === 0 ? 'First plant' : 'Second plant'))!.value;
    window.jQuery(select).trigger('change');
    await settle();
  };
  const expandAll = async () => {
    for (const node of flattenAssetTaxonomyTree(drawer.nodes)) { node.expanded = true; }
    await settle();
  };
  const item = (name: string) => root.querySelector<HTMLElement>(`[role="treeitem"][aria-label="${name}"]`)!;
  const clickMeasurement = async (name: string) => {
    item(name).querySelector<HTMLElement>(':scope > .p-tree-node-content')!.click();
    await settle();
  };
  const button = (label: string) => Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(element => element.textContent?.trim() === label)!;

  beforeEach(async () => {
    const data = assetTaxonomyFixture();
    Object.assign(data.measurements[0], { measurementTypeId: 9, typeName: 'Retired type', unit: 'mm/s' });
    api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
      'getAllPlants', 'getAllUnits', 'getAllSystems', 'getAllAssets', 'getAllComponents', 'getAllMeasurements',
    ]);
    api.getAllPlants.and.returnValue(of(data.plants));
    api.getAllUnits.and.returnValue(of(data.units));
    api.getAllSystems.and.returnValue(of(data.systems));
    api.getAllAssets.and.returnValue(of(data.assets));
    api.getAllComponents.and.returnValue(of(data.components));
    api.getAllMeasurements.and.returnValue(of(data.measurements));
    await TestBed.configureTestingModule({
      declarations: [DrawerHostComponent], imports: [AssetTaxonomyDrawerComponent, NoopAnimationsModule],
      providers: [{ provide: AssetApiService, useValue: api }],
    }).compileComponents();
    configureMetronicPrimeNG();
    initialTheme = document.documentElement.getAttribute('data-bs-theme');
    fixture = TestBed.createComponent(DrawerHostComponent);
    host = fixture.componentInstance;
    await settle();
    drawer = fixture.debugElement.query(By.directive(AssetTaxonomyDrawerComponent)).componentInstance;
    root = fixture.nativeElement.querySelector('#test_taxonomy_drawer');
  });

  afterEach(() => {
    fixture.destroy();
    if (initialTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); }
    else { document.documentElement.setAttribute('data-bs-theme', initialTheme); }
  });

  it('loads on opening, uses searchable Metronic Select2 and builds the chosen plant only', async () => {
    expect(api.getAllPlants).not.toHaveBeenCalled();
    expect(root.inert).toBeTrue();
    await open();
    expect(root.getAttribute('aria-modal')).toBe('true');
    expect(root.inert).toBeFalse();
    expect(root.querySelector('.select2-selection[aria-label="Plant"]')).not.toBeNull();
    expect(button('Save')).toBeUndefined();
    expect(button('Clear selection')).toBeUndefined();
    expect(root.textContent).not.toContain('Other Units are locked');
    await choosePlant(0);
    expect(drawer.nodes.map(node => node.data.id)).toEqual([0, 10]);
    expect(root.querySelector('[role="tree"]')).not.toBeNull();
    const parent = item('System zero');
    parent.querySelector<HTMLButtonElement>(':scope > .p-tree-node-content button')!.click();
    await settle();
    expect(parent.getAttribute('aria-expanded')).toBe('true');
  });

  it('supports being mounted open with an existing selection', async () => {
    fixture.destroy();
    fixture = TestBed.createComponent(DrawerHostComponent);
    host = fixture.componentInstance;
    host.open = true;
    host.saved = { plantId: 0, unitId: 0, measurementIds: [0] };
    await settle();
    drawer = fixture.debugElement.query(By.directive(AssetTaxonomyDrawerComponent)).componentInstance;
    root = fixture.nativeElement.querySelector('#test_taxonomy_drawer');
    expect(drawer.isOpen()).toBeTrue();
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([0]);
    expect(DrawerComponent.getInstance('test_taxonomy_drawer')!.isShown()).toBeTrue();
  });

  it('keeps Plant interaction, the tree and selection open across viewport resizes, while still allowing overlay dismissal', async () => {
    const registration = spyOn(window, 'addEventListener').and.callThrough();
    DrawerComponent.initGlobalHandlers();
    const resizeListener = registration.calls.allArgs().find(args => args[0] === 'resize')![1];
    const resize = async () => {
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 250));
      await settle();
    };
    try {
      await open();
      window.jQuery(root.querySelector('select')!).select2('open');
      await resize();
      expect(host.open).toBeTrue();
      expect(drawer.isOpen()).toBeTrue();
      expect(root.inert).toBeFalse();
      expect(root.querySelector('.select2-dropdown')).not.toBeNull();

      const plantOption = Array.from(root.querySelectorAll<HTMLElement>('.select2-results__option'))
        .find(option => option.textContent?.includes('First plant'))!;
      plantOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await settle();
      expect(drawer.plantId).toBe(0);
      expect(root.querySelector('.select2-dropdown')).toBeNull();
      await expandAll();
      await clickMeasurement('Velocity X');
      const nodes = drawer.nodes;
      const overlay = document.querySelector<HTMLElement>('.drawer-overlay')!;
      await resize();
      expect(DrawerComponent.getInstance('test_taxonomy_drawer')!.isShown()).toBeTrue();
      expect(host.open).toBeTrue();
      expect(drawer.nodes).toBe(nodes);
      expect(root.querySelector('[role="tree"]')).not.toBeNull();
      expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([0]);
      expect(host.saved).toEqual({ plantId: 0, unitId: 0, measurementIds: [0] });
      expect(api.getAllPlants).toHaveBeenCalledTimes(1);
      expect(document.querySelector('.drawer-overlay')).toBe(overlay);

      overlay.click();
      await settle();
      await resize();
      expect(host.open).toBeFalse();
      expect(drawer.isOpen()).toBeFalse();
      expect(root.inert).toBeTrue();
      expect(root.classList.contains('drawer-on')).toBeFalse();
      expect(document.querySelector('.drawer-overlay')).toBeNull();
      expect(host.saved?.measurementIds).toEqual([0]);
    } finally {
      window.removeEventListener('resize', resizeListener);
    }
  });

  it('executes a complete measurement snapshot and closes only after a valid selection', async () => {
    const execute = spyOn(drawer.executed, 'emit');
    await open();
    expect(button('Execute').disabled).toBeTrue();
    drawer.executeSelection();
    expect(execute).not.toHaveBeenCalled();
    await choosePlant(0); await expandAll(); await clickMeasurement('Velocity X');
    expect(item('Velocity X').textContent).not.toContain('mm/s');
    expect(item('Velocity X').textContent).not.toContain('Retired type');
    expect(button('Execute').disabled).toBeFalse();
    button('Execute').click(); await settle();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.calls.mostRecent().args[0]!.measurements[0].asset.name).toBe('Asset zero');
    expect(execute.calls.mostRecent().args[0]!.plantLabel).toBe('Site zero - Gas turbine - First plant');
    expect(execute.calls.mostRecent().args[0]!.selection).toEqual({ plantId: 0, unitId: 0, measurementIds: [0] });
    const details = execute.calls.mostRecent().args[0]!.measurements[0];
    expect('typeName' in details).toBeFalse();
    expect('measurementUnit' in details).toBeFalse();
    expect(host.open).toBeFalse();
  });

  it('returns focus to the opener after Escape', async () => {
    const trigger = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    trigger.focus(); trigger.click(); await settle();
    root.querySelector<HTMLButtonElement>('[aria-label="Close measurement selection"]')!.focus();
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await settle();
    expect(host.open).toBeFalse();
    expect(document.activeElement).toBe(trigger);
  });

  it('expands and collapses branch labels at every level without selecting or saving branches', async () => {
    await open(); await choosePlant(0);
    const emitted = spyOn(drawer.selectionSave, 'emit').and.callThrough();
    const label = (name: string) => item(name).querySelector<HTMLButtonElement>(':scope > .p-tree-node-content .taxonomy-branch button')!;
    for (const name of ['Unit zero', 'System zero', 'Asset zero', 'Bearing A']) {
      const branch = item(name);
      const initiallyExpanded = branch.getAttribute('aria-expanded') === 'true';
      label(name).click(); await settle();
      expect(branch.getAttribute('aria-expanded')).toBe(String(!initiallyExpanded));
      label(name).click(); await settle();
      expect(branch.getAttribute('aria-expanded')).toBe(String(initiallyExpanded));
      if (!initiallyExpanded) { label(name).click(); await settle(); }
    }
    expect(item('Velocity X')).not.toBeNull();
    expect(drawer.selectedNodes).toEqual([]);
    expect(emitted).not.toHaveBeenCalled();
    const filter = root.querySelector<HTMLInputElement>('.p-tree-filter-input')!;
    filter.value = 'Velocity X'; filter.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    label('Bearing A').click(); await settle();
    expect(item('Bearing A').getAttribute('aria-expanded')).toBe('false');
    label('Bearing A').click(); await settle();
    await clickMeasurement('Velocity X');
    expect(host.saved).toEqual({ plantId: 0, unitId: 0, measurementIds: [0] });
  });

  it('selects multiple components in one Asset, blocks other Assets including the same Unit and releases the lock on last unselect', async () => {
    await open(); await choosePlant(0); await expandAll();
    await clickMeasurement('Velocity X');
    await clickMeasurement('Displacement X');
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([0, 2]);
    expect(host.saved).toEqual({ plantId: 0, unitId: 0, measurementIds: [0, 2] });
    expect(host.open).toBeTrue();
    expect(drawer.activeAssetId).toBe(0);
    expect(item('Another asset velocity').querySelector<HTMLInputElement>('input')!.disabled).toBeTrue();
    await clickMeasurement('Another asset velocity');
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([0, 2]);
    expect(item('Other Unit velocity').querySelector<HTMLInputElement>('input')!.disabled).toBeTrue();
    await clickMeasurement('Other Unit velocity');
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([0, 2]);
    await clickMeasurement('Velocity X'); await clickMeasurement('Displacement X');
    expect(drawer.activeUnitId).toBeNull();
    expect(drawer.activeAssetId).toBeNull();
    expect(item('Another asset velocity').querySelector<HTMLInputElement>('input')!.disabled).toBeFalse();
    expect(host.saved).toBeNull();
    expect(item('Other Unit velocity').querySelector<HTMLInputElement>('input')!.disabled).toBeFalse();
    await clickMeasurement('Other Unit velocity');
    expect(drawer.activeUnitId).toBe(10);
    expect(item('Velocity X').querySelector<HTMLInputElement>('input')!.disabled).toBeTrue();
  });

  it('retains the one-Asset rule through keyboard selection and filtering within the same Unit', async () => {
    await open(); await choosePlant(0); await expandAll();
    item('Velocity X').dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    await settle();
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([0]);
    const filter = root.querySelector<HTMLInputElement>('.p-tree-filter-input')!;
    filter.value = 'Another asset velocity'; filter.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    await clickMeasurement('Another asset velocity');
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([0]);
    filter.value = ''; filter.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    await clickMeasurement('Velocity X');
    expect(host.saved).toBeNull();
    filter.value = 'Another asset velocity'; filter.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    await clickMeasurement('Another asset velocity');
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([3]);
  });

  it('saves each measurement change immediately, stays open and restores the latest selection after close', async () => {
    await open(); await choosePlant(0); await expandAll();
    await clickMeasurement('Velocity X');
    expect(host.saved).toEqual({ plantId: 0, unitId: 0, measurementIds: [0] });
    await clickMeasurement('Displacement X');
    expect(host.saved).toEqual({ plantId: 0, unitId: 0, measurementIds: [0, 2] });
    expect(host.open).toBeTrue();
    drawer.close(); await settle();
    await open();
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([0, 2]);
    expect(item('Velocity X')).not.toBeNull();
    await clickMeasurement('Velocity X');
    expect(host.saved).toEqual({ plantId: 0, unitId: 0, measurementIds: [2] });
    drawer.close(); await settle();
    await open();
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([2]);
  });

  it('clears the previous plant selection immediately on plant changes, and reset commits an empty selection', async () => {
    host.saved = { plantId: 0, unitId: 0, measurementIds: [0] };
    await open(); await choosePlant(8);
    expect(drawer.selectedNodes).toEqual([]);
    expect(host.saved).toBeNull();
    await expandAll();
    await clickMeasurement('Other plant velocity');
    expect(host.saved).toEqual({ plantId: 8, unitId: 80, measurementIds: [80] });
    button('Reset').click(); await settle();
    expect(host.saved).toBeNull();
    expect(drawer.plantId).toBeNull();
    expect(host.open).toBeTrue();
    drawer.close(); await settle(); await open();
    expect(drawer.plantId).toBeNull();
    expect(drawer.selectedNodes).toEqual([]);
  });

  it('reconciles removed or reparented saved measurements and rejects cross-Asset candidates', async () => {
    host.saved = { plantId: 0, unitId: 0, measurementIds: [0, 3, 10, 999] };
    await open();
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([0]);
    expect(drawer.status).toContain('no longer available');
    expect(host.saved?.measurementIds).toEqual([0, 3, 10, 999]);
    drawer.selectNodes(flattenAssetTaxonomyTree(drawer.nodes).filter(node => node.data.kind === 'Measurement'));
    expect(drawer.selectedNodes.map(node => node.data.id)).toEqual([0, 1, 2]);
    expect(host.saved?.measurementIds).toEqual([0, 1, 2]);
  });

  it('shows failures and retries without overwriting saved values or saving incomplete reads', async () => {
    host.saved = { plantId: 0, unitId: 0, measurementIds: [0] };
    api.getAllMeasurements.and.returnValue(throwError(() => new Error('Measurements unavailable')));
    await open();
    expect(root.querySelector('[role="alert"]')!.textContent).toContain('Measurements unavailable');
    expect(button('Execute').disabled).toBeTrue();
    drawer.selectNodes([]);
    expect(host.saved?.measurementIds).toEqual([0]);
    api.getAllMeasurements.and.returnValue(of(assetTaxonomyFixture().measurements));
    button('Retry').click(); await settle();
    expect(drawer.requestState.ready).toBeTrue();
    expect(api.getAllMeasurements).toHaveBeenCalledTimes(2);
    await choosePlant(0);
    expect(drawer.nodes.length).toBe(2);
  });

  it('cancels pending loads and cleans overlays/store on dismissal and destruction', async () => {
    const plants = new Subject<Plant[]>();
    api.getAllPlants.and.returnValue(plants);
    await open();
    expect(drawer.requestState.loading()).toBeTrue();
    expect(button('Execute').disabled).toBeTrue();
    const emitted = spyOn(drawer.selectionSave, 'emit');
    drawer.selectNodes([]);
    expect(emitted).not.toHaveBeenCalled();
    expect(plants.observers.length).toBe(1);
    DrawerComponent.getInstance('test_taxonomy_drawer')!.hide();
    await settle();
    expect(host.open).toBeFalse();
    expect(plants.observers.length).toBe(0);
    await open();
    expect(document.querySelector('.drawer-overlay')).not.toBeNull();
    fixture.destroy();
    expect(plants.observers.length).toBe(0);
    expect(document.querySelector('.drawer-overlay')).toBeNull();
    expect(DrawerStore.has('test_taxonomy_drawer')).toBeFalse();
  });

  it('uses Metronic theme tokens for Tree and Select2 in light and dark modes', async () => {
    await open(); await choosePlant(0); await expandAll();
    await clickMeasurement('Velocity X');
    for (const mode of ['light', 'dark']) {
      document.documentElement.setAttribute('data-bs-theme', mode);
      await settle();
      const reference = document.createElement('span');
      reference.className = 'bg-light-primary text-gray-700';
      root.appendChild(reference);
      const selected = item('Velocity X').querySelector<HTMLElement>(':scope > .p-tree-node-content')!;
      expect(getComputedStyle(selected).backgroundColor).toBe(getComputedStyle(reference).backgroundColor);
      expect(getComputedStyle(root.querySelector('.darp-taxonomy-tree')!).color).toBe(getComputedStyle(reference).color);
      expect(getComputedStyle(root.querySelector('.p-tree-filter-input')!).fontFamily).toBe(getComputedStyle(root.querySelector('select')!).fontFamily);
      reference.remove();
    }
    expect(root.querySelector('.p-tree-node-content:has(.taxonomy-branch) > p-checkbox')!.getBoundingClientRect().width).toBe(0);
    expect(item('Velocity X').querySelector('.p-checkbox-box')!.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  it('keeps the footer visible and the tree within mobile and desktop drawer widths', async () => {
    await open(); await choosePlant(0); await expandAll();
    const iframe = document.createElement('iframe');
    iframe.style.border = '0';
    iframe.height = '640';
    document.body.appendChild(iframe);
    try {
      const target = iframe.contentDocument!;
      const loading: Promise<void>[] = [];
      for (const element of Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))) {
        const copy = element.cloneNode(true) as HTMLLinkElement;
        if (element instanceof HTMLLinkElement) {
          copy.href = element.href;
          loading.push(new Promise(resolve => { copy.onload = () => resolve(); }));
        }
        target.head.appendChild(copy);
      }
      await Promise.all(loading);
      const clone = root.cloneNode(true) as HTMLElement;
      target.body.appendChild(clone);
      for (const width of [320, 1280]) {
        iframe.width = String(width);
        await new Promise(resolve => setTimeout(resolve, 0));
        clone.style.width = width === 320 ? '300px' : '600px';
        const bounds = clone.getBoundingClientRect();
        expect(bounds.width).toBeLessThanOrEqual(width);
        const footer = clone.querySelector('.card-footer')!.getBoundingClientRect();
        expect(footer.bottom).toBeLessThanOrEqual(640);
        expect(footer.height).toBeGreaterThan(0);
        const tree = clone.querySelector('.darp-taxonomy-tree')!;
        expect(tree.getBoundingClientRect().width).toBeLessThanOrEqual(bounds.width);
        expect(tree.scrollWidth).toBeLessThanOrEqual(bounds.width);
      }
    } finally {
      iframe.remove();
    }
  });
});
