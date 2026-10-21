import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AnalysisChartSettings } from '../../../models/analysis-chart-settings.model';
import { RawVibrationRecord } from '../../../models/vibration-data.model';
import { FrequencyDomainAnalysis, FrequencyDomainWorkerRequest, FrequencyDomainWorkerResponse } from '../../../models/frequency-domain.model';
import { prepareFrequencyDomainRecord, analyzeFrequencyDomain } from './frequency-domain-analysis';

export interface FrequencyDomainAnalysisSession {
  analyze(settings: AnalysisChartSettings): Promise<FrequencyDomainAnalysis>;
  release(): void;
}

/** One worker/cache per live raw record, shared by charts; terminated after the final consumer. */
@Injectable({ providedIn: 'root' })
export class FrequencyDomainAnalysisService implements OnDestroy {
  private readonly sessions = new Map<RawVibrationRecord, { engine: FrequencyDomainAnalysisEngine; references: number }>();

  constructor(private readonly zone: NgZone) {}

  acquire(raw: RawVibrationRecord): FrequencyDomainAnalysisSession {
    let entry = this.sessions.get(raw);
    if (!entry) {
      entry = { engine: new FrequencyDomainAnalysisEngine(raw, this.zone), references: 0 };
      this.sessions.set(raw, entry);
    }
    entry.references++;
    let released = false;
    const current = entry;
    return {
      analyze: settings => released ? Promise.reject(new Error('Analysis session is closed.')) : current.engine.analyze(settings),
      release: () => {
        if (released) { return; }
        released = true;
        if (--current.references === 0) { current.engine.destroy(); this.sessions.delete(raw); }
      },
    };
  }

  ngOnDestroy(): void {
    this.sessions.forEach(entry => entry.engine.destroy());
    this.sessions.clear();
  }
}

class FrequencyDomainAnalysisEngine {
  private worker?: Worker;
  private sequence = 0;
  private readonly pending = new Map<number, { resolve: (value: FrequencyDomainWorkerResponse) => void; reject: (reason: Error) => void }>();
  private readonly cache = new Map<string, Promise<FrequencyDomainAnalysis>>();
  private readonly ready: Promise<unknown>;
  private closed = false;
  private fallback?: ReturnType<typeof prepareFrequencyDomainRecord>;

  constructor(private readonly raw: RawVibrationRecord, private readonly zone: NgZone) {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = this.zone.runOutsideAngular(() => new Worker(new URL('./frequency-domain-analysis.worker', import.meta.url), { type: 'module' }));
        this.worker.onmessage = ({ data }: MessageEvent<FrequencyDomainWorkerResponse>) => this.zone.run(() => {
          const request = this.pending.get(data.id);
          this.pending.delete(data.id);
          if ('error' in data) { request?.reject(new Error(data.error)); } else { request?.resolve(data); }
        });
        this.worker.onerror = () => this.zone.run(() => {
          this.failWorker(new Error('Vibration worker failed to start or process data. Retry the analysis.'));
        });
        this.ready = this.send({ type: 'load', record: raw });
      } catch {
        // Environments without worker support use exactly the same numerical functions.
        this.worker?.terminate(); this.worker = undefined;
        this.ready = Promise.resolve();
      }
    } else { this.ready = Promise.resolve(); }
    // Consumers observe the error on analyze(); avoid an unhandled startup rejection.
    void this.ready.catch(() => undefined);
  }

  analyze(settings: AnalysisChartSettings): Promise<FrequencyDomainAnalysis> {
    if (this.closed) { return Promise.reject(new Error('Analysis engine is closed.')); }
    const key = JSON.stringify(settings);
    const existing = this.cache.get(key);
    if (existing) { this.cache.delete(key); this.cache.set(key, existing); return existing; }
    const operation = this.ready.then(async () => {
      if (this.closed) { throw new Error('Analysis engine is closed.'); }
      if (this.worker) {
        const response = await this.send({ type: 'analyze', settings });
        if ('result' in response) { return response.result; }
        throw new Error('Unexpected worker response.');
      }
      // Let loading feedback render before the O(N log N) FFT fallback.
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (this.closed) { throw new Error('Analysis engine is closed.'); }
      this.fallback ??= prepareFrequencyDomainRecord(this.raw);
      return analyzeFrequencyDomain(this.fallback, settings);
    });
    this.cache.set(key, operation);
    if (this.cache.size > 6) { this.cache.delete(this.cache.keys().next().value!); }
    void operation.catch(() => { if (this.cache.get(key) === operation) { this.cache.delete(key); } });
    return operation;
  }

  destroy(): void {
    this.closed = true;
    this.failWorker(new Error('Analysis session closed.'));
    this.cache.clear();
    this.fallback = undefined;
  }

  private failWorker(error: Error): void {
    this.worker?.terminate();
    this.worker = undefined;
    this.pending.forEach(request => request.reject(error));
    this.pending.clear();
  }

  private send(message: { type: 'load'; record: RawVibrationRecord } | { type: 'analyze'; settings: AnalysisChartSettings }): Promise<FrequencyDomainWorkerResponse> {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      try { this.worker!.postMessage({ ...message, id } satisfies FrequencyDomainWorkerRequest); }
      catch (error) { this.pending.delete(id); reject(error); }
    });
  }
}
