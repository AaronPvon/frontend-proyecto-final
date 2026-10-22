import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Footer } from './core/components/footer/footer';
import { Navbar } from './core/components/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  template: `
    <div class="flex min-h-dvh flex-col">
      <app-navbar />
      <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-16">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
})
export class App {}
