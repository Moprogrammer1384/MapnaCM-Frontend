import { ComponentFixture, TestBed } from '@angular/core/testing';
import { getInstanceByDom } from 'echarts';
import type { EChartsOption } from 'echarts';
import { ApacheEchartsComponent } from './apache-echarts.component';

describe('ApacheEchartsComponent', () => {
  let fixture: ComponentFixture<ApacheEchartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApacheEchartsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApacheEchartsComponent);
  });

  afterEach(() => fixture.destroy());

  it('renders a supplied ECharts option with the SVG renderer', async () => {
    fixture.componentRef.setInput('renderer', 'svg');
    fixture.componentRef.setInput('height', '240px');
    fixture.componentRef.setInput('options', {
      xAxis: { type: 'category', data: ['A', 'B', 'C'] },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: [3, 7, 5] }],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
    expect(fixture.componentInstance.errorMessage).toBe('');
  });

  for (const mergeOptions of [false, true]) {
    it(`${mergeOptions ? 'retains' : 'resets'} zoom on an option update with mergeOptions=${mergeOptions}`, async () => {
      const options: EChartsOption = {
        xAxis: { type: 'value' }, yAxis: { type: 'value' },
        dataZoom: [{ type: 'inside' }],
        series: [{ type: 'line', data: [[0, 1], [1, 2], [2, 3]] }],
      };
      fixture.componentRef.setInput('renderer', 'svg');
      fixture.componentRef.setInput('mergeOptions', mergeOptions);
      fixture.componentRef.setInput('options', options);
      fixture.detectChanges(); await fixture.whenStable();
      const element = fixture.nativeElement.querySelector('[_echarts_instance_]');
      const chart = getInstanceByDom(element)!;
      chart.dispatchAction({ type: 'dataZoom', start: 20, end: 60 });
      fixture.componentRef.setInput('options', { ...options, tooltip: { show: false } });
      fixture.detectChanges(); await fixture.whenStable();
      expect(getInstanceByDom(element)).toBe(chart);
      expect((chart.getOption()['dataZoom'] as Array<{ start: number; end: number }>)[0])
        .toEqual(jasmine.objectContaining(mergeOptions ? { start: 20, end: 60 } : { start: 0, end: 100 }));
    });
  }

  for (const demoId of [
    'bar-simple',
    'bar-histogram',
    'scatter-world-population',
    'scatter-map',
    'line-aqi',
  ]) {
    it(`loads and renders the generated ${demoId} example`, async () => {
      fixture.componentRef.setInput('renderer', 'svg');
      fixture.componentRef.setInput('height', '240px');
      fixture.componentRef.setInput('demoId', demoId);

      const rendered = new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(
          () => reject(new Error(`${demoId} did not render in time.`)),
          5000
        );
        fixture.componentInstance.chartRendered.subscribe(() => {
          window.clearTimeout(timeout);
          resolve();
        });
        fixture.componentInstance.chartError.subscribe((error) => {
          window.clearTimeout(timeout);
          reject(error);
        });
      });

      fixture.detectChanges();
      await rendered;

      expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
      expect(fixture.componentInstance.errorMessage).toBe('');
    });
  }
});
