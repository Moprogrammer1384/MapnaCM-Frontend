import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Instance } from 'flatpickr/dist/types/instance';
import { DateTimeRange } from 'src/app/core/models/date-time-range.model';
import { DateTimeRangeComponent } from './date-time-range.component';

@Component({
  template: '<app-date-time-range inputId="datetime-test" [value]="range" [disabled]="disabled" (valueChange)="changes.push($event)"></app-date-time-range>',
})
class DateTimeRangeHostComponent {
  range: DateTimeRange = { from: '2026-10-01T08:30', to: '2026-10-12T17:45' };
  disabled = false;
  changes: DateTimeRange[] = [];
}

describe('DateTimeRangeComponent with a single Metronic range dialog', () => {
  let fixture: ComponentFixture<DateTimeRangeHostComponent>;
  let input: HTMLInputElement;
  let picker: Instance;
  const clickDay = (label: string) => {
    picker.calendarContainer.querySelector<HTMLElement>(`[aria-label="${label}"]`)!.click();
    fixture.detectChanges();
  };
  const button = (text: string) => Array.from(picker.calendarContainer.querySelectorAll('button'))
    .find(item => item.textContent!.trim() === text)!;
  const enterTime = (endpoint: string, hour: string, minute: string) => {
    ['hour', 'minute'].forEach((part, index) => {
      const control = picker.calendarContainer.querySelector<HTMLInputElement>(`#datetime-test_${endpoint}_${part}`)!;
      control.value = index === 0 ? hour : minute;
      control.dispatchEvent(new Event('input', { bubbles: true }));
    });
    fixture.detectChanges();
  };
  const open = () => {
    fixture.nativeElement.querySelector('button').click();
    picker.jumpToDate('2026-10-01');
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DateTimeRangeHostComponent], imports: [DateTimeRangeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DateTimeRangeHostComponent);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
    picker = (input as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
  });

  afterEach(() => fixture.destroy());

  it('opens one labeled calendar containing independent hour/minute controls using button and Enter', () => {
    expect(input.value).toBe('2026-10-01 08:30 to 2026-10-12 17:45');
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(1);
    expect(input.getAttribute('aria-controls')).toBe(picker.calendarContainer.id);
    expect(picker.calendarContainer.getAttribute('aria-label')).toBe('Date and time range');
    open();
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(picker.calendarContainer.querySelectorAll('input[type="number"][id]').length).toBe(4);
    picker.close(); fixture.detectChanges();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(picker.isOpen).toBeTrue();
  });

  it('selects dates in reverse order and applies typed 24-hour times once without UTC conversion', () => {
    open(); clickDay('October 9, 2026'); clickDay('October 2, 2026');
    enterTime('from', '8', '7'); enterTime('to', '18', '43');
    expect(picker.isOpen).toBeTrue();
    expect(fixture.componentInstance.changes).toEqual([]);
    button('Apply').click(); fixture.detectChanges();
    expect(fixture.componentInstance.changes).toEqual([{ from: '2026-10-02T08:07', to: '2026-10-09T18:43' }]);
    expect(input.value).toBe('2026-10-02 08:07 to 2026-10-09 18:43');
    expect(picker.isOpen).toBeFalse();
    expect(document.activeElement).toBe(input);
  });

  it('supports same-day ranges and prevents an earlier end time until corrected', () => {
    open(); clickDay('October 5, 2026'); clickDay('October 5, 2026');
    enterTime('from', '18', '30'); enterTime('to', '8', '30');
    button('Apply').click(); fixture.detectChanges();
    expect(picker.calendarContainer.querySelector('[role="alert"]')!.textContent).toContain('on or after');
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(picker.isOpen).toBeTrue();
    enterTime('to', '18', '30'); button('Apply').click();
    expect(fixture.componentInstance.changes).toEqual([{ from: '2026-10-05T18:30', to: '2026-10-05T18:30' }]);
  });

  it('supports ranges spanning midnight and minute boundary values', () => {
    open(); clickDay('October 5, 2026'); clickDay('October 6, 2026');
    enterTime('from', '23', '59'); enterTime('to', '0', '0');
    button('Apply').click();
    expect(fixture.componentInstance.changes).toEqual([{ from: '2026-10-05T23:59', to: '2026-10-06T00:00' }]);
  });

  it('rejects incomplete dates and empty, fractional or out-of-range time entries accessibly', () => {
    open(); clickDay('October 5, 2026'); button('Apply').click(); fixture.detectChanges();
    expect(picker.calendarContainer.querySelector('[role="alert"]')!.textContent).toContain('both');
    clickDay('October 6, 2026');
    [['', '10'], ['24', '10'], ['10', '60'], ['10.5', '10'], ['-1', '10']].forEach(([hour, minute]) => {
      enterTime('from', hour, minute); button('Apply').click(); fixture.detectChanges();
      const control = picker.calendarContainer.querySelector<HTMLInputElement>('#datetime-test_from_hour')!;
      expect(control.getAttribute('aria-invalid')).toBe('true');
      expect(control.getAttribute('aria-describedby')).toBe('datetime-test_error');
      expect(picker.calendarContainer.querySelector('[role="alert"]')!.textContent).toContain('00 to 23');
    });
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('discards pending dates and times on Cancel, Escape and outside dismissal', () => {
    const original = input.value;
    for (const action of ['Cancel', 'Escape', 'outside']) {
      open(); clickDay('October 5, 2026'); enterTime('from', '1', '2');
      if (action === 'Cancel') { button('Cancel').click(); }
      else if (action === 'Escape') {
        picker.calendarContainer.querySelector('input[id]')!.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      } else { document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); }
      fixture.detectChanges();
      expect(picker.isOpen).toBeFalse();
      expect(input.value).toBe(original);
      expect(picker.selectedDates.length).toBe(2);
    }
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('applies with Enter in a time field and does not emit unchanged values', () => {
    open(); button('Apply').click();
    expect(fixture.componentInstance.changes).toEqual([]);
    open(); enterTime('from', '9', '31');
    picker.calendarContainer.querySelector('input[id]')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(fixture.componentInstance.changes).toEqual([{ from: '2026-10-01T09:31', to: '2026-10-12T17:45' }]);
  });

  it('silently restores external values, replacing an open draft, and handles an initially empty range', async () => {
    open(); clickDay('October 5, 2026'); enterTime('from', '1', '2');
    fixture.componentInstance.range = { from: '2026-09-01T12:34', to: '2026-09-02T05:06' };
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-09-01 12:34 to 2026-09-02 05:06');
    expect(picker.selectedDates.length).toBe(2);
    expect(picker.calendarContainer.querySelector<HTMLInputElement>('#datetime-test_from_hour')!.value).toBe('12');
    expect(fixture.componentInstance.changes).toEqual([]);
    picker.close();
    fixture.componentInstance.range = { from: '', to: '' }; fixture.detectChanges();
    expect(input.value).toBe('');
    expect(picker.selectedDates).toEqual([]);
    open(); clickDay('October 5, 2026'); clickDay('October 6, 2026'); button('Apply').click();
    expect(fixture.componentInstance.changes).toEqual([{ from: '2026-10-05T00:00', to: '2026-10-06T23:59' }]);
  });

  it('ignores malformed or reversed external selections instead of silently normalizing them', () => {
    for (const range of [
      { from: '2026-02-30T08:00', to: '2026-10-12T17:45' },
      { from: '2026-10-01T24:00', to: '2026-10-12T17:45' },
      { from: '2026-10-12T17:45', to: '2026-10-01T08:00' },
    ]) {
      fixture.componentInstance.range = range; fixture.detectChanges();
      expect(picker.selectedDates).toEqual([]);
    }
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('disables both entry points and discards pending edits when disabled while open', () => {
    open(); clickDay('October 5, 2026');
    fixture.componentInstance.disabled = true; fixture.detectChanges();
    expect(picker.isOpen).toBeFalse();
    expect(input.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('button').disabled).toBeTrue();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(picker.isOpen).toBeFalse();
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('uses Metronic light/dark colors and keeps the popup/time fields within mobile and desktop widths', () => {
    const previousTheme = document.documentElement.getAttribute('data-bs-theme');
    const previousWidth = fixture.nativeElement.style.width;
    try {
      for (const theme of ['light', 'dark']) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        open();
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--bs-body-bg)';
        probe.style.color = 'var(--bs-gray-700)';
        document.body.appendChild(probe);
        expect(getComputedStyle(picker.calendarContainer).backgroundColor).toBe(getComputedStyle(probe).backgroundColor);
        expect(getComputedStyle(picker.calendarContainer.querySelector('.flatpickr-day')!).fontFamily)
          .toBe(getComputedStyle(picker.calendarContainer).fontFamily);
        probe.remove();
        for (const width of [320, 768, 1280]) {
          fixture.nativeElement.style.width = `${width}px`;
          picker.close(); open();
          const calendar = picker.calendarContainer;
          expect(calendar.getBoundingClientRect().width).toBeLessThanOrEqual(width);
          expect(calendar.scrollWidth).toBeLessThanOrEqual(calendar.clientWidth);
          for (const control of Array.from(calendar.querySelectorAll('input[id]'))) {
            expect(control.getBoundingClientRect().width).toBeGreaterThan(20);
          }
        }
        picker.close();
      }
    } finally {
      if (previousTheme === null) { document.documentElement.removeAttribute('data-bs-theme'); }
      else { document.documentElement.setAttribute('data-bs-theme', previousTheme); }
      fixture.nativeElement.style.width = previousWidth;
    }
  });

  it('destroys the calendar and Angular footer without emitting unfinished edits', () => {
    open(); clickDay('October 5, 2026'); enterTime('from', '1', '2');
    const calendar = picker.calendarContainer;
    fixture.destroy();
    expect(calendar.isConnected).toBeFalse();
    expect(picker._handlers.length).toBe(0);
    expect(input.classList.contains('flatpickr-input')).toBeFalse();
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('keeps independent component values and popup IDs when more than one consumer is mounted', () => {
    const second = TestBed.createComponent(DateTimeRangeComponent);
    second.componentRef.setInput('inputId', 'second-range');
    second.componentRef.setInput('value', { from: '2026-09-01T10:11', to: '2026-09-02T12:13' });
    second.detectChanges();
    try {
      const otherInput = second.nativeElement.querySelector('input') as HTMLInputElement & { _flatpickr: Instance };
      expect(otherInput._flatpickr.calendarContainer.id).not.toBe(picker.calendarContainer.id);
      open(); enterTime('from', '9', '31'); button('Apply').click();
      expect(otherInput.value).toBe('2026-09-01 10:11 to 2026-09-02 12:13');
      expect(otherInput._flatpickr.selectedDates.length).toBe(2);
      const firstCalendar = picker.calendarContainer;
      second.destroy();
      expect(firstCalendar.isConnected).toBeTrue();
    } finally {
      second.destroy();
    }
  });
});
