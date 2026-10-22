import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  GroupInvitation,
  InvitationCreate,
  UserInvitation,
} from '../../../core/interfaces/invitation.interface';

@Injectable({ providedIn: 'root' })
export class InvitationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ---- Desde el invitado (/invitations) ----

  getMyInvitations(): Observable<UserInvitation[]> {
    return this.http.get<UserInvitation[]>(`${this.apiUrl}/invitations`);
  }

  // 204: no devuelve contenido
  accept(groupId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/invitations/${groupId}/accept`, null);
  }

  reject(groupId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/invitations/${groupId}`);
  }

  // ---- Desde el grupo (detalle del grupo) ----

  getGroupInvitations(groupId: string): Observable<GroupInvitation[]> {
    return this.http.get<GroupInvitation[]>(`${this.apiUrl}/groups/${groupId}/invitations`);
  }

  // 201 con la invitación creada
  invite(groupId: string, data: InvitationCreate): Observable<GroupInvitation> {
    return this.http.post<GroupInvitation>(`${this.apiUrl}/groups/${groupId}/invitations`, data);
  }

  cancel(groupId: string, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/groups/${groupId}/invitations/${userId}`);
  }
}
