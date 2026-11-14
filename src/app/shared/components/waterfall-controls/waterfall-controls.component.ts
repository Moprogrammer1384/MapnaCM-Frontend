import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { WaterfallEventType, WaterfallSettings } from 'src/app/core/models/waterfall.model';
import { vibrationUnitOptions } from 'src/app/core/models/analysis-chart-settings.model';

@Component({
  selector: 'app-waterfall-controls', standalone: true, imports: [FormsModule, SharedModule],
  templateUrl: './waterfall-controls.component.html',
})
export class WaterfallControlsComponent {
  @Input({ required: true }) inputId: string;
  @Input({ required: true }) settings: WaterfallSettings;
  @Input() eventType?: WaterfallEventType;
  @Output() readonly settingsChange = new EventEmitter<WaterfallSettings>();
  get units() { return vibrationUnitOptions(this.settings.quantity); }
  update<K extends keyof WaterfallSettings>(key: K, value: WaterfallSettings[K]): void {
    const settings = { ...this.settings, [key]: value };
    const units = vibrationUnitOptions(settings.quantity);
    this.settingsChange.emit({ ...settings, depthAxis: this.eventType === 'SteadyState' ? 'time' : settings.depthAxis,
      unit: units.find(unit => unit.value === settings.unit)?.value ?? units[0].value });
  }
}
