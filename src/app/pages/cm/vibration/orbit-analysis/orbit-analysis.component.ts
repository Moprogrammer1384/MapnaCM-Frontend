import { Component } from '@angular/core';
import { DEFAULT_ORBIT_SETTINGS } from 'src/app/core/models/vibration/orbit-analysis/orbit-analysis.model';
import { CmSelectionService } from 'src/app/core/services/cm-selection.service';

@Component({ selector: 'app-vibration-orbit-analysis', templateUrl: './orbit-analysis.component.html' })
export class VibrationOrbitAnalysisComponent {
  readonly defaults = DEFAULT_ORBIT_SETTINGS;
  constructor(public state: CmSelectionService) {}
}
