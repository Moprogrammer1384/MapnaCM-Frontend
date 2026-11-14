import { Component } from '@angular/core';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { DEFAULT_WATERFALL_SETTINGS } from 'src/app/core/models/waterfall.model';

@Component({
  selector: 'app-vibration-waterfall',
  templateUrl: './waterfall.component.html',
})
export class VibrationWaterfallComponent {
  readonly defaults = DEFAULT_WATERFALL_SETTINGS;
  constructor(public state: VibrationSelectionService) {}
}
