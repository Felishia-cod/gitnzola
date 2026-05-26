import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { RecuperarSenhaComponent } from './pages/recuperar-senha/recuperar-senha';
import { FeedComponent } from './pages/feed/feed';
import { HomeComponent } from './pages/feed-home/feed-home';
import { AmigosComponent } from './pages/amigos/amigos';
import { ProfileComponent } from './pages/profile/profile';
import { ExplorarComponent } from './pages/explorar/explorar';
import { NotificationsComponent } from './pages/notifications/notifications';
import { GuardadosComponent } from './pages/guardados/guardados';
import { SettingsComponent } from './pages/settings/settings';
import { ConfirmarRegistoComponent } from './pages/confirmar-registo/confirmar-registo';
import { AdminComponent } from './pages/admin/admin';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'recuperar-senha', component: RecuperarSenhaComponent },
  { path: 'recuperar-senha/:token', component: RecuperarSenhaComponent }, // ← ADICIONE ESTA LINHA
  { 
    path: 'feed', 
    component: FeedComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'amigos', component: AmigosComponent },
      { path: 'notificacoes', component: NotificationsComponent },
      { path: 'perfil', component: ProfileComponent },
      { path: 'guardados', component: GuardadosComponent },
      { path: 'definicoes', component: SettingsComponent },
      { path: 'explorar', component: ExplorarComponent },
    ]
  },
  // ADMIN - ROTA SEPARADA (FORA DO FEED)
  { path: 'admin', component: AdminComponent },
  { path: 'confirmar-registo', component: ConfirmarRegistoComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];