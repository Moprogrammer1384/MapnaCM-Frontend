import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { RotorPositionEvent } from 'src/app/core/models/rotor-position.model';
import { ROTOR_POSITION_DATA_SOURCE } from 'src/app/core/services/vibration/rotor-position/rotor-position-data-source.service';
import { rotorEvent, rotorPair } from 'src/testing/rotor-position-fixture';
import { RotorPositionEventPickerComponent } from './rotor-position-event-picker.component';
import { VibrationEventPickerComponent } from '../vibration-event-picker/vibration-event-picker.component';
import { By } from '@angular/platform-browser';

describe('Rotor Position event availability lifecycle', () => {
  let fixture: ComponentFixture<RotorPositionEventPickerComponent>;
  let listEvents: jasmine.Spy;
  const mount = () => {
    fixture = TestBed.createComponent(RotorPositionEventPickerComponent);
    fixture.componentRef.setInput('inputId', 'rotor-test'); fixture.componentRef.setInput('pairs', [rotorPair()]); fixture.detectChanges();
  };
  const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); };
  beforeEach(() => {
    listEvents = jasmine.createSpy('listEvents').and.returnValue(of([rotorEvent()]));
    TestBed.configureTestingModule({ imports: [RotorPositionEventPickerComponent],
      providers: [{ provide: ROTOR_POSITION_DATA_SOURCE, useValue: { listEvents } }] });
  });
  afterEach(() => fixture?.destroy());
  it('selects and restores the exact operating identity when two events have identical bounds', async () => {
    const first = { ...rotorEvent(), id: '41' }, second = { ...rotorEvent(), id: '42' };
    listEvents.and.returnValue(of([first, second])); mount(); await settle();
    const selected = spyOn(fixture.componentInstance.selected, 'emit');
    const picker = fixture.debugElement.query(By.directive(VibrationEventPickerComponent)).componentInstance as VibrationEventPickerComponent;
    picker.chooseEvent('42'); await settle(); expect(selected).toHaveBeenCalledOnceWith(second);
    fixture.componentRef.setInput('value', second); await settle(); expect(picker.selectedEventId).toBe('42');
    fixture.componentInstance.choose({ ...first, id: 'missing' }); expect(selected).toHaveBeenCalledTimes(1);
  });
  it('blocks pending and failed availability, shows Retry and accepts only exact catalogue bounds', async () => {
    const pending = new Subject<readonly RotorPositionEvent[]>(); listEvents.and.returnValue(pending); mount(); await settle();
    expect(fixture.nativeElement.querySelector('select').disabled).toBeTrue();
    pending.error(new Error('Events unavailable')); await settle();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Events unavailable');
    listEvents.and.returnValue(of([rotorEvent()])); fixture.nativeElement.querySelector('.btn-light-danger').click(); await settle();
    expect(fixture.nativeElement.querySelector('select').disabled).toBeFalse();
    const selected = spyOn(fixture.componentInstance.selected, 'emit');
    fixture.componentInstance.choose({ from: rotorEvent().from, to: '2026-11-08T10:00:02' }); expect(selected).not.toHaveBeenCalled();
    fixture.componentInstance.choose(rotorEvent()); expect(selected).toHaveBeenCalledOnceWith(rotorEvent());
  });
  it('cancels stale lists after changing pairs and unsubscribes when destroyed', () => {
    const first = new Subject<readonly RotorPositionEvent[]>(), second = new Subject<readonly RotorPositionEvent[]>();
    listEvents.and.returnValues(first, second); mount();
    fixture.componentRef.setInput('pairs', [{ ...rotorPair(), key: 'different' }]); fixture.detectChanges();
    expect(first.observed).toBeFalse(); second.next([rotorEvent()]); fixture.detectChanges();
    expect(fixture.componentInstance.events.length).toBe(1); fixture.destroy(); expect(second.observed).toBeFalse();
  });
  it('does not enable empty, malformed or duplicate acquisitions and retains a useful source error', async () => {
    listEvents.and.returnValue(of([])); mount(); await settle(); expect(fixture.nativeElement.querySelector('select').disabled).toBeTrue();
    listEvents.and.returnValue(of([rotorEvent(), rotorEvent()])); fixture.componentInstance.reload(); fixture.detectChanges();
    expect(fixture.componentInstance.events).toEqual([]); expect(fixture.componentInstance.error).toContain('duplicate');
    listEvents.and.returnValue(throwError(() => new Error('Catalogue rejected'))); fixture.componentInstance.reload(); fixture.detectChanges();
    expect(fixture.componentInstance.error).toBe('Catalogue rejected');
  });
});
