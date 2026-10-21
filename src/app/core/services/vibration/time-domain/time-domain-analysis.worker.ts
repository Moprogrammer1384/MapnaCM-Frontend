/// <reference lib="webworker" />

import { PreparedTimeDomainRecord, TimeDomainWorkerRequest, TimeDomainWorkerResponse } from '../../../models/vibration-data.model';
import { prepareTimeDomainRecord } from './time-domain-preparation';
import { analyzeTimeDomain } from './time-domain-analysis';

let record: PreparedTimeDomainRecord | undefined;
addEventListener('message', ({ data }: MessageEvent<TimeDomainWorkerRequest>) => {
  try {
    if (data.type === 'load') {
      record = prepareTimeDomainRecord(data.record);
      postMessage({ id: data.id, loaded: true } satisfies TimeDomainWorkerResponse);
    } else {
      if (!record) { throw new Error('Raw record has not been loaded.'); }
      const result = analyzeTimeDomain(record, data.settings);
      postMessage({ id: data.id, result } satisfies TimeDomainWorkerResponse, [result.time.buffer, result.values.buffer]);
    }
  } catch (error) {
    postMessage({ id: data.id, error: error instanceof Error ? error.message : 'Vibration analysis failed.' } satisfies TimeDomainWorkerResponse);
  }
});
