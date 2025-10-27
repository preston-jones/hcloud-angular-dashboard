import { Routes } from '@angular/router';

export const SERVERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./servers-page/servers-page').then(m => m.ServersPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./server-detail-page/server-detail-page').then(m => m.ServerDetailPage),
  },
];
