import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Expense, ExpenseCreate } from '../../../core/interfaces/expense.interface';

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/groups`;

  // Gastos del grupo con su pagador y sus repartos, los más recientes primero
  getExpenses(groupId: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/${groupId}/expenses`);
  }

  // 201 con el gasto creado y la parte de cada participante
  createExpense(groupId: string, data: ExpenseCreate): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/${groupId}/expenses`, data);
  }
}
