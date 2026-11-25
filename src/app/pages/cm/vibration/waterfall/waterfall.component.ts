import { Component } from '@angular/core';
import { CmSelectionService } from 'src/app/core/services/cm-selection.service';
import { DEFAULT_WATERFALL_SETTINGS } from 'src/app/core/models/vibration/waterfall/waterfall.model';

@Component({
  selector: 'app-vibration-waterfall',
  templateUrl: './waterfall.component.html',
})
export class VibrationWaterfallComponent {
  readonly defaults = DEFAULT_WATERFALL_SETTINGS;
  constructor(public state: CmSelectionService) {}
}
