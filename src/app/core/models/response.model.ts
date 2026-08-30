/**
 * Wire format of every MapnaCM backend endpoint (Shared.Core.Wrappers.Response<T>).
 * Business failures (wrong password, inactive account, ...) are returned with
 * HTTP 200 and success = false, so consumers must branch on `success`, not on
 * the HTTP status. 401/403 use the same envelope with a message.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string | null;
  errors?: string[] | null;
  data?: T;
}
