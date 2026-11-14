import { WaterfallCapture, WaterfallSettings, WaterfallSpectrum } from '../../../models/waterfall.model';
import { analyzeFrequencyDomain, prepareFrequencyDomainRecord } from '../frequency-domain/frequency-domain-analysis';

/** Each snapshot is transformed independently; time gaps are never interpolated. */
export function prepareWaterfall(capture: WaterfallCapture) {
  if (!capture.frames.length || capture.frames.some((frame, index) => frame.rpm !== null && (!Number.isFinite(frame.rpm) || frame.rpm < 0)
    || !Number.isFinite(frame.elapsedSeconds) || frame.elapsedSeconds < 0
    || (index > 0 && frame.elapsedSeconds <= capture.frames[index - 1].elapsedSeconds))) {
    throw new Error('Invalid Waterfall snapshot timing or speed metadata.');
  }
  return capture.frames.map(frame => ({ ...frame, prepared: prepareFrequencyDomainRecord(frame.raw) }));
}

export function analyzeWaterfall(frames: ReturnType<typeof prepareWaterfall>, settings: WaterfallSettings): WaterfallSpectrum[] {
  return frames.map(frame => ({ ...analyzeFrequencyDomain(frame.prepared, settings),
    elapsedSeconds: frame.elapsedSeconds, rpm: frame.rpm }));
}
