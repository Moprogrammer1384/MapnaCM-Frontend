import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { DEFAULT_ORBIT_SETTINGS, OrbitSettings } from 'src/app/core/models/vibration/orbit-analysis/orbit-analysis.model';

import { AnalysisTab } from 'src/app/core/models/vibration/analysis-panel.model';
import { AnalysisControlsComponent } from '../../analysis-workspace-panel/analysis-controls/analysis-controls.component';
import { OrbitAcquisitionPickerComponent } from '../orbit-analysis-acquisition-picker/orbit-analysis-acquisition-picker.component';
import { CmSelectionService } from 'src/app/core/services/cm-selection.service';

@Component({ selector: 'app-orbit-analysis-controls', standalone: true,
  host: { class: 'd-block mw-100' }, imports: [AnalysisControlsComponent, OrbitAcquisitionPickerComponent, CommonModule, FormsModule, SharedModule], templateUrl: './orbit-analysis-controls.component.html' })
export class OrbitAnalysisControlsComponent {
  @Input({ required: true }) tab: AnalysisTab;
  protected readonly state = inject(CmSelectionService);
  protected get settings(): OrbitSettings { return this.tab.orbitSettings ?? DEFAULT_ORBIT_SETTINGS; }
  readonly units = ['µm', 'mm'];
  readonly orders = [
    { value: 1 / 8, label: '⅛X' }, { value: 1 / 4, label: '¼X' }, { value: 1 / 3, label: '⅓X' }, { value: 1 / 2, label: '½X' },
    ...Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1}X` })),
  ];
  customOrder = false;
  get selectedFilter(): string {
    if (this.settings.filter === 'direct') { return 'direct'; }
    return !this.customOrder && this.orders.some(item => item.value === this.settings.order) ? String(this.settings.order) : 'custom';
  }
  selectFilter(value: string): void {
    this.customOrder = value === 'custom';
    this.state.updateOrbitSettings(this.tab.id, { ...this.settings, filter: value === 'direct' ? 'direct' : 'order',
      order: value === 'direct' || value === 'custom' ? this.settings.order : Number(value) });
  }
  update<K extends keyof OrbitSettings>(key: K, value: OrbitSettings[K]): void {
    this.state.updateOrbitSettings(this.tab.id, { ...this.settings, [key]: value });
  }
}
