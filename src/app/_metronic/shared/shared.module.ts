import {NgModule} from '@angular/core';
import {KeeniconComponent} from './keenicon/keenicon.component';
import {CommonModule} from "@angular/common";
import { Select2Directive } from './select2/select2.directive';

@NgModule({
  declarations: [
    KeeniconComponent,
    Select2Directive
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    KeeniconComponent,
    Select2Directive
  ]
})
export class SharedModule {
}
