import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BodeRecord } from 'src/app/core/models/bode-analysis.model';
import { BODE_DATA_SOURCE } from 'src/app/core/services/vibration/bode-analysis/bode-data-source.service';
import { VibrationBodeChartComponent } from './vibration-bode-chart.component';

describe('Bode acquisition footer', () => {
  it('shows the peak phase and puts native acquisition date/count on a separate right-aligned row in RTL', () => {
    const record: BodeRecord = { id: 'footer', label: 'run', channel: 'X', run: 'Startup', eventType: 'Startup',
      phaseConvention: 'as-exported', order: 1, quantity: 'velocity', unit: 'mm/s', originalSampleCount: 99999,
      startedAtUtc: '2026-11-08T06:30:00Z', observations: [
        { timestamp: '2026-11-08T10:00:01', speedRpm: 8000, amplitudeRms: 1, phaseDegrees: 20 },
        { timestamp: '2026-11-08T10:00:02', speedRpm: 9054.73, amplitudeRms: 2.71, phaseDegrees: 123.45 },
        { timestamp: '2026-11-08T10:00:03', speedRpm: 9500, amplitudeRms: 2, phaseDegrees: 80 },
      ] };
    TestBed.configureTestingModule({ imports: [VibrationBodeChartComponent],
      providers: [{ provide: BODE_DATA_SOURCE, useValue: { load: () => of(record) } }] });
    const fixture = TestBed.createComponent(VibrationBodeChartComponent);
    fixture.nativeElement.dir = 'rtl'; fixture.nativeElement.style.width = '900px';
    fixture.componentRef.setInput('measurementId', 1); fixture.componentRef.setInput('from', '2026-11-08T10:00:00');
    fixture.componentRef.setInput('to', '2026-11-08T10:01:00');
    fixture.detectChanges();
    try {
      const footer = fixture.nativeElement.querySelector('footer') as HTMLElement;
      expect(footer.querySelector('[data-testid="bode-peak"]')!.textContent).toContain('2.71 mm/s RMS');
      expect(footer.querySelector('[data-testid="bode-peak"]')!.textContent).toContain('9054.73 RPM');
      expect(footer.querySelector('[data-testid="bode-peak-phase"]')!.textContent).toContain('123.45°');
      expect(footer.querySelector('[data-testid="bode-count"]')!.textContent).toContain('99,999');
      expect(footer.querySelector('[data-testid="acquisition-start"]')!.textContent).toContain('2026-11-08 10:00:00 AM');
      const statistics = footer.querySelector<HTMLElement>('[data-testid="chart-statistics"]')!;
      const metadata = footer.querySelector<HTMLElement>('[data-testid="acquisition-metadata"]')!;
      expect(getComputedStyle(footer).direction).toBe('ltr');
      expect(getComputedStyle(statistics).justifyContent).toBe('flex-start');
      expect(getComputedStyle(metadata).justifyContent).toBe('flex-end');
      expect(metadata.children[0].getAttribute('data-testid')).toBe('acquisition-start');
      expect(metadata.getBoundingClientRect().top).toBeGreaterThanOrEqual(statistics.getBoundingClientRect().bottom);
      const series = (fixture.componentInstance.chartOptions as { series: { lineStyle: { color: string } }[] }).series;
      expect(series[0].lineStyle.color).toBe('#2563EB');
      expect(series[1].lineStyle.color).toBe('#EA580C');
      const chart = fixture.nativeElement.querySelector('app-apache-echarts') as HTMLElement;
      expect(chart.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    } finally { fixture.destroy(); }
  });
});
