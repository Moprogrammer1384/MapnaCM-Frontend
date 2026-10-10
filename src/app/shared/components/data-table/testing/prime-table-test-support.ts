import { TestBed } from '@angular/core/testing';
import { PrimeNG } from 'primeng/config';
import { METRONIC_PRIMENG_CONFIG } from '../../metronic-primeng.config';

export function configureMetronicPrimeNG(): void {
  TestBed.inject(PrimeNG).setConfig(METRONIC_PRIMENG_CONFIG);
}

/** Exercise the real PrimeNG overlay rather than writing component state. */
export async function selectPageSize(root: HTMLElement, size: number, settle: () => Promise<void>): Promise<void> {
  root.querySelector<HTMLElement>('p-select')!.click();
  await settle();
  const option = Array.from(root.querySelectorAll<HTMLElement>('[role="option"]'))
    .find((item) => item.textContent!.trim() === String(size));
  if (!option) {
    throw new Error(`Page-size option ${size} was not rendered.`);
  }
  option.click();
  await settle();
}
