import { Component } from '@angular/core';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';

@Component({
  selector: 'app-vibration-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class VibrationOverviewComponent {
  constructor(public state: VibrationSelectionService) {}
}
