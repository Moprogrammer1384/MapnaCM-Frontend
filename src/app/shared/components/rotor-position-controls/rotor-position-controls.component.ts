import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { RotorPositionSettings, RotorPositionUnit } from 'src/app/core/models/rotor-position.model';

@Component({ selector: 'app-rotor-position-controls', standalone: true, imports: [FormsModule, SharedModule],
  templateUrl: './rotor-position-controls.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class RotorPositionControlsComponent {
  @Input({ required: true }) inputId: string;
  @Input({ required: true }) settings: RotorPositionSettings;
  @Input() nativeUnits: readonly RotorPositionUnit[] = [];
  get units(): readonly RotorPositionUnit[] { return ['µm', 'mm', ...(this.nativeUnits.includes('mil') ? ['mil' as const] : [])]; }
  @Output() readonly settingsChange = new EventEmitter<RotorPositionSettings>();
  update<K extends keyof RotorPositionSettings>(key: K, value: RotorPositionSettings[K]): void {
    this.settingsChange.emit({ ...this.settings, [key]: value });
  }
}
