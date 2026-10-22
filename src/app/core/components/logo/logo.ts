import { Component, input } from '@angular/core';

// Contador para que cada logo de la página tenga ids únicos en sus degradados,
// porque el navbar y el inicio muestran el logo a la vez.
let nextId = 0;

// Logotipo de A Pachas: una moneda azul cortada en diagonal por una línea naranja,
// sobre un cuadrado de cristal azul oscuro. Es el mismo dibujo que public/logo.svg.
@Component({
  selector: 'app-logo',
  template: `
    <svg viewBox="0 0 200 200" [class]="sizeClass()" aria-hidden="true">
      <defs>
        <linearGradient [attr.id]="id + '-bg'" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1e293b" />
          <stop offset="1" stop-color="#0a1220" />
        </linearGradient>
        <linearGradient [attr.id]="id + '-shine'" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.12" />
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0" />
        </linearGradient>
        <linearGradient [attr.id]="id + '-coin'" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#19b0d4" />
          <stop offset="1" stop-color="#1d4ed8" />
        </linearGradient>
        <mask [attr.id]="id + '-cut'">
          <rect width="200" height="200" fill="#fff" />
          <line x1="35" y1="165" x2="165" y2="35" stroke="#000" stroke-width="24" />
        </mask>
        <filter [attr.id]="id + '-glow'" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <rect width="200" height="200" rx="45" [attr.fill]="url('bg')" />
      <circle cx="100" cy="100" r="65" fill="#19b0d4" opacity="0.45"
        [attr.filter]="url('glow')" [attr.mask]="url('cut')" />
      <circle cx="100" cy="100" r="65" [attr.fill]="url('coin')" [attr.mask]="url('cut')" />
      <line x1="30" y1="170" x2="170" y2="30" stroke="#f5684a" stroke-width="8" />
      <rect width="200" height="200" rx="45" [attr.fill]="url('shine')" />
      <rect x="1.5" y="1.5" width="197" height="197" rx="43.5" fill="none"
        stroke="#19b0d4" stroke-opacity="0.4" stroke-width="3" />
    </svg>
  `,
})
export class Logo {
  // Clases de Tailwind para el tamaño, por ejemplo "size-9" o "size-60"
  readonly sizeClass = input('size-9');

  protected readonly id = `logo-${nextId++}`;

  protected url(name: string): string {
    return `url(#${this.id}-${name})`;
  }
}
