import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { Expense } from '../../../../core/interfaces/expense.interface';
import { Balance, GroupDetail } from '../../../../core/interfaces/group.interface';
import { GroupInvitation } from '../../../../core/interfaces/invitation.interface';
import { getErrorMessage } from '../../../../core/utils/api-error';
import { notBlank } from '../../../../core/utils/validators';
import { AuthService } from '../../../users/services/auth.service';
import { ExpensesService } from '../../services/expenses.service';
import { GroupsService } from '../../services/groups.service';
import { InvitationsService } from '../../services/invitations.service';

// Saldo preparado para mostrarlo: la cantidad sin signo y si le deben, debe o está al día
interface BalanceView extends Balance {
  amount: number;
  kind: 'owed' | 'owes' | 'settled';
}

// Se llama GroupDetailPage para no confundirse con la interfaz GroupDetail
@Component({
  selector: 'app-group-detail',
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './group-detail.html',
  styleUrl: './group-detail.css',
})
export class GroupDetailPage {
  private readonly groupsService = inject(GroupsService);
  private readonly invitationsService = inject(InvitationsService);
  private readonly expensesService = inject(ExpensesService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly title = inject(Title);
  protected readonly auth = inject(AuthService);

  // El :id de la ruta llega como input() gracias a withComponentInputBinding
  readonly id = input.required<string>();

  protected readonly group = signal<GroupDetail | null>(null);
  protected readonly balances = signal<BalanceView[]>([]);
  protected readonly expenses = signal<Expense[]>([]);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly isCreator = computed(
    () => this.group()?.creator.id === this.auth.currentUser()?.id,
  );

  // ---- Invitaciones pendientes del grupo ----
  protected readonly invitations = signal<GroupInvitation[]>([]);

  // Solo el creador gestiona las invitaciones, y solo con el grupo activo.
  // La API lo comprueba igualmente: aquí solo se ocultan los controles.
  protected readonly canManage = computed(
    () => this.isCreator() && this.group()?.status === 'active',
  );

  // Mismo campo que el login: email o nickname
  protected readonly inviteForm = this.fb.group({
    login: ['', [notBlank, Validators.maxLength(255)]],
  });
  protected readonly inviting = signal(false);
  protected readonly inviteMessage = signal<string | null>(null);
  protected readonly inviteError = signal<string | null>(null);

  // Invitación que está pidiendo confirmación para anularla, y la que se está anulando
  protected readonly confirmingCancelId = signal<number | null>(null);
  protected readonly cancellingId = signal<number | null>(null);

  // Los importes llegan como texto; se convierten a número solo para mostrarlos
  protected readonly budget = computed(() => {
    const group = this.group();
    if (!group?.budget) {
      return null;
    }
    const total = Number(group.budget);
    const spent = Number(group.total_spent);
    return {
      total,
      spent,
      percent: Math.min(100, (spent / total) * 100),
      remaining: total - spent,
      exceeded: spent > total,
    };
  });

  constructor() {
    // Detalle y saldos se piden a la vez (forkJoin). Si cambia el id, se vuelven a pedir.
    toObservable(this.id)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.notFound.set(false);
          this.errorMessage.set(null);
        }),
        switchMap((id) =>
          forkJoin({
            group: this.groupsService.getGroup(id),
            balances: this.groupsService.getBalances(id),
            invitations: this.invitationsService.getGroupInvitations(id),
            expenses: this.expensesService.getExpenses(id),
          }).pipe(
            map((data) => ({ data, error: null as unknown })),
            catchError((error) => of({ data: null, error: error as unknown })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ data, error }) => {
        this.loading.set(false);
        if (data) {
          this.group.set(data.group);
          this.balances.set(data.balances.map(toBalanceView));
          this.invitations.set(data.invitations);
          this.expenses.set(data.expenses);
          this.title.setTitle(`${data.group.title} | A Pachas`);
          return;
        }
        this.group.set(null);
        // 404: no existe o no eres miembro. 422: el id no es un número (/groups/abc).
        const status = error instanceof HttpErrorResponse ? error.status : 0;
        if (status === 404 || status === 422) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set(getErrorMessage(error));
        }
      });
  }

  invite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    this.inviting.set(true);
    this.inviteMessage.set(null);
    this.inviteError.set(null);

    this.invitationsService.invite(this.id(), { login: this.inviteForm.getRawValue().login.trim() }).subscribe({
      next: (invitation) => {
        this.inviting.set(false);
        this.inviteMessage.set(
          `Invitación enviada a ${invitation.user.name} ${invitation.user.lastname}.`,
        );
        this.inviteForm.reset();
        this.reloadInvitations();
      },
      // 404 "Usuario no encontrado", 409 si ya es miembro o ya está invitado...
      error: (error) => {
        this.inviting.set(false);
        this.inviteError.set(getErrorMessage(error));
      },
    });
  }

  // El primer clic pide confirmación; el segundo anula la invitación
  cancelInvitation(invitation: GroupInvitation): void {
    const userId = invitation.user.id;
    if (this.confirmingCancelId() !== userId) {
      this.confirmingCancelId.set(userId);
      return;
    }
    this.cancellingId.set(userId);
    this.inviteMessage.set(null);
    this.inviteError.set(null);

    this.invitationsService.cancel(this.id(), userId).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.confirmingCancelId.set(null);
        this.inviteMessage.set(
          `Invitación a ${invitation.user.name} ${invitation.user.lastname} anulada.`,
        );
        this.reloadInvitations();
      },
      error: (error) => {
        this.cancellingId.set(null);
        this.confirmingCancelId.set(null);
        this.inviteError.set(getErrorMessage(error));
        this.reloadInvitations();
      },
    });
  }

  keepInvitation(): void {
    this.confirmingCancelId.set(null);
  }

  // Tras un cambio solo se vuelve a pedir lo que ha cambiado: las invitaciones
  private reloadInvitations(): void {
    this.invitationsService.getGroupInvitations(this.id()).subscribe({
      next: (invitations) => this.invitations.set(invitations),
      error: (error) => this.inviteError.set(getErrorMessage(error)),
    });
  }

  protected isMe(userId: number): boolean {
    return userId === this.auth.currentUser()?.id;
  }

  protected initials(name: string, lastname: string): string {
    return (name.charAt(0) + lastname.charAt(0)).toUpperCase();
  }
}

function toBalanceView(balance: Balance): BalanceView {
  const value = Number(balance.balance);
  return {
    ...balance,
    amount: Math.abs(value),
    kind: value > 0 ? 'owed' : value < 0 ? 'owes' : 'settled',
  };
}
