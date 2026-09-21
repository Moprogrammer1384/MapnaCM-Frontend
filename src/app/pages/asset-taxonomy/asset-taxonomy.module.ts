import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { SiteComponent } from './site/site.component';
import { PlantComponent } from './plant/plant.component';

@NgModule({
  declarations: [SiteComponent, PlantComponent],
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
      { path: '', redirectTo: 'site', pathMatch: 'full' },
    ]),
  ],
})
export class AssetTaxonomyModule {}
