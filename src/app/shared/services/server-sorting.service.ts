import { Injectable, signal } from '@angular/core';
import { Server, SortDirection } from '../../core/models';

@Injectable({
  providedIn: 'root'
})
export class ServerSortingService {
  // Sorting state
  readonly sortColumn = signal<string | null>('created');
  readonly sortDirection = signal<SortDirection>('desc');

  // Main sorting handler
  onSort(column: string): void {
    const currentColumn = this.sortColumn();

    if (currentColumn === column) {
      this.cycleSortDirection();
    } else {
      this.setSortColumn(column, 'asc');
    }
  }

  // Cycle through sort directions
  private cycleSortDirection(): void {
    const current = this.sortDirection();
    switch (current) {
      case 'none':
        this.sortDirection.set('asc');
        break;
      case 'asc':
        this.sortDirection.set('desc');
        break;
      case 'desc':
        this.resetSort();
        break;
    }
  }

  // Set sort column and direction
  private setSortColumn(column: string, direction: 'asc' | 'desc'): void {
    this.sortColumn.set(column);
    this.sortDirection.set(direction);
  }

  // Reset sorting
  private resetSort(): void {
    this.sortColumn.set(null);
    this.sortDirection.set('none');
  }

  // Get sort value for a server based on column
  private getSortValue(server: Server, column: string): any {
    switch (column) {
      case 'created':
        return server.created ? new Date(server.created).getTime() : 0;
      case 'name':
        return server.name?.toLowerCase() || '';
      case 'status':
        return server.status || '';
      case 'location':
        return server.datacenter?.location?.city?.toLowerCase() || '';
      default:
        return '';
    }
  }

  // Sort servers array based on current sort settings
  sortServers(servers: Server[]): Server[] {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column || direction === 'none') {
      return servers;
    }

    return [...servers].sort((a, b) => {
      const comparison = this.compareValues(a, b, column);
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  // Compare two servers by the specified column
  private compareValues(a: Server, b: Server, column: string): number {
    const aValue = this.getSortValue(a, column);
    const bValue = this.getSortValue(b, column);
    
    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  }

  // Check if up arrow should be visible for a column
  showUpArrow(column: string): boolean {
    return this.sortColumn() !== column || this.sortDirection() !== 'desc';
  }

  // Check if down arrow should be visible for a column
  showDownArrow(column: string): boolean {
    return this.sortColumn() !== column || this.sortDirection() !== 'asc';
  }

  // Check if column is currently being sorted
  isColumnSorted(column: string): boolean {
    return this.sortColumn() === column && this.sortDirection() !== 'none';
  }
}