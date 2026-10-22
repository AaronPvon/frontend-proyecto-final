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

import { Currency } from '../../../../core/interfaces/group.interface';
import { getErrorMessage } from '../../../../core/utils/api-error';
import { notBlank } from '../../../../core/utils/validators';
import { GroupsService } from '../../services/groups.service';

// Como DECIMAL(10,2): hasta 8 cifras enteras y 2 decimales. Se admite coma o punto.
const BUDGET_PATTERN = /^\d{1,8}([.,]\d{1,2})?$/;

// Presupuesto opcional: vacío es válido; si se escribe, formato correcto y mayor que 0
const budgetValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value.trim();
  if (value === '') {
    return null;
  }
  if (!BUDGET_PATTERN.test(value)) {
    return { budgetFormat: true };
  }
  return Number(value.replace(',', '.')) > 0 ? null : { budgetPositive: true };
};

@Component({
  selector: 'app-group-new',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './group-new.html',
})
export class GroupNew {
  private readonly groupsService = inject(GroupsService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly currencies: { value: Currency; label: string }[] = [
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'Dólar estadounidense (USD)' },
  ];

  protected readonly form = this.fb.group({
    title: ['', [notBlank, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(1000)]],
    budget: ['', [budgetValidator]],
    currency: ['EUR' as Currency, [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const { title, description, budget, currency } = this.form.getRawValue();

    // El presupuesto se envía como texto con punto ("150.50") para que llegue exacto
    this.groupsService
      .createGroup({
        title: title.trim(),
        description: description.trim() || null,
        budget: budget.trim() ? budget.trim().replace(',', '.') : null,
        currency,
      })
      .subscribe({
        next: (group) => this.router.navigate(['/groups', group.id]),
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(getErrorMessage(error));
        },
      });
  }
}
