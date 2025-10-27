import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface Server {
  id: string;
  name: string;
  type: string;
  location: string;
  status: 'running' | 'stopped' | 'error';
  priceEur: number;
}

@Component({
  selector: 'app-servers-page',
  standalone: true,
  imports: [NgClass],
  templateUrl: './servers-page.html',
  styleUrls: ['./servers-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServersPage {
  // UI state
  q = signal('');
  status = signal<'all' | 'running' | 'stopped'>('all');
  loading = signal(true); // Show skeleton loader initially

  // Mock data (loaded from JSON and transformed)
  servers = signal<Server[]>([
    {
      id: '101',
      name: 'web-node-01',
      type: 'cx22',
      location: 'nbg1',
      status: 'running',
      priceEur: 8.50
    },
    {
      id: '102',
      name: 'api-stage-01',
      type: 'cx32',
      location: 'fsn1',
      status: 'stopped',
      priceEur: 15.20
    }
  ]);

  // Simulierter Load (Skeleton sichtbar)
  constructor() {
    setTimeout(() => this.loading.set(false), 600);
  }

  // Gefilterter View
  view = computed(() => {
    const term = this.q().toLowerCase();
    const st = this.status();
    return this.servers().filter(s => {
      const matchesQuery =
        s.name.toLowerCase().includes(term) ||
        s.type.toLowerCase().includes(term) ||
        s.location.toLowerCase().includes(term);
      const matchesStatus = st === 'all' || s.status === st;
      return matchesQuery && matchesStatus;
    });
  });

  // Handlers
  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.q.set(input.value);
  }
  onStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.status.set(select.value as 'all' | 'running' | 'stopped');
  }

  // TrackBy
  trackRow = (_: number, s: Server) => s.id;

  // Für Skeleton-Schleifen
  skeletonRows = Array.from({ length: 6 });
}
