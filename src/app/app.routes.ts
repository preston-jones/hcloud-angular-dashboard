import { Routes } from '@angular/router';
import { ShellComponent } from './shared/ui/layout/shell/shell';

// app.routes.ts - Shell as layout route
export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,  // or loadComponent for lazy loading
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'my-servers', loadComponent: () => import('./features/servers/my-servers-page/my-servers-page').then(m => m.MyServersPage) },
      { path: 'my-servers/:id', loadComponent: () => import('./features/servers/server-detail-page/server-detail-page').then(m => m.ServerDetailPage) },
      { path: 'servers', loadChildren: () => import('./features/servers/servers.routes').then(m => m.SERVERS_ROUTES) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' }
    ]
  }
];