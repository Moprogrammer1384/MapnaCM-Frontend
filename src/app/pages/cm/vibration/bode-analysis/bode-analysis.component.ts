import { Component } from '@angular/core';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';

@Component({
  selector: 'app-vibration-bode-analysis',
  templateUrl: './bode-analysis.component.html',
  styleUrls: ['./bode-analysis.component.scss'],
})
export class VibrationBodeAnalysisComponent {
  constructor(public state: VibrationSelectionService) {}
}
