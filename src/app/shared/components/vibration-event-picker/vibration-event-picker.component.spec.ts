import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Instance } from 'flatpickr/dist/types/instance';
import { AnalysisEventTime } from 'src/app/core/models/analysis-event-time.model';
import { VibrationEventPickerComponent } from './vibration-event-picker.component';

const events: readonly AnalysisEventTime[] = [
  { id: 'startup', from: '2026-11-02T08:00:00', to: '2026-11-02T08:10:00', label: 'Startup record', eventType: 'Startup' },
  { id: 'trip', from: '2026-11-02T17:00:00', to: '2026-11-02T17:01:00', label: 'Trip record', eventType: 'Trip' },
  { id: 'coast', from: '2026-11-03T18:00:00', to: '2026-11-03T18:10:00', label: 'Coast record', eventType: 'CoastDown' },
  { id: 'mixed', from: '2026-11-03T08:00:00', to: '2026-11-03T08:20:00', label: 'Mixed record', eventTypes: ['Startup', 'LoadChange'] },
  { id: 'untyped', from: '2026-11-04T09:00:00', to: '2026-11-04T09:10:00', label: 'Trip is only text, not metadata' },
];

describe('Shared Vibration operating-state filter', () => {
  let fixture: ComponentFixture<VibrationEventPickerComponent>;
  const component = () => fixture.componentInstance;
  const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); };
  const picker = () => (fixture.nativeElement.querySelector('input') as HTMLInputElement & { _flatpickr: Instance })._flatpickr;
  const filter = async (type: string | null) => {
    const select = fixture.nativeElement.querySelector('select[aria-label="Event type"]') as HTMLSelectElement;
    const option = Array.from(select.options).find(item => item.textContent!.trim() === (type ?? 'All states'))!;
    fixture.ngZone!.run(() => window.jQuery(select).val(option.value).trigger('change')); await settle();
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VibrationEventPickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(VibrationEventPickerComponent);
    fixture.componentRef.setInput('inputId', 'states'); fixture.componentRef.setInput('value', { from: '', to: '' });
    fixture.componentRef.setInput('events', events); fixture.componentRef.setInput('showEventTypeFilter', true); await settle();
  });
  afterEach(() => fixture.destroy());

  it('places a real Metronic Select2 before Date and derives only supplied state options', () => {
    const row = fixture.nativeElement.querySelector('.row') as HTMLElement;
    expect(Array.from(row.children).map(item => item.querySelector('label')?.textContent?.trim())).toEqual(['Event type', 'Date', 'Event time']);
    const select = fixture.nativeElement.querySelector('select[aria-label="Event type"]') as HTMLSelectElement;
    expect(window.jQuery(select).data('select2')).toBeDefined();
    expect(Array.from(select.options, option => option.textContent!.trim())).toEqual(['All states', 'CoastDown', 'Load change', 'Startup', 'Trip']);
    expect(component().visibleEvents.map(event => event.id)).toEqual(events.map(event => event.id));
  });

  it('filters metadata across all dates without parsing labels or selecting/loading a record', async () => {
    const selected = spyOn(component().eventSelected, 'emit');
    await filter('Trip'); expect(component().day).toBe('');
    expect(component().visibleEvents.map(event => event.id)).toEqual(['trip']);
    expect(picker().isEnabled(new Date('2026-11-02T12:00:00'))).toBeTrue();
    expect(picker().isEnabled(new Date('2026-11-04T12:00:00'))).toBeFalse();
    await filter('Load change'); expect(component().visibleEvents.map(event => event.id)).toEqual(['mixed']);
    await filter(null); expect(component().visibleEvents.length).toBe(events.length); expect(selected).not.toHaveBeenCalled();
  });

  it('combines the Date and state filters and clears only dates incompatible with a newly selected state', async () => {
    fixture.ngZone!.run(() => picker().setDate('2026-11-02', true, 'Y-m-d')); await settle();
    await filter('Trip'); expect(component().day).toBe('2026-11-02'); expect(component().visibleEvents.map(event => event.id)).toEqual(['trip']);
    await filter('CoastDown'); expect(component().day).toBe(''); expect(component().visibleEvents.map(event => event.id)).toEqual(['coast']);
    fixture.ngZone!.run(() => picker().setDate('2026-11-03', true, 'Y-m-d')); await settle();
    (fixture.nativeElement.querySelector('[aria-label="All dates; clear date filter"]') as HTMLButtonElement).click(); await settle();
    expect(component().selectedEventType).toBe('CoastDown'); expect(component().visibleEvents.map(event => event.id)).toEqual(['coast']);
  });

  it('rejects hidden event IDs, retains exact bounds and preserves selection when a compatible filter is applied', async () => {
    const selected = spyOn(component().eventSelected, 'emit'); await filter('Trip');
    component().chooseEvent('startup'); expect(selected).not.toHaveBeenCalled();
    component().chooseEvent('trip'); expect(selected).toHaveBeenCalledOnceWith(events[1]);
    await filter(null); expect(component().selectedEventId).toBe('trip');
    await filter('Startup'); expect(component().selectedEventId).toBeNull(); expect(selected).toHaveBeenCalledTimes(1);
  });

  it('resets stale filters when a changed source supplies new types or measurements', async () => {
    await filter('Trip'); fixture.componentRef.setInput('events', [events[0]]); await settle();
    expect(component().selectedEventType).toBeNull(); expect(component().eventTypeOptions.map(option => option.value)).toEqual(['Startup']);
    fixture.componentRef.setInput('resetDateKey', 'first'); await settle(); await filter('Startup');
    fixture.componentRef.setInput('resetDateKey', 'second'); await settle(); expect(component().selectedEventType).toBeNull();
    fixture.componentRef.setInput('disabled', true); await settle(); await filter('Startup');
    expect(component().selectedEventType).toBeNull();
    expect(fixture.nativeElement.querySelector('select[aria-label="Event type"]').disabled).toBeTrue();
  });

  it('keeps untyped analyses on the original Date/Event time layout', async () => {
    fixture.componentRef.setInput('showEventTypeFilter', false); fixture.componentRef.setInput('events', [events[4]]); await settle();
    expect(fixture.nativeElement.querySelector('select[aria-label="Event type"]')).toBeNull();
    expect(component().visibleEvents.map(event => event.id)).toEqual(['untyped']);
  });
});
