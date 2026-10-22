import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { Balance, GroupDetail } from '../../../../core/interfaces/group.interface';
import { getErrorMessage } from '../../../../core/utils/api-error';
import { AuthService } from '../../../users/services/auth.service';
import { GroupsService } from '../../services/groups.service';

// Saldo preparado para mostrarlo: la cantidad sin signo y si le deben, debe o está al día
interface BalanceView extends Balance {
  amount: number;
  kind: 'owed' | 'owes' | 'settled';
}

// Se llama GroupDetailPage para no confundirse con la interfaz GroupDetail
@Component({
  selector: 'app-group-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './group-detail.html',
  styleUrl: './group-detail.css',
})
export class GroupDetailPage {
  private readonly groupsService = inject(GroupsService);
  private readonly title = inject(Title);
  protected readonly auth = inject(AuthService);

  // El :id de la ruta llega como input() gracias a withComponentInputBinding
  readonly id = input.required<string>();

  protected readonly group = signal<GroupDetail | null>(null);
  protected readonly balances = signal<BalanceView[]>([]);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly isCreator = computed(
    () => this.group()?.creator.id === this.auth.currentUser()?.id,
  );

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
