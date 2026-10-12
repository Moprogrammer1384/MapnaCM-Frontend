import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Instance } from 'flatpickr/dist/types/instance';
import { AnalysisDateRange } from 'src/app/core/models/analysis-panel.model';
import { DateRangeComponent } from './date-range.component';

@Component({
  template: '<app-date-range inputId="range-test" [value]="range" (valueChange)="changes.push($event)"></app-date-range>',
})
class DateRangeHostComponent {
  range: AnalysisDateRange = { from: '2026-10-01', to: '2026-10-12' };
  changes: AnalysisDateRange[] = [];
}

describe('DateRangeComponent with a single Flatpickr range calendar', () => {
  let fixture: ComponentFixture<DateRangeHostComponent>;
  let input: HTMLInputElement;
  let picker: Instance;
  const clickDay = (label: string) => picker.calendarContainer.querySelector<HTMLElement>(`[aria-label="${label}"]`)!.click();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DateRangeHostComponent], imports: [DateRangeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DateRangeHostComponent);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
    picker = (input as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
  });

  afterEach(() => fixture.destroy());

  it('renders one input and opens its labeled calendar from the button or keyboard', () => {
    expect(fixture.nativeElement.querySelectorAll('input').length).toBe(1);
    expect(input.value).toBe('2026-10-01 to 2026-10-12');
    expect(input.getAttribute('aria-controls')).toBe(picker.calendarContainer.id);
    expect(picker.calendarContainer.getAttribute('aria-label')).toBe('Date range');
    fixture.nativeElement.querySelector('button').click();
    expect(picker.isOpen).toBeTrue();
    expect(input.getAttribute('aria-expanded')).toBe('true');
    picker.close();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(picker.isOpen).toBeTrue();
  });

  it('commits ordered local dates once both endpoints are selected, including a same-day range', () => {
    picker.open(); picker.jumpToDate('2026-10-01');
    clickDay('October 9, 2026');
    expect(fixture.componentInstance.changes).toEqual([]);
    clickDay('October 2, 2026');
    expect(fixture.componentInstance.changes).toEqual([{ from: '2026-10-02', to: '2026-10-09' }]);
    picker.open(); picker.jumpToDate('2026-10-01');
    clickDay('October 5, 2026'); clickDay('October 5, 2026');
    expect(fixture.componentInstance.changes[1]).toEqual({ from: '2026-10-05', to: '2026-10-05' });
  });

  it('restores the committed range when dismissed before the second endpoint without emitting a partial range', () => {
    picker.open(); picker.jumpToDate('2026-10-01');
    clickDay('October 9, 2026'); picker.close();
    expect(input.value).toBe('2026-10-01 to 2026-10-12');
    expect(fixture.componentInstance.changes).toEqual([]);
    picker.open(); picker.jumpToDate('2026-10-01');
    clickDay('October 3, 2026'); clickDay('October 8, 2026');
    picker.open(); clickDay('October 9, 2026'); picker.close();
    expect(input.value).toBe('2026-10-03 to 2026-10-08');
    expect(fixture.componentInstance.changes.length).toBe(1);
  });

  it('restores external values without emitting changes and removes the calendar on destroy', () => {
    fixture.componentInstance.range = { from: '2026-09-01', to: '2026-09-12' };
    fixture.detectChanges();
    expect(input.value).toBe('2026-09-01 to 2026-09-12');
    expect(fixture.componentInstance.changes).toEqual([]);
    const calendar = picker.calendarContainer;
    fixture.destroy();
    expect(calendar.isConnected).toBeFalse();
    expect(picker._handlers.length).toBe(0);
    expect(input.classList.contains('flatpickr-input')).toBeFalse();
  });
});
