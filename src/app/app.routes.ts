import { Routes } from '@angular/router';
import { ShellComponent } from './shared/ui/layout/shell/shell';

// app.routes.ts - Shell as layout route
export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,  // or loadComponent for lazy loading
    children: [
      { path: 'servers', loadChildren: () => import('./features/servers/servers.routes').then(m => m.SERVERS_ROUTES) },
      { path: '', redirectTo: 'servers', pathMatch: 'full' },
      { path: '**', redirectTo: 'servers' }
    ]
  }
];