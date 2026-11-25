import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { DEFAULT_WATERFALL_SETTINGS, WaterfallSettings } from 'src/app/core/models/vibration/waterfall/waterfall.model';
import { vibrationUnitOptions } from 'src/app/core/models/vibration/analysis-chart-settings.model';

import { AnalysisTab } from 'src/app/core/models/vibration/analysis-panel.model';
import { AnalysisControlsComponent } from '../../analysis-workspace-panel/analysis-controls/analysis-controls.component';
import { WaterfallAcquisitionPickerComponent } from '../waterfall-acquisition-picker/waterfall-acquisition-picker.component';
import { CmSelectionService } from 'src/app/core/services/cm-selection.service';

@Component({
  selector: 'app-waterfall-controls', standalone: true, host: { class: 'd-block mw-100' }, imports: [AnalysisControlsComponent, WaterfallAcquisitionPickerComponent, FormsModule, SharedModule],
  templateUrl: './waterfall-controls.component.html',
})
export class WaterfallControlsComponent {
  @Input({ required: true }) tab: AnalysisTab;
  protected readonly state = inject(CmSelectionService);
  protected get settings(): WaterfallSettings { return this.tab.waterfallSettings ?? DEFAULT_WATERFALL_SETTINGS; }
  protected get eventType() { return this.tab.waterfallEvent?.eventType; }
  protected get hasSpeed() { return this.tab.waterfallEvent?.hasSpeed !== false; }
  get units() { return vibrationUnitOptions(this.settings.quantity); }
  update<K extends keyof WaterfallSettings>(key: K, value: WaterfallSettings[K]): void {
    const settings = { ...this.settings, [key]: value };
    const units = vibrationUnitOptions(settings.quantity);
    this.state.updateWaterfallSettings(this.tab.id, { ...settings, depthAxis: (this.eventType === 'SteadyState' || !this.hasSpeed) ? 'time' : settings.depthAxis,
      unit: units.find(unit => unit.value === settings.unit)?.value ?? units[0].value });
  }
}
