import { Component } from '@angular/core';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';

@Component({
  selector: 'app-vibration-rotor-position',
  templateUrl: './rotor-position.component.html',
  styleUrls: ['./rotor-position.component.scss'],
})
export class VibrationRotorPositionComponent {
  constructor(public state: VibrationSelectionService) {}
}
