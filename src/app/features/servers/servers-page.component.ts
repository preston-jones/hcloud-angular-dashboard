import { Component } from '@angular/core';

@Component({
  selector: 'app-servers-page',
  standalone: true,
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">Servers Dashboard</h1>
      <p class="text-gray-600 dark:text-gray-400">Welcome to your Hetzner Cloud dashboard!</p>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 class="text-lg font-medium mb-4">Server Overview</h2>
        <p>This is where your server management interface will be implemented.</p>
      </div>
    </div>
  `,
})
export class ServersPageComponent {}