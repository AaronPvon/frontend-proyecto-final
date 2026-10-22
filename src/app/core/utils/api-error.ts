import { HttpErrorResponse } from '@angular/common/http';

// Convierte un error de la API en un mensaje para el usuario.
// FastAPI envía los errores como {"detail": "..."}; los 422 de Pydantic
// traen en "detail" una lista en inglés, que no se muestra tal cual.
export function getErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se puede conectar con el servidor. Comprueba que la API está arrancada.';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (error.status === 422) {
      return 'Hay datos no válidos en el formulario. Revísalos e inténtalo de nuevo.';
    }
  }
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}
