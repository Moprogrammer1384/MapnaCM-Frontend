/// <reference lib="webworker" />

import { FrequencyDomainWorkerRequest, FrequencyDomainWorkerResponse } from '../../../models/frequency-domain.model';
import { prepareFrequencyDomainRecord, analyzeFrequencyDomain } from './frequency-domain-analysis';

let record: ReturnType<typeof prepareFrequencyDomainRecord> | undefined;
addEventListener('message', ({ data }: MessageEvent<FrequencyDomainWorkerRequest>) => {
  try {
    if (data.type === 'load') {
      record = prepareFrequencyDomainRecord(data.record);
      postMessage({ id: data.id, loaded: true } satisfies FrequencyDomainWorkerResponse);
    } else {
      if (!record) { throw new Error('Raw record has not been loaded.'); }
      const result = analyzeFrequencyDomain(record, data.settings);
      postMessage({ id: data.id, result } satisfies FrequencyDomainWorkerResponse, [result.frequency.buffer, result.values.buffer]);
    }
  } catch (error) {
    postMessage({ id: data.id, error: error instanceof Error ? error.message : 'Vibration analysis failed.' } satisfies FrequencyDomainWorkerResponse);
  }
});
