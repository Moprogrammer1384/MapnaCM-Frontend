import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { DEFAULT_ORBIT_SETTINGS, OrbitSettings } from 'src/app/core/models/orbit-analysis.model';

@Component({ selector: 'app-orbit-analysis-controls', standalone: true,
  imports: [CommonModule, FormsModule, SharedModule], templateUrl: './orbit-analysis-controls.component.html' })
export class OrbitAnalysisControlsComponent {
  @Input({ required: true }) inputId: string;
  @Input() settings: OrbitSettings = DEFAULT_ORBIT_SETTINGS;
  @Output() readonly settingsChange = new EventEmitter<OrbitSettings>();
  readonly units = ['µm', 'mm', 'mil', 'in'];
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
    this.settings = { ...this.settings, filter: value === 'direct' ? 'direct' : 'order',
      order: value === 'direct' || value === 'custom' ? this.settings.order : Number(value) };
    this.settingsChange.emit(this.settings);
  }
  update<K extends keyof OrbitSettings>(key: K, value: OrbitSettings[K]): void {
    this.settings = { ...this.settings, [key]: value };
    this.settingsChange.emit(this.settings);
  }
}
