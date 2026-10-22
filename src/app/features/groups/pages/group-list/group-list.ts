import { Component } from '@angular/core';

// Página provisional: el listado de grupos se hace en el bloque 2
@Component({
  selector: 'app-group-list',
  template: `
    <div class="panel p-6 sm:p-10">
      <h1 class="text-gradient font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Mis grupos</h1>
      <p class="mt-3 text-muted">Aquí aparecerán los grupos de los que eres miembro.</p>
    </div>
  `,
})
export class GroupList {}
