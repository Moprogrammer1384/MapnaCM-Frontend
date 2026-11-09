import { Injectable } from '@angular/core';
import { defer, Observable, of } from 'rxjs';
import { RotorPositionEvent, RotorPositionPair, RotorPositionRecord } from 'src/app/core/models/rotor-position.model';
import type { RotorPositionDataSource } from './rotor-position-data-source.service';

/** Explicit frontend demonstration data. Never a fallback for measured/API data. */
@Injectable({ providedIn: 'root' })
export class RotorPositionMockDataSource implements RotorPositionDataSource {
  private readonly events: readonly RotorPositionEvent[] = ['2026-11-03', '2026-11-06', '2026-11-08'].reduce<RotorPositionEvent[]>((events, day, index) => events.concat(
    (['Startup', 'CoastDown', 'Trip'] as const).map((eventType, kind) => {
      const hour = [10, 16, 22][kind], duration = [180, 150, 54][kind] + index * [12, 9, 3][kind];
      const from = `${day}T${hour}:00:00`;
      const to = `${day}T${hour}:0${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
      return { id: `simulated-${day}-${eventType}`, eventType, from, to,
        label: `${day} · ${hour}:00:00 · ${eventType === 'CoastDown' ? 'Coast down' : eventType}` };
    })), []);

  listEvents(pairs: readonly RotorPositionPair[]): Observable<readonly RotorPositionEvent[]> {
    return of(pairs.length ? this.events : []);
  }

  load(pair: RotorPositionPair, eventId: string): Observable<RotorPositionRecord | null> {
    return defer(() => {
      const event = this.events.find(item => item.id === eventId);
      if (!event) { return of(null); }
      const duration = (Date.parse(event.to) - Date.parse(event.from)) / 1000;
      const count = event.eventType === 'Trip' ? 181 : 241;
      const variation = (pair.x.component.id % 7) / 7, day = this.events.indexOf(event) / 12;
      const angleX = Math.PI / 4, angleY = 3 * Math.PI / 4;
      const observations = Array.from({ length: count }, (_, index) => {
        const t = index / (count - 1);
        const acceleration = t * t * (3 - 2 * t);
        const speedRpm = event.eventType === 'Startup' ? 3000 * acceleration
          : event.eventType === 'CoastDown' ? 3000 * (1 - acceleration) : 3000 * Math.pow(1 - t, 2.2);
        const lift = 1 - Math.exp(-speedRpm / 620);
        const settling = event.eventType === 'Trip' ? 3 * Math.sin(t * Math.PI * 4) * Math.exp(-t * 5) : 0;
        const x = -3 - (15 + variation * 3) * lift + 3 * Math.sin(lift * Math.PI) + settling + day;
        const y = -68 + (42 + variation * 4) * lift + (event.eventType === 'CoastDown' ? 3 * Math.sin(t * Math.PI) : 0)
          + 0.3 * Math.sin(index * 0.37) * Math.sin(t * Math.PI);
        return { timeSeconds: duration * t,
          meanProbeX: x * Math.cos(angleX) + y * Math.sin(angleX),
          meanProbeY: x * Math.cos(angleY) + y * Math.sin(angleY), speedRpm, quality: 'valid' as const };
      });
      return of({ id: `${event.id}-${pair.key}`, event, pairKey: pair.key, provenance: 'simulated' as const,
        quantity: 'displacement' as const, unit: 'µm' as const, dcPreserved: true, synchronized: true,
        meanWindowSeconds: duration / (count - 1), probeAnglesDegrees: [45, 135] as const,
        reference: { probeMean: [0, 0] as const, position: [0, 0] as const, bearingCentreKnown: true },
        clearance: { radialX: 80, radialY: 80 }, observations });
    });
  }
}
