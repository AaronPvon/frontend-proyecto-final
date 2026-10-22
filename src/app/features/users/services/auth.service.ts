import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, of, switchMap, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Token, User, UserCreate, UserLogin } from '../../../core/interfaces/user.interface';

const TOKEN_KEY = 'a_pachas_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  // El token se guarda en localStorage para que la sesión sobreviva a una recarga
  private readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.token() !== null);

  getToken(): string | null {
    return this.token();
  }

  // El login solo devuelve el token: después se piden los datos del usuario
  login(data: UserLogin): Observable<User> {
    return this.http.post<Token>(`${this.apiUrl}/auth/login`, data).pipe(
      tap((response) => this.saveToken(response.access_token)),
      switchMap(() => this.loadCurrentUser()),
    );
  }

  register(data: UserCreate): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, data);
  }

  loadCurrentUser(): Observable<User> {
    return this.http
      .get<User>(`${this.apiUrl}/users/me`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigateByUrl('/login');
  }

  // Se ejecuta al arrancar la app (app.config.ts). Si el token guardado ya no
  // es válido, la API responde 401 y el interceptor cierra la sesión.
  restoreSession(): Promise<unknown> {
    if (!this.token()) {
      return Promise.resolve();
    }
    return firstValueFrom(this.loadCurrentUser().pipe(catchError(() => of(null))));
  }

  private saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }
}
