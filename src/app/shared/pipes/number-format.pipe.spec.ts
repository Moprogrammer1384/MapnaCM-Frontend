import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { formatNumber, NumberFormatPipe } from './number-format.pipe';

@Component({
  standalone: true,
  imports: [SharedModule],
  template: '{{ value | numberFormat }} / {{ text | numberFormat }} / {{ nearZero | numberFormat }}',
})
class NumberFormatHostComponent {
  value = 12.3456;
  text = '7';
  nearZero = -0.00049;
}

describe('NumberFormatPipe', () => {
  it('is available through SharedModule and updates display text without changing source precision', () => {
    const fixture = TestBed.createComponent(NumberFormatHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('12.35 / 7.00 / 0.00');
    expect(fixture.componentInstance.value).toBe(12.3456);

    fixture.componentInstance.value = -1.2345;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('-1.23 / 7.00 / 0.00');
  });

  it('provides the same formatting to callbacks that run without an Angular template', () => {
    const pipe = new NumberFormatPipe();
    const callback = formatNumber;
    const values = [0, -0.00049, 1.23456789, -12.3456, '7'];
    expect(values.map(callback)).toEqual(values.map(value => pipe.transform(value)));
  });
});
