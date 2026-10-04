import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { ComponentPayload, TaxonomyComponent } from '../../../core/models/asset.model';

/** Browser persistence until a Component API is available. */
@Injectable({ providedIn: 'root' })
export class ComponentStorageService {
  private readonly storageKey = 'asset-taxonomy-components';

  getAllComponents(): Observable<TaxonomyComponent[]> {
    return defer(() => Promise.resolve(this.read()));
  }

  createComponent(payload: ComponentPayload): Observable<void> {
    return this.change((components) => {
      const id = Math.max(0, ...components.map((component) => component.id)) + 1;
      return [...components, { id, ...payload }];
    });
  }

  updateComponent(payload: ComponentPayload & { id: number }): Observable<void> {
    return this.change((components) => {
      this.requireComponent(components, payload.id);
      return components.map((component) => component.id === payload.id ? { ...payload } : component);
    });
  }

  deleteComponent(id: number): Observable<void> {
    return this.change((components) => {
      this.requireComponent(components, id);
      return components.filter((component) => component.id !== id);
    });
  }

  private change(update: (components: TaxonomyComponent[]) => TaxonomyComponent[]): Observable<void> {
    return defer(() => {
      const components = update(this.read());
      localStorage.setItem(this.storageKey, JSON.stringify(components));
      return Promise.resolve();
    });
  }

  private requireComponent(components: TaxonomyComponent[], id: number): void {
    if (!components.some((component) => component.id === id)) {
      throw new Error('The component is no longer available. Please refresh the page.');
    }
  }

  private read(): TaxonomyComponent[] {
    const stored = localStorage.getItem(this.storageKey);
    if (stored === null) {
      return [];
    }
    const components: unknown = JSON.parse(stored);
    if (!Array.isArray(components) || !components.every((component) =>
      component !== null && typeof component === 'object' &&
      Number.isSafeInteger(component.id) && component.id > 0 &&
      typeof component.name === 'string' &&
      Number.isSafeInteger(component.assetId) && component.assetId > 0
    )) {
      throw new Error('Unable to read the components saved in this browser.');
    }
    return components;
  }
}
