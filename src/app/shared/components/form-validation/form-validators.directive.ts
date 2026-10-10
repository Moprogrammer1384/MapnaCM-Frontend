import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

/** Required text must contain a non-whitespace character; model values stay intact. */
@Directive({
  selector: '[appTrimmedRequired]',
  providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => TrimmedRequiredDirective), multi: true }],
})
export class TrimmedRequiredDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    return typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };
  }
}

/** Keep existing finite-number rules visible to NgForm and inline feedback. */
@Directive({
  selector: '[appFiniteNumber]',
  providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => FiniteNumberDirective), multi: true }],
})
export class FiniteNumberDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors | null {
    const value: unknown = control.value;
    return value === null || value === undefined || value === '' ||
      (typeof value === 'number' && Number.isFinite(value)) ? null : { finiteNumber: true };
  }
}
