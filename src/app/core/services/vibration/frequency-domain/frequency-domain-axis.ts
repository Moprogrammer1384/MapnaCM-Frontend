import { AnalysisChartSettings } from '../../../models/analysis-chart-settings.model';

/** Order is a constant-speed reference axis; variable-speed tracking needs tach data. */
export function frequencyDomainAxis(settings: AnalysisChartSettings): { unit: 'Hz' | 'CPM' | 'Order'; scale: number } {
  switch (settings.xAxis) {
    case 'hz': return { unit: 'Hz', scale: 1 };
    case 'cpm': return { unit: 'CPM', scale: 60 };
    case 'order':
      if (!Number.isFinite(settings.referenceRpm) || settings.referenceRpm! <= 0) {
        throw new Error('Enter a positive reference speed (RPM) to display Order.');
      }
      return { unit: 'Order', scale: 60 / settings.referenceRpm! };
    default: throw new Error('Select Hz, CPM or Order for Frequency Domain.');
  }
}
