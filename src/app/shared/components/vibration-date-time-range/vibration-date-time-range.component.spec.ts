import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Instance } from 'flatpickr/dist/types/instance';
import { of, Subject, throwError } from 'rxjs';
import { TimeAvailability } from 'src/app/core/models/time-availability.model';
import { TIME_AVAILABILITY_SOURCE } from 'src/app/core/services/time-availability.service';
import { availabilityFixture } from 'src/testing/time-availability-fixture';
import { VibrationDateTimeRangeComponent } from './vibration-date-time-range.component';

describe('Vibration calendar: disabled until the API proves a day has data', () => {
  let fixture: ComponentFixture<VibrationDateTimeRangeComponent>;
  let getAvailability: jasmine.Spy;
  const value = { from: '2026-10-01T00:00', to: '2026-10-02T23:59' };
  const result = (): TimeAvailability => ({ ...availabilityFixture([1, 4]),
    window: { from: '2026-10-01', to: '2026-11-01' },
    ranges: [{ from: '2026-10-01', to: '2026-10-20' }],
    commonRanges: [{ from: '2026-10-01', to: '2026-10-03' }, { from: '2026-10-06', to: '2026-10-09' }],
  });
  const picker = () => (fixture.nativeElement.querySelector('input') as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
  const day = (date: string) => new Date(`${date}T12:00:00`);
  const open = () => { fixture.nativeElement.querySelector('button').click(); fixture.detectChanges(); };
  const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); };
  const mount = () => {
    fixture = TestBed.createComponent(VibrationDateTimeRangeComponent);
    fixture.componentRef.setInput('inputId', 'available-dates');
    fixture.componentRef.setInput('measurementIds', [1, 4]);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
  };
  beforeEach(() => {
    getAvailability = jasmine.createSpy('getAvailability').and.returnValue(of(result()));
    TestBed.configureTestingModule({ imports: [VibrationDateTimeRangeComponent],
      providers: [{ provide: TIME_AVAILABILITY_SOURCE, useValue: { getAvailability } }] });
  });
  afterEach(() => fixture?.destroy());

  it('starts closed to selection, then enables only common ranges with an exclusive end and real holes', async () => {
    const pending = new Subject<TimeAvailability>(); getAvailability.and.returnValue(pending);
    mount();
    expect(fixture.nativeElement.querySelector('input').disabled).toBeTrue();
    expect(picker().isEnabled(day('2026-10-01'))).toBeFalse();
    fixture.ngZone!.run(() => pending.next(result())); await settle(); open();
    expect(getAvailability).toHaveBeenCalledOnceWith([1, 4], undefined);
    expect(picker().isEnabled(day('2026-10-01'))).toBeTrue();
    expect(picker().isEnabled(day('2026-10-02'))).toBeTrue();
    expect(picker().isEnabled(day('2026-10-03'))).toBeFalse();
    expect(picker().isEnabled(day('2026-10-05'))).toBeFalse();
    expect(picker().isEnabled(day('2026-10-06'))).toBeTrue();
    expect(picker().isEnabled(day('2026-10-09'))).toBeFalse();
    expect(picker().isEnabled(day('2026-10-15'))).toBeFalse(); // Union/bounds do not prove common data.
    const disabled = picker().calendarContainer.querySelector<HTMLElement>('[aria-label="October 3, 2026"]')!;
    expect(disabled.classList).toContain('flatpickr-disabled');
    const before = picker().selectedDates.map(date => date.getTime()); disabled.click();
    expect(picker().selectedDates.map(date => date.getTime())).toEqual(before);
  });

  it('keeps the existing hour/minute behavior and applies confirmed dates', async () => {
    mount(); await settle(); open();
    const applied = spyOn(fixture.componentInstance.applied, 'emit');
    const controls = picker().calendarContainer.querySelectorAll<HTMLInputElement>('input[id]');
    expect(controls.length).toBe(4);
    ['0', '0', '23', '59'].forEach((value, index) => {
      controls[index].value = value; controls[index].dispatchEvent(new Event('input', { bubbles: true }));
    });
    fixture.detectChanges();
    Array.from(picker().calendarContainer.querySelectorAll('button')).find(button => button.textContent!.trim() === 'Apply')!.click();
    expect(applied).toHaveBeenCalledOnceWith(value);
  });

  it('loads unknown months before enabling their days, preserves the visible month and caches proof', async () => {
    const pending = new Subject<TimeAvailability>();
    getAvailability.and.returnValues(of(result()), pending);
    mount(); await settle(); open();
    fixture.ngZone!.run(() => picker().changeMonth(-1)); await settle();
    expect(getAvailability).toHaveBeenCalledTimes(2);
    const window = getAvailability.calls.mostRecent().args[1];
    expect(window.from).toBe('2026-09-01'); expect(window.to).toBe('2026-10-01');
    expect(picker().isEnabled(day('2026-09-10'))).toBeFalse();
    const apply = () => Array.from(picker().calendarContainer.querySelectorAll('button')).find(button => button.textContent!.trim() === 'Apply')!;
    expect(apply().disabled).toBeTrue();
    fixture.ngZone!.run(() => pending.next({ ...result(), window, commonRanges: [{ from: '2026-09-10', to: '2026-09-12' }] })); await settle();
    expect(picker().currentMonth).toBe(8);
    expect(picker().isOpen).toBeTrue();
    expect(picker().isEnabled(day('2026-09-10'))).toBeTrue();
    expect(picker().isEnabled(day('2026-09-12'))).toBeFalse();
    fixture.ngZone!.run(() => { picker().changeMonth(1); picker().changeMonth(-1); }); await settle();
    expect(getAvailability).toHaveBeenCalledTimes(2);
  });

  it('keeps failed discovery disabled, distinguishes errors from no data and supports Retry', async () => {
    getAvailability.and.returnValues(throwError(() => new Error('Backend unavailable')), of(result()));
    mount(); await settle();
    expect(fixture.nativeElement.querySelector('input').disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Backend unavailable');
    fixture.nativeElement.querySelector('.alert button').click(); await settle();
    expect(fixture.nativeElement.querySelector('input').disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('clears proof on a different measurement selection and cancels reads on replacement/destruction', async () => {
    const first = new Subject<TimeAvailability>(); const second = new Subject<TimeAvailability>();
    getAvailability.and.returnValues(first, second);
    mount();
    fixture.componentRef.setInput('measurementIds', [9]); fixture.detectChanges();
    expect(first.observed).toBeFalse();
    expect(picker().isEnabled(day('2026-10-01'))).toBeFalse();
    fixture.destroy(); expect(second.observed).toBeFalse();
  });

  it('keeps every day disabled for a successful empty response', async () => {
    getAvailability.and.returnValue(of({ ...result(), commonRanges: [], ranges: [], window: null,
      measurements: [{ measurementId: 1, dataBounds: null, ranges: [] }, { measurementId: 4, dataBounds: null, ranges: [] }] }));
    mount(); await settle(); open();
    expect(picker().isEnabled(day('2026-10-01'))).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No common dates');
  });
});
