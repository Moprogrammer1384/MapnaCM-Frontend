import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { DEFAULT_ROTOR_POSITION_SETTINGS, RotorPositionRecord } from 'src/app/core/models/rotor-position.model';
import { ROTOR_POSITION_DATA_SOURCE } from 'src/app/core/services/vibration/rotor-position/rotor-position-data-source.service';
import { rotorEvent, rotorPair, rotorRecord } from 'src/testing/rotor-position-fixture';
import { VibrationRotorPositionChartComponent } from './vibration-rotor-position-chart.component';

describe('Rotor Position chart data ownership', () => {
  let fixture: ComponentFixture<VibrationRotorPositionChartComponent>;
  let load: jasmine.Spy;
  const mount = () => {
    fixture = TestBed.createComponent(VibrationRotorPositionChartComponent);
    fixture.componentRef.setInput('pair', rotorPair()); fixture.componentRef.setInput('event', rotorEvent());
    fixture.componentRef.setInput('settings', DEFAULT_ROTOR_POSITION_SETTINGS); fixture.componentRef.setInput('titleId', 'rotor-chart-test');
    fixture.detectChanges();
  };
  beforeEach(() => {
    load = jasmine.createSpy('load').and.returnValue(of(null));
    TestBed.configureTestingModule({ imports: [VibrationRotorPositionChartComponent],
      providers: [{ provide: ROTOR_POSITION_DATA_SOURCE, useValue: { load } }] });
  });
  afterEach(() => fixture?.destroy());
  it('rejects another event or pair instead of displaying mismatched data', () => {
    load.and.returnValue(of({ ...rotorRecord(), pairKey: 'another-pair' })); mount();
    expect(fixture.componentInstance.error).toContain('selected probe pair and event');
    expect(fixture.nativeElement.querySelector('app-apache-echarts')).toBeNull();
  });
  it('keeps empty records distinct from errors and retries a failed source without a fallback', () => {
    mount(); expect(fixture.nativeElement.textContent).toContain('No valid DC position');
    load.and.returnValue(throwError(() => new Error('DC data unavailable'))); fixture.componentInstance.reload(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('DC data unavailable');
    load.and.returnValue(of(rotorRecord())); fixture.nativeElement.querySelector('button').click(); fixture.detectChanges();
    expect(fixture.componentInstance.analysis!.points[0].y).toBe(-40); expect(load).toHaveBeenCalledTimes(3);
  });
  it('cancels the previous event read and releases in-flight work on destroy', () => {
    const first = new Subject<RotorPositionRecord | null>(), second = new Subject<RotorPositionRecord | null>();
    load.and.returnValues(first, second); mount();
    expect(fixture.componentInstance.loading).toBeTrue();
    fixture.componentRef.setInput('event', { ...rotorEvent(), id: 'trip', eventType: 'Trip' }); fixture.detectChanges();
    expect(first.observed).toBeFalse(); expect(second.observed).toBeTrue();
    fixture.destroy(); expect(second.observed).toBeFalse();
  });
});
