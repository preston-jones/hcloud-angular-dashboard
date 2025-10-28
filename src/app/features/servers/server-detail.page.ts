import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type Status = 'running' | 'stopped' | 'migrating' | 'initializing' | 'error';

interface ServerDetail {
  id: string; 
  name: string; 
  type: string; 
  location: string; 
  status: Status;
  priceEur?: number; 
  vcpu?: number; 
  ramGB?: number; 
  diskGB?: number;
  ipv4?: string; 
  ipv6?: string; 
  image?: string; 
  datacenter?: string; 
  country?: string; 
  zone?: string;
}

@Component({
  selector: 'app-server-detail',
  standalone: true,
  imports: [NgClass, RouterLink],
  templateUrl: './server-detail.page.html',
  styleUrls: ['./server-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerDetailPage {
  private route = inject(ActivatedRoute);
  loading = signal(true);
  id = signal(this.route.snapshot.paramMap.get('id') ?? '');
  data = signal<ServerDetail | null>(null);

  constructor() {
    // Mock – später per Service ersetzen
    setTimeout(() => {
      const id = this.id();
      this.data.set({
        id,
        name: id === '1' ? 'web-01' : id === '2' ? 'api-server' : 'backup-db',
        type: id === '2' ? 'cx21' : 'cx11',
        location: id === '3' ? 'hel1' : 'fsn1',
        status: id === '3' ? 'stopped' : 'running',
        priceEur: id === '2' ? 8.3 : 4.15,
        vcpu: id === '2' ? 2 : 1,
        ramGB: id === '2' ? 4 : 2,
        diskGB: id === '2' ? 80 : 40,
        ipv4: '149.12.83.49',
        ipv6: '2a01:4f9:c011:6cb6::/64',
        image: 'Ubuntu 22.04',
        datacenter: 'fsn1-dc14',
        country: 'Germany',
        zone: 'eu-central',
      });
      this.loading.set(false);
    }, 600);
  }

  isRunning = computed(() => this.data()?.status === 'running');
}