import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { AnalysisTab } from 'src/app/core/models/vibration/analysis-panel.model';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { AnalysisControlsComponent } from '../../analysis-workspace-panel/analysis-controls/analysis-controls.component';

@Component({
  selector: 'app-overview-controls',
  standalone: true,
  imports: [AnalysisControlsComponent],
  templateUrl: './overview-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block mw-100' },
})
export class OverviewControlsComponent {
  @Input({ required: true }) tab: AnalysisTab;
  protected readonly state = inject(VibrationSelectionService);
}
