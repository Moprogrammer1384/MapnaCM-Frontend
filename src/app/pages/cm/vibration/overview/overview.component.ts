import { Component } from '@angular/core';
import { TIME_AVAILABILITY_SOURCE } from 'src/app/core/services/time-availability.service';
import { VibrationSignalIndicatorApiService } from 'src/app/core/services/vibration/api/vibration-signal-indicator-api.service';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';

@Component({
  selector: 'app-vibration-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  providers: [{ provide: TIME_AVAILABILITY_SOURCE, useExisting: VibrationSignalIndicatorApiService }],
})
export class VibrationOverviewComponent {
  constructor(public state: VibrationSelectionService) {}
}
