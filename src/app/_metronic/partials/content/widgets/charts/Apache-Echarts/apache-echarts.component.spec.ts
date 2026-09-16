import { ComponentFixture, TestBed } from '@angular/core/testing';
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
