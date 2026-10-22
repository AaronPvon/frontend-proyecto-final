import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Balance,
  Group,
  GroupCreate,
  GroupDetail,
  GroupStatus,
} from '../../../core/interfaces/group.interface';

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/groups`;

  // Grupos en los que el usuario es miembro, activos o cerrados
  getGroups(status: GroupStatus): Observable<Group[]> {
    return this.http.get<Group[]>(this.apiUrl, { params: { status } });
  }

  getGroup(id: string): Observable<GroupDetail> {
    return this.http.get<GroupDetail>(`${this.apiUrl}/${id}`);
  }

  getBalances(id: string): Observable<Balance[]> {
    return this.http.get<Balance[]>(`${this.apiUrl}/${id}/balances`);
  }

  createGroup(data: GroupCreate): Observable<Group> {
    return this.http.post<Group>(this.apiUrl, data);
  }
}
