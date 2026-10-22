import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';

import { ExpenseCreate } from '../../../../core/interfaces/expense.interface';
import { GroupDetail } from '../../../../core/interfaces/group.interface';
import { getErrorMessage } from '../../../../core/utils/api-error';
import { centsToApi, parseCents, splitEqually } from '../../../../core/utils/money';
import { amountValidator, notBlank, notFuture, today } from '../../../../core/utils/validators';
import { AuthService } from '../../../users/services/auth.service';
import { ExpensesService } from '../../services/expenses.service';
import { GroupsService } from '../../services/groups.service';

// Los tres modos de reparto. "all" y "some" se guardan como split_type "equal".
type SplitMode = 'all' | 'some' | 'custom';

@Component({
  selector: 'app-expense-new',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './expense-new.html',
  styleUrl: './expense-new.css',
})
export class ExpenseNew {
  private readonly groupsService = inject(GroupsService);
  private readonly expensesService = inject(ExpensesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  // El :id del grupo llega como input() gracias a withComponentInputBinding
  readonly id = input.required<string>();

  protected readonly group = signal<GroupDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly maxDate = today();

  protected readonly modes: { value: SplitMode; label: string; hint: string }[] = [
    { value: 'all', label: 'Iguales entre todos', hint: 'Todos los miembros pagan lo mismo.' },
    { value: 'some', label: 'Iguales entre algunos', hint: 'Solo los marcados, a partes iguales.' },
    { value: 'custom', label: 'Personalizado', hint: 'Escribe lo que le toca a cada uno.' },
  ];

  // participants y customAmounts tienen un control por miembro, con su id como nombre.
  // Se rellenan cuando llegan los miembros del grupo.
  protected readonly form = this.fb.group({
    title: ['', [notBlank, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(1000)]],
    amount: ['', [amountValidator]],
    paidBy: [0, [Validators.min(1)]],
    expenseDate: [today(), [Validators.required, notFuture]],
    mode: ['all' as SplitMode],
    participants: this.fb.record<boolean>({}),
    customAmounts: this.fb.record<string>({}),
  });

  // El valor del formulario como signal, para calcular la vista previa del reparto
  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly members = computed(() => this.group()?.members ?? []);
  protected readonly mode = computed(() => this.value().mode ?? 'all');
  protected readonly amountCents = computed(() => parseCents(this.value().amount ?? ''));

  // Participantes según el modo: todos, los marcados o los que tienen un importe escrito
  protected readonly participantIds = computed(() => {
    const value = this.value();
    const ids = this.members().map((member) => member.id);
    if (this.mode() === 'all') {
      return ids;
    }
    if (this.mode() === 'some') {
      return ids.filter((id) => value.participants?.[id]);
    }
    return ids.filter((id) => (value.customAmounts?.[id] ?? '').trim() !== '');
  });

  // Vista previa del reparto igual (la misma regla de céntimos que la API)
  protected readonly preview = computed(() => {
    const cents = this.amountCents();
    const ids = this.participantIds();
    if (this.mode() === 'custom' || !cents || ids.length === 0) {
      return null;
    }
    const shares = splitEqually(cents, ids);
    return { shares, tooSmall: Math.min(...shares.values()) === 0 };
  });

  // Reparto personalizado: suma de lo escrito y lo que falta por asignar
  protected readonly custom = computed(() => {
    const amounts = this.value().customAmounts ?? {};
    let assigned = 0;
    let invalid = false;
    for (const id of this.participantIds()) {
      const cents = parseCents(amounts[id] ?? '');
      if (cents === null || cents === 0) {
        invalid = true;
      } else {
        assigned += cents;
      }
    }
    return { assigned, remaining: (this.amountCents() ?? 0) - assigned, invalid };
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) =>
          this.groupsService.getGroup(id).pipe(
            map((group) => ({ group, error: null as unknown })),
            catchError((error) => of({ group: null, error: error as unknown })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ group, error }) => {
        this.loading.set(false);
        if (group) {
          this.setUp(group);
          return;
        }
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        if (status === 404 || status === 422) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set(getErrorMessage(error));
        }
      });
  }

  // Un control por miembro: casilla marcada (modo "algunos") e importe vacío (personalizado).
  // Por defecto paga el usuario actual.
  private setUp(group: GroupDetail): void {
    this.group.set(group);
    for (const member of group.members) {
      this.form.controls.participants.addControl(String(member.id), this.fb.control(true));
      this.form.controls.customAmounts.addControl(String(member.id), this.fb.control(''));
    }
    const me = this.auth.currentUser()?.id;
    const payer = group.members.some((member) => member.id === me) ? me! : group.members[0]?.id;
    this.form.controls.paidBy.setValue(payer ?? 0);
  }

  // Solo el creador apunta gastos, y con el grupo activo (la API lo comprueba igualmente)
  protected readonly canManage = computed(() => {
    const group = this.group();
    return !!group && group.status === 'active' && group.creator.id === this.auth.currentUser()?.id;
  });

  protected fieldInvalid(memberId: number): boolean {
    const text = this.value().customAmounts?.[memberId] ?? '';
    return text.trim() !== '' && !parseCents(text);
  }

  submit(): void {
    this.submitError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Reglas del reparto que no son de un solo campo
    const ids = this.participantIds();
    if (ids.length === 0) {
      this.submitError.set('Elige al menos un participante.');
      return;
    }
    if (this.preview()?.tooSmall) {
      this.submitError.set(`El importe es demasiado pequeño para repartirlo entre ${ids.length} personas.`);
      return;
    }
    const custom = this.custom();
    if (this.mode() === 'custom' && (custom.invalid || custom.remaining !== 0)) {
      this.submitError.set('Las partes tienen que ser importes válidos y sumar exactamente el total del gasto.');
      return;
    }

    const value = this.form.getRawValue();
    const data: ExpenseCreate = {
      title: value.title.trim(),
      description: value.description.trim() || null,
      amount: centsToApi(this.amountCents()!),
      paid_by: value.paidBy,
      expense_date: value.expenseDate,
      split_type: this.mode() === 'custom' ? 'custom' : 'equal',
      // En "equal" solo los user_id; en "custom", también su importe
      shares: ids.map((id) =>
        this.mode() === 'custom'
          ? { user_id: id, amount: centsToApi(parseCents(value.customAmounts[id])!) }
          : { user_id: id },
      ),
    };

    this.saving.set(true);
    this.expensesService.createExpense(this.id(), data).subscribe({
      // Vuelve al grupo, que pide de nuevo gastos, saldos y total gastado
      next: () => this.router.navigate(['/groups', this.id()]),
      error: (error) => {
        this.saving.set(false);
        this.submitError.set(getErrorMessage(error));
      },
    });
  }
}
