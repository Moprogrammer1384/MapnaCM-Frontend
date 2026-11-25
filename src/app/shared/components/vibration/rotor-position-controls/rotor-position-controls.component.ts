import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { RotorPositionSettings, RotorPositionUnit } from 'src/app/core/models/vibration/rotor-position/rotor-position.model';

import { AnalysisTab } from 'src/app/core/models/vibration/analysis-panel.model';
import { AnalysisControlsComponent } from '../../analysis-workspace-panel/analysis-controls/analysis-controls.component';
import { RotorPositionEventPickerComponent } from '../rotor-position-event-picker/rotor-position-event-picker.component';
import { RotorPositionTabStateService } from 'src/app/core/services/vibration/rotor-position/rotor-position-tab-state.service';

@Component({ selector: 'app-rotor-position-controls', standalone: true, host: { class: 'd-block mw-100' }, imports: [AnalysisControlsComponent, RotorPositionEventPickerComponent, FormsModule, SharedModule],
  templateUrl: './rotor-position-controls.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class RotorPositionControlsComponent {
  @Input({ required: true }) tab: AnalysisTab;
  private readonly sessions = inject(RotorPositionTabStateService);
  protected get session() { return this.sessions.forTab(this.tab); }
  protected get settings() { return this.session.settings(); }
  get units(): readonly RotorPositionUnit[] { return ['µm', 'mm', ...(['mil', 'in'] as const).filter(unit => this.session.nativeUnits().includes(unit))]; }
  update<K extends keyof RotorPositionSettings>(key: K, value: RotorPositionSettings[K]): void {
    this.session.settings.set({ ...this.settings, [key]: value });
  }
}
