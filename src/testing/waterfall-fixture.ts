import { Injectable } from '@angular/core';
import { defer, map, Observable, timer } from 'rxjs';
import { WaterfallCapture, WaterfallEvent, WaterfallEventType, WaterfallRequest } from 'src/app/core/models/waterfall.model';

import type { WaterfallDataSource } from 'src/app/core/services/vibration/waterfall/waterfall-data-source.service';

/** Mock history: normal days and days containing all their transient acquisitions. */
export function mockWaterfallEvents(): readonly WaterfallEvent[] {
  const events: WaterfallEvent[] = [];
  const add = (day: string, time: string, eventType: WaterfallEventType, seconds: number) => {
    const from = `${day}T${time}:00`;
    // Local calendar arithmetic, independent of the browser's timezone.
    const to = new Date(Date.parse(from + 'Z') + seconds * 1000).toISOString().slice(0, 19);
    events.push({ id: `waterfall-${day}-${time}-${eventType}`, eventType, from, to });
  };
  for (let index = 1; index <= 14; index++) {
    const day = `2026-11-${String(index).padStart(2, '0')}`;
    add(day, '10:00', 'SteadyState', 64);
    if (index % 2 === 0) { add(day, '17:00', 'SteadyState', 64); }
    if (index % 3 === 0) {
      add(day, '07:10', 'Startup', 180); add(day, '12:10', 'CoastDown', 240);
      add(day, '14:20', 'Startup', 180); add(day, '18:40', 'Trip', 90);
    } else if (index % 3 === 2) {
      add(day, '08:00', 'Startup', 180); add(day, '20:00', 'CoastDown', 240);
    }
  }
  return events.sort((a, b) => a.from.localeCompare(b.from));
}

/** Deterministic independent velocity frames spanning one exact mock acquisition. */
export function createMockWaterfall(request: WaterfallRequest): WaterfallCapture {
  const event = mockWaterfallEvents().find(item => item.id === request.eventId);
  if (!event || !Number.isInteger(request.measurementId) || request.measurementId <= 0) {
    throw new Error('Select an existing Waterfall acquisition and a valid measurement.');
  }
  const duration = (Date.parse(event.to + '+03:30') - Date.parse(event.from + '+03:30')) / 1000;
  const sampleRate = 512, count = 1024, frameSeconds = count / sampleRate;
  const frameCount = duration / frameSeconds;
  const phase = request.measurementId * 0.37;
  const frames = Array.from({ length: frameCount }, (_, index) => {
    const progress = index / (frameCount - 1);
    const rpm = event.eventType === 'SteadyState' ? 3000 : event.eventType === 'CoastDown'
      ? 3600 * (1 - progress) : event.eventType === 'Trip' ? 3600 * Math.pow(1 - progress, 2) : 3600 * progress;
    const hz = rpm / 60, running = rpm > 0 ? 1 : 0;
    const resonance = 1 + 3 * Math.exp(-Math.pow((hz - 40) / 6, 2));
    const time = Array.from({ length: count }, (__, sample) => sample / sampleRate);
    const transient = event.eventType === 'Trip' ? 1 + 1.5 * Math.exp(-Math.pow((progress - 0.12) / 0.06, 2)) : 1;
    const values = time.map(t => running * (
      Math.SQRT2 * resonance * transient * Math.sin(2 * Math.PI * hz * t + phase)
      + 0.6 * Math.SQRT2 * Math.sin(2 * Math.PI * 2 * hz * t + phase / 2)
      + 0.25 * Math.SQRT2 * Math.sin(2 * Math.PI * 3 * hz * t)
      + 0.35 * Math.SQRT2 * Math.sin(2 * Math.PI * 72 * t)
      + 0.025 * Math.sin(2 * Math.PI * 137.5 * t + index)));
    return { elapsedSeconds: index * frameSeconds, rpm,
      raw: { id: `mock-${event.id}-${request.measurementId}-${index}`,
        label: 'Simulated velocity frame', quantity: 'velocity' as const, unit: 'mm/s' as const,
        timeUnit: 's' as const, time, values } };
  });
  return { event, startedAt: event.from, frames };
}

@Injectable()
export class MockWaterfallDataSource implements WaterfallDataSource {
  listEvents(measurementIds: readonly number[]): Observable<readonly WaterfallEvent[]> {
    return defer(() => timer(100).pipe(map(() => measurementIds.length && measurementIds.every(id => Number.isInteger(id) && id > 0)
      ? mockWaterfallEvents() : [])));
  }
  load(request: WaterfallRequest): Observable<WaterfallCapture> {
    return defer(() => timer(100).pipe(map(() => createMockWaterfall(request))));
  }
}

