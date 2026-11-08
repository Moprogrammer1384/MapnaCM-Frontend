import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { OrbitCaptureChoice } from 'src/app/core/models/orbit-analysis.model';
import { VibrationOrbitAnalysisAvailabilityApiService } from 'src/app/core/services/vibration/api/vibration-orbit-analysis-availability-api.service';
import { orbitPair } from 'src/testing/orbit-fixture';
import { VibrationEventPickerComponent } from '../vibration-event-picker/vibration-event-picker.component';
import { OrbitAcquisitionPickerComponent } from './orbit-acquisition-picker.component';

describe('Independent Orbit acquisition date model', () => {
  const choice: OrbitCaptureChoice = { period: 'Daily', periodStart: '2026-11-04', capturedAtUtc: '2026-11-04T00:00:00Z',
    finishedAtUtc: '2026-11-04T00:00:01Z', sampleCount: 6400, sampleRateHz: 6400 };
  let api: jasmine.SpyObj<VibrationOrbitAnalysisAvailabilityApiService>;
  beforeEach(async () => {
    api = jasmine.createSpyObj('OrbitHistory', ['load']); api.load.and.returnValue(of([choice]));
    await TestBed.configureTestingModule({ imports: [OrbitAcquisitionPickerComponent, NoopAnimationsModule],
      providers: [{ provide: VibrationOrbitAnalysisAvailabilityApiService, useValue: api }] }).compileComponents();
  });
  const create = () => {
    const fixture = TestBed.createComponent(OrbitAcquisitionPickerComponent);
    fixture.componentRef.setInput('inputId', 'orbit-picker-test'); fixture.componentRef.setInput('pairs', [orbitPair()]);
    fixture.detectChanges(); return fixture;
  };
  it('places Acquisition period, Date and Event time in one responsive row and omits the count description', () => {
    const fixture = create();
    const row = fixture.nativeElement.querySelector('app-vibration-event-picker > .row') as HTMLElement;
    expect(Array.from(row.children).map(column => column.querySelector('label')?.textContent?.trim())).toEqual(['Acquisition period', 'Date', 'Event time']);
    expect(Array.from(row.children).every(column => column.classList.contains('col-md-4'))).toBeTrue();
    expect(fixture.nativeElement.textContent).not.toContain('acquisition(s)');
    expect(fixture.nativeElement.querySelector('app-date-time-range')).toBeNull(); fixture.destroy();
  });
  it('emits an exact period key immediately and resets date filtering when changing cadence', () => {
    const fixture = create(), component = fixture.componentInstance;
    const emit = spyOn(component.selected, 'emit');
    const picker = fixture.debugElement.query(By.directive(VibrationEventPickerComponent)).componentInstance as VibrationEventPickerComponent;
    picker.chooseEvent(component.events[0].id);
    expect(emit).toHaveBeenCalledWith({ period: 'Daily', periodStart: '2026-11-04', capturedAtUtc: choice.capturedAtUtc });
    picker.day = '2026-11-04'; api.load.and.returnValue(of([{ ...choice, period: 'Weekly' }]));
    fixture.componentRef.setInput('period', 'Weekly'); fixture.detectChanges(); expect(picker.day).toBe('');
    expect(api.load).toHaveBeenCalledTimes(2); fixture.destroy();
  });
  it('shows separate event times on the selected day and restores the exact short capture', () => {
    const captures = [10, 13, 16, 22].map(hour => {
      const start = new Date(2026, 10, 4, hour).getTime();
      return { ...choice, capturedAtUtc: new Date(start).toISOString(), finishedAtUtc: new Date(start + 200).toISOString(), sampleCount: 1280 };
    });
    api.load.and.returnValue(of(captures));
    const fixture = create(), component = fixture.componentInstance;
    const picker = fixture.debugElement.query(By.directive(VibrationEventPickerComponent)).componentInstance as VibrationEventPickerComponent;
    const emit = spyOn(component.selected, 'emit');
    const calendar = fixture.nativeElement.querySelector('input') as HTMLInputElement & { _flatpickr: { setDate(value: string, trigger: boolean): void } };
    calendar._flatpickr.setDate(component.events[0].from.slice(0, 10), true); fixture.detectChanges();
    expect(picker.visibleEvents.length).toBe(4);
    expect(new Set(picker.visibleEvents.map(event => event.id)).size).toBe(4);
    expect(picker.visibleEvents.every(event => event.label.endsWith('0.20 s'))).toBeTrue();
    picker.chooseEvent(component.events[2].id);
    expect(emit).toHaveBeenCalledWith({ period: 'Daily', periodStart: '2026-11-04', capturedAtUtc: captures[2].capturedAtUtc });
    fixture.componentRef.setInput('value', emit.calls.mostRecent().args[0]); fixture.detectChanges();
    expect(picker.selectedEventId).toBe(component.events[2].id);
    expect(fixture.nativeElement.querySelectorAll('app-vibration-event-picker > .row > .col-12').length).toBe(3);
    fixture.destroy();
  });
  it('blocks failed and empty histories, supports retry and ignores canceled responses', () => {
    api.load.and.returnValue(throwError(() => new Error('History unavailable')));
    const fixture = create(), component = fixture.componentInstance;
    expect(component.error).toContain('History unavailable'); expect(component.events).toEqual([]);
    api.load.and.returnValue(of([])); component.load(); fixture.detectChanges(); expect(component.error).toBe(''); expect(component.events).toEqual([]);
    const stale = new Subject<readonly OrbitCaptureChoice[]>(), current = new Subject<readonly OrbitCaptureChoice[]>();
    api.load.and.returnValues(stale, current);
    fixture.componentRef.setInput('period', 'Weekly'); fixture.detectChanges();
    fixture.componentRef.setInput('period', 'Monthly'); fixture.detectChanges();
    stale.next([{ ...choice, period: 'Weekly' }]); expect(component.events).toEqual([]);
    current.next([{ ...choice, period: 'Monthly' }]); fixture.detectChanges(); expect(component.events.length).toBe(1);
    fixture.destroy(); expect(current.observed).toBeFalse();
  });
});
