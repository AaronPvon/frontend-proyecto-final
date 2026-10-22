import { HttpErrorResponse } from '@angular/common/http';
import { isDevMode } from '@angular/core';

// Convierte un error de la API en un mensaje para el usuario.
// FastAPI envía los errores de dos formas:
// - {"detail": "texto"}: errores lanzados por los controladores (en español).
// - {"detail": [{type, msg, ...}]}: errores de validación de Pydantic (422).
//   Los de nuestras reglas (type "value_error") llevan el mensaje en español
//   precedido de "Value error, "; el resto vienen en inglés y no se muestran tal cual.
export function getErrorMessage(error: unknown): string {
  // En desarrollo (npm start), el error completo sale en la consola del navegador:
  // así se ve qué campo rechazó la API aunque en pantalla salga el mensaje genérico
  if (isDevMode()) {
    console.error('Error de la API:', error instanceof HttpErrorResponse ? error.error : error);
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se puede conectar con el servidor. Comprueba que la API está arrancada.';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      const ownRule = detail.find((item) => item?.type === 'value_error' && typeof item.msg === 'string');
      if (ownRule) {
        return ownRule.msg.replace(/^Value error, /, '');
      }
    }
    if (error.status === 422) {
      return 'Hay datos no válidos en el formulario. Revísalos e inténtalo de nuevo.';
    }
  }
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}
