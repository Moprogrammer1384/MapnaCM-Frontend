import { TestBed } from '@angular/core/testing';
import { RawVibrationRecord } from '../../../models/vibration-data.model';
import { prepareTimeDomainRecord } from './time-domain-preparation';
import { analyzeTimeDomain } from './time-domain-analysis';
import { TimeDomainAnalysisService } from './time-domain-analysis.service';

describe('Time Domain analysis worker sessions', () => {
  const raw: RawVibrationRecord = { id: 'worker', label: 'Worker test', quantity: 'displacement', unit: 'µm',
    timeUnit: 'ms', time: [0, 1, 2, 3, 4], values: [1, -3, 2, 0, 7] };
  const settings = { quantity: 'velocity', unit: 'mm/s', xAxis: 'time', amplitude: 'rms' } as const;

  it('runs the actual worker, shares results between consumers and releases the final session', async () => {
    const service = TestBed.inject(TimeDomainAnalysisService);
    const first = service.acquire(raw);
    const second = service.acquire(raw);
    const operation = first.analyze(settings);
    expect(second.analyze(settings)).toBe(operation);
    const actual = await operation;
    const expected = analyzeTimeDomain(prepareTimeDomainRecord(raw), settings);
    expect(Array.from(actual.values)).toEqual(Array.from(expected.values));
    expect(actual.statistics).toEqual(expected.statistics);
    first.release(); first.release();
    await expectAsync(first.analyze(settings)).toBeRejectedWithError(/closed/);
    expect(await second.analyze(settings)).toBe(actual);
    second.release();
    const fresh = service.acquire(raw);
    expect(await fresh.analyze(settings)).not.toBe(actual);
    fresh.release();
  });

  it('reports bad raw data and can process a different valid record afterward', async () => {
    const service = TestBed.inject(TimeDomainAnalysisService);
    const invalid = service.acquire({ ...raw, values: [NaN, 1, 2, 3, 4] });
    await expectAsync(invalid.analyze(settings)).toBeRejectedWithError(/non-finite/);
    invalid.release();
    const valid = service.acquire(raw);
    expect((await valid.analyze(settings)).sampleCount).toBe(5);
    valid.release();
  });

  it('uses identical numerical processing when worker construction is unavailable', async () => {
    spyOn(window, 'Worker').and.throwError('Workers unavailable');
    const session = TestBed.inject(TimeDomainAnalysisService).acquire(raw);
    const result = await session.analyze(settings);
    expect(Array.from(result.values)).toEqual(Array.from(analyzeTimeDomain(prepareTimeDomainRecord(raw), settings).values));
    session.release();
  });
});
