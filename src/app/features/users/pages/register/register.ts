import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { getErrorMessage } from '../../../../core/utils/api-error';
import { AuthService } from '../../services/auth.service';

// Mismo patrón que la API: letras sin tildes ni ñ, números, _ . -
const NICKNAME_PATTERN = /^[A-Za-z0-9_.-]{3,50}$/;

// Un campo con solo espacios cuenta como vacío (la API quita los espacios)
const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value.trim() === '' ? { required: true } : null;

// Las dos contraseñas deben coincidir
const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null =>
  group.get('password')?.value === group.get('repeatPassword')?.value
    ? null
    : { passwordsMismatch: true };

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      name: ['', [notBlank, Validators.maxLength(100)]],
      lastname: ['', [notBlank, Validators.maxLength(150)]],
      nickname: ['', [Validators.required, Validators.pattern(NICKNAME_PATTERN)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      repeatPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const { name, lastname, nickname, email, password } = this.form.getRawValue();

    // Se quitan los espacios de los extremos, nunca de la contraseña
    this.auth
      .register({
        name: name.trim(),
        lastname: lastname.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
        password,
      })
      .subscribe({
        next: () => this.router.navigate(['/login'], { queryParams: { registered: 1 } }),
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(getErrorMessage(error));
        },
      });
  }
}
