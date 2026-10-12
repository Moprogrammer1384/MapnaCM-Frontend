import { Component } from '@angular/core';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';

@Component({
  selector: 'app-vibration-time-domain',
  templateUrl: './time-domain.component.html',
  styleUrls: ['./time-domain.component.scss'],
})
export class VibrationTimeDomainComponent {
  constructor(public state: VibrationSelectionService) {}
}
