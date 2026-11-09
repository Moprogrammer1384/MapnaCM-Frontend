import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { AssetApiService } from 'src/app/core/services/asset-taxonomy-api.service';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { flattenAssetTaxonomyTree } from 'src/app/core/utils/asset-taxonomy-tree';
import { AssetTaxonomyDrawerComponent } from 'src/app/shared/components/asset-taxonomy-drawer/asset-taxonomy-drawer.component';
import { assetTaxonomyFixture } from 'src/app/shared/components/asset-taxonomy-drawer/testing/asset-taxonomy-fixture';
import { configureMetronicPrimeNG } from 'src/app/shared/components/data-table/testing/prime-table-test-support';
import { VibrationModule } from '../vibration.module';

/** Same conditional validator binding as the authenticated layout. */
@Component({ standalone: true, imports: [RouterOutlet, AssetTaxonomyDrawerComponent],
  template: `<router-outlet></router-outlet>
    <app-asset-taxonomy-drawer [visible]="state.drawerOpen()" [selection]="state.selection()"
      [executionValidator]="state.requiresOrbitPairs() ? state.validateOrbitExecution : undefined"
      (selectionSave)="state.save($event)" (executed)="state.execute($event)" (closed)="state.drawerOpen.set(false)"></app-asset-taxonomy-drawer>` })
class RotorDrawerTestHostComponent { constructor(public state: VibrationSelectionService) {} }

describe('Rotor Position uses the Orbit drawer Execute validation', () => {
  it('disables Execute with X only or Y only and enables it only for the complete pair', async () => {
    const data = assetTaxonomyFixture();
    const api = jasmine.createSpyObj<AssetApiService>('AssetApiService', [
      'getAllPlants', 'getAllUnits', 'getAllSystems', 'getAllAssets', 'getAllComponents', 'getAllMeasurements',
    ]);
    api.getAllPlants.and.returnValue(of(data.plants)); api.getAllUnits.and.returnValue(of(data.units));
    api.getAllSystems.and.returnValue(of(data.systems)); api.getAllAssets.and.returnValue(of(data.assets));
    api.getAllComponents.and.returnValue(of(data.components)); api.getAllMeasurements.and.returnValue(of(data.measurements));
    await TestBed.configureTestingModule({ imports: [NoopAnimationsModule], providers: [VibrationSelectionService,
      { provide: AssetApiService, useValue: api },
      provideRouter([{ path: 'cm/vibration', component: RotorDrawerTestHostComponent, children: [{ path: '', loadChildren: () => VibrationModule }] }]),
    ] }).compileComponents(); configureMetronicPrimeNG();
    const state = TestBed.inject(VibrationSelectionService); state.setRoute('/cm/vibration/rotor-position');
    const harness = await RouterTestingHarness.create('/cm/vibration/rotor-position');
    const settle = async () => { harness.fixture.detectChanges(); await harness.fixture.whenStable(); harness.fixture.detectChanges(); };
    try {
      state.open(); await settle();
      const root = harness.routeNativeElement!;
      const plant = root.querySelector<HTMLSelectElement>('select[aria-label="Plant"]')!;
      window.jQuery(plant).val(Array.from(plant.options).find(option => option.text.includes('First plant'))!.value).trigger('change'); await settle();
      const drawer = harness.fixture.debugElement.query(By.directive(AssetTaxonomyDrawerComponent)).componentInstance as AssetTaxonomyDrawerComponent;
      for (const node of flattenAssetTaxonomyTree(drawer.nodes)) { node.expanded = true; } await settle();
      const execute = Array.from(root.querySelectorAll<HTMLButtonElement>('app-asset-taxonomy-drawer button')).find(button => button.textContent!.trim() === 'Execute')!;
      const click = async (name: string) => { root.querySelector<HTMLElement>(`[role="treeitem"][aria-label="${name}"] > .p-tree-node-content`)!.click(); await settle(); };
      await click('Velocity X'); expect(execute.disabled).toBeTrue(); execute.click(); await settle(); expect(state.tabs().length).toBe(0);
      await click('Velocity Y'); expect(execute.disabled).toBeFalse();
      await click('Velocity X'); expect(execute.disabled).toBeTrue();
      await click('Velocity X'); expect(execute.disabled).toBeFalse(); execute.click(); await settle();
      expect(state.tabs().length).toBe(1); expect(state.drawerOpen()).toBeFalse();
      expect(root.querySelector('app-rotor-position-event-picker')).not.toBeNull();
      expect(root.querySelector('app-orbit-analysis-controls')).toBeNull();
    } finally { harness.fixture.destroy(); }
  });
});
