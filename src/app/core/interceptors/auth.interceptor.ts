import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../features/users/services/auth.service';

// Añade el token a las peticiones a nuestra API (nunca a otros dominios)
// y cierra la sesión si la API responde 401.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  const request =
    token && isApiRequest ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // En el login, un 401 significa "Credenciales incorrectas": no se cierra
      // la sesión, el formulario muestra el error.
      const isLoginRequest = req.url === `${environment.apiUrl}/auth/login`;
      if (error.status === 401 && isApiRequest && !isLoginRequest) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
