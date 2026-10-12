import { Component } from '@angular/core';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';

@Component({
  selector: 'app-vibration-frequency-domain',
  templateUrl: './frequency-domain.component.html',
  styleUrls: ['./frequency-domain.component.scss'],
})
export class VibrationFrequencyDomainComponent {
  constructor(public state: VibrationSelectionService) {}
}
