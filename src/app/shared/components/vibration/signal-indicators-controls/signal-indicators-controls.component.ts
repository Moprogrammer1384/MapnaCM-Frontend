import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { AnalysisTab } from 'src/app/core/models/vibration/analysis-panel.model';
import { VibrationSelectionService } from 'src/app/core/services/vibration-selection.service';
import { AnalysisControlsComponent } from '../../analysis-workspace-panel/analysis-controls/analysis-controls.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';

@Component({
  selector: 'app-signal-indicators-controls',
  standalone: true,
  imports: [AnalysisControlsComponent, FormsModule, SharedModule],
  templateUrl: './signal-indicators-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'd-block mw-100' },
})
export class SignalIndicatorsControlsComponent {
  @Input({ required: true }) tab: AnalysisTab;
  protected readonly state = inject(VibrationSelectionService);
}
