import { HttpErrorResponse } from '@angular/common/http';

/** Shared envelope/MVC error presentation, independent of feature services. */
export function apiErrorMessage(error: unknown, resource = 'data', api = 'API'): string {
  if (error instanceof HttpErrorResponse) {
    const payload = error.error as { message?: string; errors?: string[] | Record<string, string[]> } | null;
    const errors = payload?.errors;
    const messages: string[] = [];
    if (errors && typeof errors === 'object') {
      Object.values(errors).forEach(value => {
        if (typeof value === 'string') { messages.push(value); }
        else if (Array.isArray(value)) { value.forEach(item => { if (typeof item === 'string') { messages.push(item); } }); }
      });
    }
    const details = messages.join(' ');
    return [payload?.message, details].filter(Boolean).join(' ') || (error.status === 0
      ? `Unable to reach the ${api}.` : `Unable to load ${resource} (HTTP ${error.status}).`);
  }
  return error instanceof Error ? error.message : `Unable to load ${resource}.`;
}
