import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UserInvitation } from '../../../../core/interfaces/invitation.interface';
import { getErrorMessage } from '../../../../core/utils/api-error';
import { InvitationsService } from '../../services/invitations.service';

@Component({
  selector: 'app-invitations',
  imports: [RouterLink, DatePipe],
  templateUrl: './invitations.html',
})
export class Invitations {
  private readonly invitationsService = inject(InvitationsService);

  protected readonly invitations = signal<UserInvitation[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  // Invitación con una acción en curso, para desactivar sus botones
  protected readonly busyId = signal<number | null>(null);
  // Invitación que está pidiendo confirmación para rechazarla
  protected readonly confirmingRejectId = signal<number | null>(null);

  // Mensajes tras aceptar o rechazar
  protected readonly accepted = signal<{ groupId: number; title: string } | null>(null);
  protected readonly rejectedTitle = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.invitationsService.getMyInvitations().subscribe({
      next: (invitations) => {
        this.invitations.set(invitations);
        this.errorMessage.set(null);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  accept(invitation: UserInvitation): void {
    this.startAction(invitation.group_id);
    this.invitationsService.accept(invitation.group_id).subscribe({
      // Se muestra un mensaje con enlace al grupo, para que el usuario elija si entra
      next: () => {
        this.removeFromList(invitation.group_id);
        this.accepted.set({ groupId: invitation.group_id, title: invitation.title });
      },
      error: (error) => this.actionFailed(error),
    });
  }

  // El primer clic pide confirmación; el segundo rechaza (la invitación se borra)
  reject(invitation: UserInvitation): void {
    if (this.confirmingRejectId() !== invitation.group_id) {
      this.confirmingRejectId.set(invitation.group_id);
      return;
    }
    this.startAction(invitation.group_id);
    this.invitationsService.reject(invitation.group_id).subscribe({
      next: () => {
        this.removeFromList(invitation.group_id);
        this.rejectedTitle.set(invitation.title);
      },
      error: (error) => this.actionFailed(error),
    });
  }

  cancelReject(): void {
    this.confirmingRejectId.set(null);
  }

  private startAction(groupId: number): void {
    this.busyId.set(groupId);
    this.accepted.set(null);
    this.rejectedTitle.set(null);
    this.actionError.set(null);
  }

  private removeFromList(groupId: number): void {
    this.invitations.update((list) => list.filter((item) => item.group_id !== groupId));
    this.busyId.set(null);
    this.confirmingRejectId.set(null);
  }

  // Si falla (por ejemplo, el creador anuló la invitación), se muestra el error
  // y se vuelve a pedir la lista para que refleje el estado real
  private actionFailed(error: unknown): void {
    this.actionError.set(getErrorMessage(error));
    this.busyId.set(null);
    this.confirmingRejectId.set(null);
    this.load();
  }
}
