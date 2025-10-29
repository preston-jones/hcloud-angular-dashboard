import { Routes } from '@angular/router';

export const SERVERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./servers-page/servers-page').then(m => m.ServersPage),
  },
  // No detail route - available servers don't need detail pages
];
