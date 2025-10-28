import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HetznerApiService } from '../../core/hetzner-api.service';

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
  imports: [NgClass],
  templateUrl: './server-detail.page.html',
  styleUrls: ['./server-detail.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(HetznerApiService);
  
  loading = signal(true);
  id = signal(this.route.snapshot.paramMap.get('id') ?? '');
  data = signal<ServerDetail | null>(null);

  constructor() {
    // Initialize user servers first, then load server data
    this.api.initializeUserServers();
    this.loadServerData();
  }

  private loadServerData(): void {
    // Add a slight delay to ensure the API service is ready
    setTimeout(() => {
      const serverId = this.id();
      const servers = this.api.myServers();
      const server = servers.find(s => s.id === serverId);
      
      if (server) {
        // Convert Server to ServerDetail
        this.data.set({
          id: server.id,
          name: server.name,
          type: server.type,
          location: server.location,
          status: server.status as Status,
          priceEur: server.priceEur,
          vcpu: server.vcpus,
          ramGB: server.ram,
          diskGB: server.ssd,
          ipv4: '149.12.83.49', // Mock IP for now
          ipv6: '2a01:4f9:c011:6cb6::/64', // Mock IP for now
          image: 'Ubuntu 22.04', // Mock image for now
          datacenter: server.datacenter?.location?.name || server.location,
          country: server.country || 'Unknown',
          zone: 'eu-central', // Mock zone for now
        });
      } else {
        // Server not found, set error state or redirect
        console.error('Server not found:', serverId);
      }
      this.loading.set(false);
    }, 100);
  }

  isRunning = computed(() => this.data()?.status === 'running');

  toggleServerStatus(): void {
    const currentData = this.data();
    if (!currentData) return;

    const newStatus: Status = currentData.status === 'running' ? 'stopped' : 'running';
    
    // Update local data
    this.data.set({
      ...currentData,
      status: newStatus
    });

    // Update in API service
    this.api.updateServerStatus(currentData.id, newStatus);
  }

  deleteServer(): void {
    const currentData = this.data();
    console.log('Delete server clicked:', currentData?.id);
    
    if (currentData) {
      // Check if we're in mock mode first
      const mode = sessionStorage.getItem('hz.mode') ?? 'mock';
      
      this.api.deleteServer(currentData.id);
      
      // Only navigate back if we're in mock mode (actual deletion happened)
      if (mode === 'mock') {
        this.goBackToMyServers();
      }
      // In API mode, the demo dialog will show and user stays on the page
    }
  }

  rebootServer(): void {
    const currentData = this.data();
    console.log('Reboot server clicked:', currentData?.id);
    
    if (currentData) {
      this.api.rebootServer(currentData.id);
    }
  }

  openConsole(): void {
    const currentData = this.data();
    console.log('Console clicked:', currentData?.id);
    
    if (currentData) {
      // Console functionality - could show demo restriction dialog
      this.api.rebootServer(currentData.id); // Using reboot method as placeholder
    }
  }

  goBackToMyServers(): void {
    this.router.navigate(['/my-servers']);
  }
}