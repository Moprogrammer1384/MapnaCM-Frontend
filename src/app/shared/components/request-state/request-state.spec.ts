import { Subject } from 'rxjs';
import { RequestState } from './request-state';

describe('RequestState', () => {
  it('stays busy across chained hierarchy reads until the final list completes', () => {
    const state = new RequestState();
    const parent = new Subject<number>();
    const rows = new Subject<string[]>();
    state.track(parent, 'Parent failed', 'parent').subscribe(() => {
      state.track(rows, 'Rows failed', 'rows').subscribe();
    });
    parent.next(1);
    parent.complete();
    expect(state.loading()).toBeTrue();
    expect(state.ready).toBeFalse();
    rows.next(['Record']);
    rows.complete();
    expect(state.loading()).toBeFalse();
    expect(state.ready).toBeTrue();
  });

  it('cancels superseded reads and clears failure state when retrying', () => {
    const state = new RequestState();
    const obsolete = new Subject<string>();
    const current = new Subject<string>();
    const retry = new Subject<string>();
    const receive = jasmine.createSpy('receive');
    state.track(obsolete, 'Read failed').subscribe(receive);
    state.track(current, 'Read failed').subscribe({ next: receive, error: () => undefined });
    obsolete.next('Stale response');
    expect(receive).not.toHaveBeenCalled();
    current.error(new Error('Temporarily unavailable'));
    expect(state.error()).toBe('Temporarily unavailable');
    expect(state.loading()).toBeFalse();
    state.track(retry, 'Read failed').subscribe(receive);
    expect(state.error()).toBe('');
    expect(state.loading()).toBeTrue();
    retry.next('Fresh response');
    retry.complete();
    expect(receive).toHaveBeenCalledOnceWith('Fresh response');
    expect(state.ready).toBeTrue();
  });

  it('retains a related read failure when another pending read succeeds', () => {
    const state = new RequestState();
    const first = new Subject<number>();
    const second = new Subject<number>();
    state.track(first, 'Unable to load parents', 'parents').subscribe({ error: () => undefined });
    state.track(second, 'Unable to load rows', 'rows').subscribe();
    first.error({ status: 503 });
    second.next(1);
    second.complete();
    expect(state.loading()).toBeFalse();
    expect(state.error()).toBe('Unable to load parents');
    expect(state.ready).toBeFalse();
  });

  it('cancels pending reads when their owning page is destroyed', () => {
    const state = new RequestState();
    const first = new Subject<number>();
    const second = new Subject<number>();
    const receive = jasmine.createSpy('receive');
    state.track(first, 'Unable to load parents', 'parents').subscribe(receive);
    state.track(second, 'Unable to load rows', 'rows').subscribe(receive);
    state.destroy();
    first.next(1);
    second.next(2);
    expect(receive).not.toHaveBeenCalled();
    expect(state.loading()).toBeFalse();
  });
});
