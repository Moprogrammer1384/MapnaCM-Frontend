# DARP Vibration APIs

Updated 2026-11-03. All Vibration HTTP adapters live in this folder. Filenames
and injectable classes identify the Vibration module, backend feature and purpose.
Numerical analysis and workers remain in their respective feature folders.

| Service file | Injectable class | Page / purpose | Existing GET endpoint |
| --- | --- | --- | --- |
| `vibration-time-domain-api.service.ts` | `VibrationTimeDomainApiService` | Time Domain and Frequency Domain waveform/summary reads | `/TimeDomain/Get` |
| `vibration-time-domain-availability-api.service.ts` | `VibrationTimeDomainAvailabilityApiService` | Available calendar days for Time Domain and Frequency Domain | `/TimeDomain/GetAvailability` |
| `vibration-bode-analysis-api.service.ts` | `VibrationBodeAnalysisApiService` | Bode Analysis acquisitions | `/BodeAnalysis/Get` |
| `vibration-bode-analysis-availability-api.service.ts` | `VibrationBodeAnalysisAvailabilityApiService` | Bode Analysis event times and available dates | `/BodeAnalysis/GetAvailability` |

Frequency Domain computes its FFT locally from the Time Domain response; it has
no separate HTTP endpoint.

`VIBRATION_DATA_SOURCE` defaults to `VibrationTimeDomainApiService`.
`BODE_DATA_SOURCE` remains in `../bode-analysis/bode-data-source.service.ts` and
defaults to `VibrationBodeAnalysisApiService`. The shared
`TIME_AVAILABILITY_SOURCE` contract/token remains in
`../../time-availability.service.ts`, with the Time Domain adapter as its default.
The Bode page overrides that token with its own availability adapter.

Endpoint paths, request filters, time conversions, metadata validation and error
handling are unchanged by this organization. Use direct imports from these files;
do not add duplicate API implementations inside numerical or page folders.
