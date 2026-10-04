import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { SiteComponent } from './site/site.component';
import { PlantComponent } from './plant/plant.component';
import { UnitComponent } from './unit/unit.component';
import { SystemComponent } from './system/system.component';
import { AssetComponent } from './asset/asset.component';
import { ComponentComponent } from './component/component.component';
import { MeasurementComponent } from './measurement/measurement.component';

@NgModule({
  declarations: [
    SiteComponent,
    PlantComponent,
    UnitComponent,
    SystemComponent,
    AssetComponent,
    ComponentComponent,
    MeasurementComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: 'site',
        component: SiteComponent,
      },
      {
        path: 'plant',
        component: PlantComponent,
      },
      {
        path: 'unit',
        component: UnitComponent,
      },
      {
        path: 'system',
        component: SystemComponent,
      },
      {
        path: 'asset',
        component: AssetComponent,
      },
      {
        path: 'component',
        component: ComponentComponent,
      },
      {
        path: 'measurement',
        component: MeasurementComponent,
      },
      { path: '', redirectTo: 'site', pathMatch: 'full' },
    ]),
  ],
})
export class AssetTaxonomyModule {}
