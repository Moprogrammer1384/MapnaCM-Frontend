/**
 * Wire format of every MapnaCM backend endpoint (Shared.Core.Wrappers.Response<T>).
 * Successful business results use HTTP 200; failed results use HTTP 400 with
 * success = false. Older hosts may still use 200 for failed results, so keep
 * inspecting success. HttpClient exposes non-2xx envelopes in error.error.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: T;
}
