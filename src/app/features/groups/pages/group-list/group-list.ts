import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { Group, GroupStatus } from '../../../../core/interfaces/group.interface';
import { getErrorMessage } from '../../../../core/utils/api-error';
import { AuthService } from '../../../users/services/auth.service';
import { GroupsService } from '../../services/groups.service';

@Component({
  selector: 'app-group-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './group-list.html',
  styleUrl: './group-list.css',
})
export class GroupList {
  private readonly groupsService = inject(GroupsService);
  protected readonly auth = inject(AuthService);

  // El filtro va en la URL (/groups?status=closed), así se mantiene al volver atrás.
  // Llega como input() gracias a withComponentInputBinding.
  readonly status = input<string>();
  protected readonly filter = computed<GroupStatus>(() =>
    this.status() === 'closed' ? 'closed' : 'active',
  );

  protected readonly groups = signal<Group[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  constructor() {
    // Cada vez que cambia el filtro se piden los grupos. switchMap cancela la
    // petición anterior si el usuario cambia de filtro antes de que termine.
    toObservable(this.filter)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap((status) =>
          this.groupsService.getGroups(status).pipe(
            map((groups) => ({ groups, error: null })),
            catchError((error) => of({ groups: [], error: getErrorMessage(error) })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ groups, error }) => {
        this.groups.set(groups);
        this.errorMessage.set(error);
        this.loading.set(false);
      });
  }

  protected isMine(group: Group): boolean {
    return group.creator.id === this.auth.currentUser()?.id;
  }
}
