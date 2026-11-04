import { Component } from '@angular/core';
import { DEFAULT_ORBIT_SETTINGS } from 'src/app/core/models/orbit-analysis.model';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';

@Component({ selector: 'app-vibration-orbit-analysis', templateUrl: './orbit-analysis.component.html' })
export class VibrationOrbitAnalysisComponent {
  readonly defaults = DEFAULT_ORBIT_SETTINGS;
  constructor(public state: VibrationSelectionService) {}
}
