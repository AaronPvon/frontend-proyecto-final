import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Logo } from '../../../../core/components/logo/logo';
import { AuthService } from '../../../users/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Logo],
  templateUrl: './home.html',
})
export class Home {
  protected readonly auth = inject(AuthService);

  protected readonly steps = [
    { title: 'Crea un grupo', text: 'Para un viaje, una cena o los gastos del piso, e invita a tus amigos.' },
    { title: 'Apunta los gastos', text: 'Indica quién pagó y cómo se reparte: a partes iguales o con importes a medida.' },
    { title: 'Mira quién debe a quién', text: 'Los saldos se calculan solos. Los pagos se hacen fuera de la app, por Bizum o transferencia.' },
  ];
}
