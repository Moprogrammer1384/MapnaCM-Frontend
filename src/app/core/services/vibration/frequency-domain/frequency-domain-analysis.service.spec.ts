import { TestBed } from '@angular/core/testing';
import { RawVibrationRecord } from '../../../models/vibration-data.model';
import { prepareFrequencyDomainRecord, analyzeFrequencyDomain } from './frequency-domain-analysis';
import { FrequencyDomainAnalysisService } from './frequency-domain-analysis.service';

describe('Frequency Domain analysis worker sessions', () => {
  const raw: RawVibrationRecord = { id: 'worker', label: 'Worker test', quantity: 'displacement', unit: 'µm',
    timeUnit: 'ms', time: [0, 1, 2, 3, 4], values: [1, -3, 2, 0, 7] };
  const settings = { quantity: 'velocity', unit: 'mm/s', xAxis: 'hz', amplitude: 'rms' } as const;

  it('runs the actual worker, shares results between consumers and releases the final session', async () => {
    const service = TestBed.inject(FrequencyDomainAnalysisService);
    const first = service.acquire(raw);
    const second = service.acquire(raw);
    const operation = first.analyze(settings);
    expect(second.analyze(settings)).toBe(operation);
    const actual = await operation;
    const expected = analyzeFrequencyDomain(prepareFrequencyDomainRecord(raw), settings);
    expect(Array.from(actual.values)).toEqual(Array.from(expected.values));
    expect(actual.resolutionHz).toEqual(expected.resolutionHz);
    first.release(); first.release();
    await expectAsync(first.analyze(settings)).toBeRejectedWithError(/closed/);
    expect(await second.analyze(settings)).toBe(actual);
    second.release();
    const fresh = service.acquire(raw);
    expect(await fresh.analyze(settings)).not.toBe(actual);
    fresh.release();
  });

  it('reports bad raw data and can process a different valid record afterward', async () => {
    const service = TestBed.inject(FrequencyDomainAnalysisService);
    const invalid = service.acquire({ ...raw, values: [NaN, 1, 2, 3, 4] });
    await expectAsync(invalid.analyze(settings)).toBeRejectedWithError(/non-finite/);
    invalid.release();
    const valid = service.acquire(raw);
    expect((await valid.analyze(settings)).sampleCount).toBe(5);
    valid.release();
  });

  it('uses identical numerical processing when worker construction is unavailable', async () => {
    spyOn(window, 'Worker').and.throwError('Workers unavailable');
    const session = TestBed.inject(FrequencyDomainAnalysisService).acquire(raw);
    const result = await session.analyze(settings);
    expect(Array.from(result.values)).toEqual(Array.from(analyzeFrequencyDomain(prepareFrequencyDomainRecord(raw), settings).values));
    session.release();
  });
});
