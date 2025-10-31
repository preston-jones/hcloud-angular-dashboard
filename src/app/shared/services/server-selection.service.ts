import { Injectable, signal, computed } from '@angular/core';
import { Server } from '../../core/models';

@Injectable({
  providedIn: 'root'
})
export class ServerSelectionService {
  // Selection state
  private selectedServerIds = signal<Set<string>>(new Set());
  
  // Computed for selection count
  readonly selectedCount = computed(() => this.selectedServerIds().size);

  // Check if a server is selected
  isServerSelected(serverId: string): boolean {
    return this.selectedServerIds().has(serverId);
  }

  // Toggle selection for a specific server
  toggleServerSelection(serverId: string): void {
    const selected = new Set(this.selectedServerIds());
    if (selected.has(serverId)) {
      selected.delete(serverId);
    } else {
      selected.add(serverId);
    }
    this.selectedServerIds.set(selected);
  }

  // Check if all servers in the provided list are selected
  isAllSelected(servers: Server[]): boolean {
    const serverIds = servers.map(s => s.id.toString());
    return serverIds.length > 0 && serverIds.every(id => this.selectedServerIds().has(id));
  }

  // Toggle selection for all servers in the provided list
  toggleSelectAll(servers: Server[]): void {
    const serverIds = servers.map(s => s.id.toString());
    if (this.isAllSelected(servers)) {
      this.selectedServerIds.set(new Set());
    } else {
      this.selectedServerIds.set(new Set(serverIds));
    }
  }

  // Clear all selections
  clearSelection(): void {
    this.selectedServerIds.set(new Set());
  }

  // Get selected servers from a list of servers
  getSelectedServers(servers: Server[]): Server[] {
    return servers.filter(server => this.selectedServerIds().has(server.id.toString()));
  }

  // Helper methods for checking server states in selection
  hasSelectedRunningServers(servers: Server[]): boolean {
    return this.getSelectedServers(servers).some(server => server.status === 'running');
  }

  hasSelectedStoppedServers(servers: Server[]): boolean {
    return this.getSelectedServers(servers).some(server => server.status === 'stopped');
  }

  // Remove specific servers from selection (used when servers are deleted)
  removeServersFromSelection(serverIds: string[]): void {
    const currentSelection = new Set(this.selectedServerIds());
    serverIds.forEach(id => currentSelection.delete(id));
    this.selectedServerIds.set(currentSelection);
  }
}