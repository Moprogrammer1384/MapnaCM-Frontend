import { signal } from '@angular/core';
import { defer, finalize, Observable, Subject, takeUntil, tap } from 'rxjs';

/** UI state for related reads; replacing a read cancels its obsolete subscription. */
export class RequestState {
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal('');
  private readonly pending = new Map<string, Subject<void>>();

  get ready(): boolean {
    return this.loaded() && !this.loading() && !this.error();
  }

  track<T>(source: Observable<T>, fallback: string, key = 'default'): Observable<T> {
    return defer(() => {
      this.pending.get(key)?.next();
      this.pending.get(key)?.complete();
      const cancel = new Subject<void>();
      this.pending.set(key, cancel);
      this.loading.set(true);
      this.error.set('');
      return source.pipe(
        takeUntil(cancel),
        tap({
          next: () => this.loaded.set(true),
          error: (error: unknown) => this.error.set(error instanceof Error && error.message ? error.message : fallback),
        }),
        finalize(() => {
          if (this.pending.get(key) === cancel) {
            this.pending.delete(key);
          }
          cancel.complete();
          this.loading.set(this.pending.size > 0);
        })
      );
    });
  }

  destroy(): void {
    for (const cancel of Array.from(this.pending.values())) {
      cancel.next();
      cancel.complete();
    }
  }
}
