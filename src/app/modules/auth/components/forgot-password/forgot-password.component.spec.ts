import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('Password reset error feedback', () => {
  it('reports HTTP errors and clears a stale error when a retry succeeds', () => {
    const auth = jasmine.createSpyObj<AuthService>('auth', ['forgotPassword'], { isLoading$: of(false) });
    const component = new ForgotPasswordComponent(new FormBuilder(), auth);
    component.ngOnInit();
    auth.forgotPassword.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, statusText: 'OK',
      error: { message: 'Password reset is unavailable.' } })));
    component.submit();
    expect(component.errorMessage).toBe('Password reset is unavailable.');
    expect(component.errorState).toBe(component.errorStates.HasError);
    auth.forgotPassword.and.returnValue(of(true));
    component.submit();
    expect(component.errorMessage).toBe('');
    expect(component.errorState).toBe(component.errorStates.NoError);
  });
});
