import { Pipe, PipeTransform } from '@angular/core';
import { formatVibrationDateTime } from 'src/app/core/utils/vibration-date-time';

/** UTC instants use Tehran; already-local event times retain their wall clock. */
@Pipe({ name: 'acquisitionDate', standalone: true })
export class AcquisitionDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatVibrationDateTime(value);
  }
}
