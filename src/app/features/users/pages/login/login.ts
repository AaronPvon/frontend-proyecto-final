import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { getErrorMessage } from '../../../../core/utils/api-error';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  // Tras registrarse, /register redirige aquí con ?registered=1
  protected readonly justRegistered =
    inject(ActivatedRoute).snapshot.queryParamMap.get('registered') === '1';

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // En el login solo se exige que los campos no lleguen vacíos (y el máximo de la contraseña)
  protected readonly form = this.fb.group({
    login: ['', [Validators.required, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.maxLength(128)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const { login, password } = this.form.getRawValue();

    this.auth.login({ login: login.trim(), password }).subscribe({
      next: () => this.router.navigateByUrl('/groups'),
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(getErrorMessage(error));
      },
    });
  }
}
