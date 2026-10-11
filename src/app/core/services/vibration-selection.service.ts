import { Injectable, signal } from '@angular/core';
import type { AssetTaxonomySelection } from '../models/asset-taxonomy-selection.model';

/** Provided by the authenticated layout: shared across vibration routes, cleared on logout. */
@Injectable()
export class VibrationSelectionService {
  readonly active = signal(false);
  readonly drawerOpen = signal(false);
  private readonly savedSelection = signal<AssetTaxonomySelection | null>(null);
  readonly selection = this.savedSelection.asReadonly();

  setRoute(url: string): void {
    this.active.set(/^\/cm\/vibration(?:\/|[?#]|$)/.test(url));
    this.drawerOpen.set(false);
  }

  open(): void {
    if (this.active()) {
      this.drawerOpen.set(true);
    }
  }

  save(selection: AssetTaxonomySelection | null): void {
    this.savedSelection.set(selection ? {
      ...selection, measurementIds: [...new Set(selection.measurementIds)],
    } : null);
  }
}
