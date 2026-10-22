import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { parseCents } from './money';

// Un campo con solo espacios cuenta como vacío (la API quita los espacios)
export const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value.trim() === '' ? { required: true } : null;

// Importe obligatorio: formato de DECIMAL(10,2) (coma o punto) y mayor que 0
export const amountValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: string = control.value.trim();
  if (value === '') {
    return { required: true };
  }
  const cents = parseCents(value);
  if (cents === null) {
    return { amountFormat: true };
  }
  return cents > 0 ? null : { amountPositive: true };
};

// Fecha de hoy en formato "AAAA-MM-DD", en la hora local del navegador
export function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// La fecha de un gasto puede ser pasada, nunca futura
export const notFuture: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value && control.value > today() ? { future: true } : null;
