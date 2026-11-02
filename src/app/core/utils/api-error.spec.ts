import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error';

describe('API error presentation', () => {
  const httpError = (error: unknown, status = 400) => new HttpErrorResponse({
    status, statusText: 'OK', url: 'https://localhost:7064/api/v1/PlantType/Add', error,
  });

  it('shows the business message and unique validation details instead of HTTP 400 OK', () => {
    const message = apiErrorMessage(httpError({ success: false, message: 'Type already exists.',
      errors: ['Type already exists.', 'Choose another name.'], data: null }));
    expect(message).toBe('Type already exists. Choose another name.');
    expect(message).not.toContain('Http failure response');
  });

  it('shows MVC field errors without title, URL, trace or data metadata', () => {
    expect(apiErrorMessage(httpError({ title: 'One or more validation errors occurred.',
      errors: { Name: ['Name is required.'], SiteId: ['Site is required.'] },
      type: 'https://example.test/problem', traceId: 'private-trace', data: { id: 'private-data' },
    }))).toBe('Name is required. Site is required.');
  });

  it('supports ProblemDetails detail and a title-only response', () => {
    expect(apiErrorMessage(httpError({ title: 'Conflict', detail: 'The type is in use.' }, 409)))
      .toBe('The type is in use.');
    expect(apiErrorMessage(httpError({ title: 'Access denied' }, 403))).toBe('Access denied');
  });

  it('supports JSON-encoded and plain-text response bodies', () => {
    expect(apiErrorMessage(httpError(JSON.stringify({ message: 'Duplicate type.' })))).toBe('Duplicate type.');
    expect(apiErrorMessage(httpError('  Duplicate type.  '))).toBe('Duplicate type.');
  });

  it('handles null, malformed fields, HTML and unexpected values with a readable fallback', () => {
    for (const body of [null, undefined, {}, 42, '<html><body>Server error</body></html>',
      { message: {}, errors: { Name: [null, 42, {}] } }]) {
      expect(apiErrorMessage(httpError(body), 'plants')).toBe('Unable to load plants (HTTP 400).');
    }
    expect(apiErrorMessage(httpError(null), 'data', 'API', 'Unable to save the type.'))
      .toBe('Unable to save the type.');
  });

  it('distinguishes connectivity failure and preserves ordinary errors and legacy envelopes', () => {
    expect(apiErrorMessage(httpError(new ProgressEvent('error'), 0), 'plants')).toBe('Unable to reach the API.');
    expect(apiErrorMessage(new Error('Local validation failed.'))).toBe('Local validation failed.');
    expect(apiErrorMessage({ success: false, errors: ['Name is required.'] })).toBe('Name is required.');
    expect(apiErrorMessage(null, 'plants')).toBe('Unable to load plants.');
  });
});
