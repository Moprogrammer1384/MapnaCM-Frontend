import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { AnalysisTab } from 'src/app/core/models/vibration/analysis-panel.model';
import { CmSelectionService } from 'src/app/core/services/cm-selection.service';
import { AnalysisControlsComponent } from '../../analysis-workspace-panel/analysis-controls/analysis-controls.component';
import { AsyncPipe } from '@angular/common';
import { TimeDomainCaptureAvailabilityApiService } from 'src/app/core/services/vibration/api/time-domain-capture-availability-api.service';
import { VibrationEventPickerComponent } from '../event-picker/event-picker.component';

@Component({
  selector: 'app-frequency-domain-controls',
  standalone: true,
  imports: [AnalysisControlsComponent, AsyncPipe, VibrationEventPickerComponent],
  templateUrl: './frequency-domain-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block mw-100' },
})
export class FrequencyDomainControlsComponent {
  @Input({ required: true }) tab: AnalysisTab;
  protected readonly state = inject(CmSelectionService);
  protected readonly captureAvailability = inject(TimeDomainCaptureAvailabilityApiService);
  protected readonly emptyRange = { from: '', to: '' };
}
