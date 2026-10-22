import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { GroupDetailPage } from './features/groups/pages/group-detail/group-detail';
import { GroupList } from './features/groups/pages/group-list/group-list';
import { GroupNew } from './features/groups/pages/group-new/group-new';
import { Invitations } from './features/groups/pages/invitations/invitations';
import { Home } from './features/home/pages/home/home';
import { Login } from './features/users/pages/login/login';
import { Register } from './features/users/pages/register/register';

export const routes: Routes = [
  { path: '', component: Home, title: 'A Pachas' },
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Iniciar sesión | A Pachas' },
  { path: 'register', component: Register, canActivate: [guestGuard], title: 'Crear cuenta | A Pachas' },
  { path: 'groups', component: GroupList, canActivate: [authGuard], title: 'Mis grupos | A Pachas' },
  // "new" va antes que ":id" para que no se tome como un id
  { path: 'groups/new', component: GroupNew, canActivate: [authGuard], title: 'Nuevo grupo | A Pachas' },
  { path: 'groups/:id', component: GroupDetailPage, canActivate: [authGuard], title: 'Grupo | A Pachas' },
  { path: 'invitations', component: Invitations, canActivate: [authGuard], title: 'Invitaciones | A Pachas' },
  { path: '**', redirectTo: '' },
];
