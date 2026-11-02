import { HttpErrorResponse } from '@angular/common/http';

/** Shared envelope/MVC error presentation, independent of feature services. */
export function apiErrorMessage(error: unknown, resource = 'data', api = 'API', fallback?: string): string {
  if (error instanceof HttpErrorResponse) {
    // HttpErrorResponse.message describes the transport, not the server rejection.
    return payloadMessage(error.error) || (error.status === 0
      ? `Unable to reach the ${api}.`
      : fallback || `Unable to load ${resource} (HTTP ${error.status}).`);
  }
  return payloadMessage(error) || fallback || `Unable to load ${resource}.`;
}

function payloadMessage(payload: unknown): string {
  if (typeof payload === 'string') {
    const value = payload.trim();
    if (!value) { return ''; }
    try {
      return payloadMessage(JSON.parse(value));
    } catch {
      // Do not present an HTML proxy/server error page as a business message.
      return /<[^>]+>/.test(value) ? '' : value;
    }
  }
  if (!payload || typeof payload !== 'object') { return ''; }

  const body = payload as { message?: unknown; detail?: unknown; title?: unknown; errors?: unknown };
  const messages: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) { messages.push(value.trim()); }
  };
  add(body.message);
  add(body.detail);
  if (body.errors && typeof body.errors === 'object') {
    Object.values(body.errors).forEach(value => {
      if (Array.isArray(value)) { value.forEach(add); }
      else { add(value); }
    });
  }
  // Prefer actionable validation details over the generic MVC title.
  if (!messages.length) { add(body.title); }
  return Array.from(new Set(messages)).join(' ');
}
