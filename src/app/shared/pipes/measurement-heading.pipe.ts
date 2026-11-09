import { Pipe, PipeTransform } from '@angular/core';
import { TaxonomyEntitySummary } from 'src/app/core/models/asset-taxonomy-selection.model';

/** One heading format for single-channel charts and explicit X/Y probe pairs. */
@Pipe({ name: 'measurementHeading', standalone: true })
export class MeasurementHeadingPipe implements PipeTransform {
  transform(componentName: string, measurements: readonly Pick<TaxonomyEntitySummary, 'name' | 'tag'>[],
    axes?: readonly string[]): string {
    const channels = measurements.map((measurement, index) => {
      const name = measurement.name.trim(), tag = measurement.tag?.trim();
      const matchedAxes = ['X', 'Y', 'Z'].filter(axis => new RegExp(`(?:^|[\\s_/-])${axis}(?:$|[\\s_/-])`, 'i').test(name));
      const axis = axes?.[index] ?? (matchedAxes.length === 1 ? matchedAxes[0] : undefined);
      return `${axis ? axis + ': ' : ''}${name}${tag ? ' ' + tag : ''}`;
    });
    return [componentName, ...channels].join(' · ');
  }
}
