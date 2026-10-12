import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import type { Instance } from 'flatpickr/dist/types/instance';
import { AnalysisTimeRange } from 'src/app/core/models/analysis-panel.model';
import { TimeRangeComponent } from './time-range.component';

@Component({
  template: '<app-time-range inputId="time-test" [value]="range" (valueChange)="changes.push($event)"></app-time-range>',
})
class TimeRangeHostComponent {
  range: AnalysisTimeRange = { from: '00:00', to: '23:59' };
  changes: AnalysisTimeRange[] = [];
}

describe('TimeRangeComponent with Metronic Flatpickr time selectors', () => {
  let fixture: ComponentFixture<TimeRangeHostComponent>;
  let inputs: HTMLInputElement[];
  let pickers: Instance[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimeRangeHostComponent], imports: [TimeRangeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TimeRangeHostComponent);
    fixture.detectChanges();
    inputs = Array.from(fixture.nativeElement.querySelectorAll('input'));
    pickers = inputs.map(input => (input as HTMLInputElement & { _flatpickr: Instance })._flatpickr);
  });

  afterEach(() => fixture.destroy());

  it('opens accessible hour/minute selectors from buttons and keyboard with 24-hour, one-minute precision', () => {
    expect(inputs.map(input => input.value)).toEqual(['00:00', '23:59']);
    const buttons = fixture.nativeElement.querySelectorAll('button');
    pickers.forEach((picker, index) => {
      expect(picker.config.noCalendar).toBeTrue();
      expect(picker.config.time_24hr).toBeTrue();
      expect(picker.config.minuteIncrement).toBe(1);
      expect(picker.calendarContainer.querySelector('.flatpickr-days')).toBeNull();
      expect(inputs[index].getAttribute('aria-controls')).toBe(picker.calendarContainer.id);
      buttons[index].click();
      expect(picker.isOpen).toBeTrue();
      expect(document.activeElement).toBe(picker.hourElement!);
      expect(inputs[index].getAttribute('aria-expanded')).toBe('true');
      picker.close();
      expect(inputs[index].getAttribute('aria-expanded')).toBe('false');
      inputs[index].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      expect(picker.isOpen).toBeTrue();
      picker.close();
    });
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('commits entered hours/minutes and spinner changes without resetting the other endpoint', fakeAsync(() => {
    const start = pickers[0]; start.open();
    start.hourElement!.value = '8'; start.minuteElement!.value = '7';
    start.minuteElement!.dispatchEvent(new FocusEvent('blur'));
    tick(350);
    expect(fixture.componentInstance.changes).toEqual([{ from: '08:07', to: '23:59' }]);
    start.minuteElement!.parentElement!.querySelector<HTMLElement>('.arrowUp')!.click();
    tick(350);
    expect(fixture.componentInstance.changes[1]).toEqual({ from: '08:08', to: '23:59' });
    start.close();
    const end = pickers[1]; end.open();
    end.hourElement!.value = '18'; end.minuteElement!.value = '43';
    end.minuteElement!.dispatchEvent(new FocusEvent('blur')); end.close();
    expect(fixture.componentInstance.changes[2]).toEqual({ from: '08:08', to: '18:43' });
    tick(350);
    expect(fixture.componentInstance.changes.length).toBe(3);
  }));

  it('synchronizes external times silently and permits endpoints spanning midnight on different dates', () => {
    fixture.componentInstance.range = { from: '22:17', to: '05:04' };
    fixture.detectChanges();
    expect(inputs.map(input => input.value)).toEqual(['22:17', '05:04']);
    expect(fixture.componentInstance.changes).toEqual([]);
    pickers[0].setDate('00:00', true, 'H:i');
    pickers[1].setDate('23:59', true, 'H:i');
    expect(fixture.componentInstance.changes[1]).toEqual({ from: '00:00', to: '23:59' });
  });

  it('removes both popups and prevents a pending time change from emitting after destruction', fakeAsync(() => {
    const calendars = pickers.map(picker => picker.calendarContainer);
    pickers[0].open(); pickers[0].minuteElement!.value = '12';
    pickers[0].minuteElement!.dispatchEvent(new FocusEvent('blur'));
    fixture.destroy(); tick(350);
    expect(calendars.every(calendar => !calendar.isConnected)).toBeTrue();
    expect(pickers.every(picker => picker._handlers.length === 0)).toBeTrue();
    expect(inputs.every(input => !input.classList.contains('flatpickr-input'))).toBeTrue();
    expect(fixture.componentInstance.changes).toEqual([]);
  }));
});
