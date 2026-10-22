import { Component } from '@angular/core';

// Página provisional: las invitaciones se hacen en el bloque 3
@Component({
  selector: 'app-invitations',
  template: `
    <div class="panel p-6 sm:p-10">
      <h1 class="text-gradient font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Invitaciones</h1>
      <p class="mt-3 text-muted">Aquí aparecerán las invitaciones a grupos que tengas pendientes.</p>
    </div>
  `,
})
export class Invitations {}
