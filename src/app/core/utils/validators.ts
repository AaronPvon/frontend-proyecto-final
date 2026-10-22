import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Un campo con solo espacios cuenta como vacío (la API quita los espacios)
export const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value.trim() === '' ? { required: true } : null;
