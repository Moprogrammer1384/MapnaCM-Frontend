import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RotorPositionTabStateService } from 'src/app/core/services/vibration/rotor-position/rotor-position-tab-state.service';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';

@Component({
  selector: 'app-vibration-rotor-position',
  templateUrl: './rotor-position.component.html',
  styleUrls: ['./rotor-position.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block mw-100' },
})
export class VibrationRotorPositionComponent {
  constructor(public state: VibrationSelectionService, public sessions: RotorPositionTabStateService) {}
}
