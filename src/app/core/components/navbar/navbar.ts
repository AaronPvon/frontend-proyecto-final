import { Component, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../../features/users/services/auth.service';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Logo],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  // El menú móvil se cierra con Escape o al tocar fuera del navbar
  host: {
    '(document:keydown.escape)': 'closeMenu()',
    '(document:click)': 'closeIfOutside($event)',
  },
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  private readonly host = inject(ElementRef<HTMLElement>);

  // Menú de hamburguesa (solo en móvil, por debajo de sm = 640 px)
  protected readonly menuOpen = signal(false);

  constructor() {
    // Al navegar a otra página, el menú se cierra
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenu());
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  closeIfOutside(event: MouseEvent): void {
    if (this.menuOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout();
  }
}
