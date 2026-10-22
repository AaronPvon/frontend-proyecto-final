import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { GroupList } from './features/groups/pages/group-list/group-list';
import { Invitations } from './features/groups/pages/invitations/invitations';
import { Home } from './features/home/pages/home/home';
import { Login } from './features/users/pages/login/login';
import { Register } from './features/users/pages/register/register';

export const routes: Routes = [
  { path: '', component: Home, title: 'A Pachas' },
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Iniciar sesión | A Pachas' },
  { path: 'register', component: Register, canActivate: [guestGuard], title: 'Crear cuenta | A Pachas' },
  { path: 'groups', component: GroupList, canActivate: [authGuard], title: 'Mis grupos | A Pachas' },
  { path: 'invitations', component: Invitations, canActivate: [authGuard], title: 'Invitaciones | A Pachas' },
  { path: '**', redirectTo: '' },
];
