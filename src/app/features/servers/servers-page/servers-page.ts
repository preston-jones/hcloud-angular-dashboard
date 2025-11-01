import { ChangeDetectionStrategy, Component, computed, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HetznerApiService } from '../../../core/hetzner-api.service';
import { PageHeaderService } from '../../../core/page-header.service';
import { Server } from '../../../core/models';
import { ServerNameDialogComponent } from '../../../shared/ui/server-name-dialog/server-name-dialog';

@Component({
  selector: 'app-servers-page',
  standalone: true,
  imports: [ServerNameDialogComponent],
  templateUrl: './servers-page.html',
  styleUrls: ['./servers-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServersPage implements OnInit, OnDestroy {
  private api = inject(HetznerApiService);
  private router = inject(Router);
  private pageHeaderService = inject(PageHeaderService);

  // UI state
  status = signal<'all' | 'running' | 'stopped'>('all');
  
  // Selection state for server creation
  selectedServerId = signal<number | null>(null);
  
  // Dialog state
  showNameDialog = signal(false);
  
  // Sorting state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | 'none'>('none');

  // Wizard state
  currentStep = signal<'list' | 'architecture' | 'location' | 'image' | 'type' | 'summary'>('architecture');
  
  // Selection state for wizard
  selectedArchitecture = signal<string | null>(null);
  selectedCpuArchitecture = signal<'x86' | 'arm64'>('x86');
  selectedLocation = signal<string | null>(null);
  selectedImage = signal<string | null>(null);
  selectedImageVersion = signal<string | null>(null);
  selectedServerType = signal<string | null>(null);
  activeImageTab = signal<'os' | 'apps'>('os');

  // Additional configuration options
  enableBackups = signal(false);
  enableMonitoring = signal(true);

      // Get data from service
  servers = this.api.availableServerTypes;  // Use server types for creation page
  locations = this.api.locations;
  loading = this.api.loading;
  error = this.api.error;
  searchQuery = this.api.searchQuery;
  get isUsingMockData() { return this.api.isUsingMockData(); }

  ngOnInit() {
    // Set up page header
    this.pageHeaderService.setHeader({
      title: 'Create Server',
      subtitle: 'Configure your new cloud server'
    });
    
    // Load server types (available configurations) for this page
    this.api.loadServerTypes();
  }

  ngOnDestroy() {
    this.pageHeaderService.clearHeader();
  }

  retry(): void {
    this.api.loadServerTypes();
  }

  // Only show available server types (not actual servers)
  availableServers = computed(() => {
    const serverTypes = this.servers() || [];  // Now reading from serverTypes signal
    return serverTypes.filter(s => s.status === 'available');
  });

  // Filtered servers based on selected architecture
  filteredServers = computed(() => {
    const available = this.availableServers();
    if (!this.selectedArchitecture()) return available;
    
    // Filter by architecture type and CPU architecture
    const arch = this.selectedArchitecture();
    const cpuArch = this.selectedCpuArchitecture();
    
    return available.filter(server => {
      const serverType = server.server_type?.name?.toLowerCase() || '';
      
      // First filter by server architecture
      let matchesArchitecture = false;
      if (arch === 'cost-optimized') {
        matchesArchitecture = serverType.includes('cx') || serverType.includes('cpx');
      } else if (arch === 'regular-performance') {
        matchesArchitecture = serverType.includes('cx') && !serverType.includes('cpx');
      } else if (arch === 'general-purpose') {
        matchesArchitecture = serverType.includes('ccx');
      }
      
      // Then filter by CPU architecture (simplified for demo)
      // In a real app, this would check actual server specifications
      if (matchesArchitecture && cpuArch === 'arm64') {
        // Only cost-optimized supports Arm64 in this demo
        return arch === 'cost-optimized' && serverType.includes('cax');
      }
      
      return matchesArchitecture;
    });
  });

  // Gefilterter View for available servers
  view = computed(() => {
    const serverList = this.availableServers();
    if (!serverList) return [];
    
    const term = this.searchQuery().toLowerCase();
    
    // Filter first - remove status filter since all are 'available'
    const filtered = serverList.filter(s => {
      const matchesQuery =
        s.name.toLowerCase().includes(term) ||
        (s.server_type?.name || '').toLowerCase().includes(term) ||
        (s.datacenter?.location?.name || '').toLowerCase().includes(term);
      return matchesQuery;
    });

    // Then apply sorting
    return this.sortServers(filtered);
  });

  // Handlers
  onStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.status.set(select.value as 'all' | 'running' | 'stopped');
  }

  // Sorting handler
  onSort(column: string) {
    const currentColumn = this.sortColumn();
    const currentDirection = this.sortDirection();

    if (currentColumn === column) {
      // Cycle through: none -> asc -> desc -> none
      switch (currentDirection) {
        case 'none':
          this.sortDirection.set('asc');
          break;
        case 'asc':
          this.sortDirection.set('desc');
          break;
        case 'desc':
          this.sortColumn.set(null);
          this.sortDirection.set('none');
          break;
      }
    } else {
      // New column, start with ascending
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  // Get sort value for a server based on column
  private getSortValue(server: Server, column: string): any {
    switch (column) {
      case 'name':
        return server.name.toLowerCase();
      case 'type':
        return (server.server_type?.name || '').toLowerCase();
      case 'vcpus':
        return server.server_type?.cores || 0;
      case 'ram':
        return server.server_type?.memory || 0;
      case 'ssd':
        return server.server_type?.disk || 0;
      case 'location':
        return this.getCleanCityName(server).toLowerCase();
      case 'status':
        return server.status;
      case 'price':
        return server.priceEur;
      default:
        return '';
    }
  }

  // Sort servers array
  private sortServers(servers: Server[]): Server[] {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (!column || direction === 'none') {
      return servers;
    }

    return [...servers].sort((a, b) => {
      const aValue = this.getSortValue(a, column);
      const bValue = this.getSortValue(b, column);

      let comparison = 0;
      
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  // Selection methods
  selectServer(server: Server): void {
    // Prevent selection of sold out servers
    if (!this.isServerAvailable(server)) {
      return;
    }
    
    if (this.selectedServerId() === server.id) {
      this.selectedServerId.set(null);
    } else {
      this.selectedServerId.set(server.id);
    }
  }

  isSelected(server: Server): boolean {
    return this.selectedServerId() === server.id;
  }

  hasSelection(): boolean {
    return this.selectedServerId() !== null;
  }

  getSelectedServer(): Server | null {
    const selectedId = this.selectedServerId();
    if (!selectedId) return null;
    
    const servers = this.availableServers();
    return servers.find(s => s.id === selectedId) || null;
  }

  createSelectedServer(): void {
    const selected = this.getSelectedServer();
    if (selected) {
      // Show the name dialog instead of creating immediately
      this.showNameDialog.set(true);
    }
  }

  // Handle server creation with custom name
  onServerNameConfirmed(serverName: string): void {
    const selected = this.getSelectedServer();
    if (selected) {
      this.api.createServerFromType(selected, serverName);
      this.showNameDialog.set(false);
      
      // Only navigate back if we're in mock mode (actual creation happened)
      if (this.api.getCurrentMode() === 'mock') {
        // Navigate back to my servers
        this.router.navigate(['/my-servers']);
      }
      // In API mode, the demo dialog will show and user stays on the current page
    }
  }

  // Handle dialog cancellation
  onServerNameCancelled(): void {
    this.showNameDialog.set(false);
  }

  // TrackBy
  trackRow = (_: number, s: Server) => s.id;

  // Country helpers
  getCountryFlag(server: Server): string {
    return this.api.getCountryFlag(server.datacenter?.location?.country || '');
  }

  hasCountryData(server: Server): boolean {
    return !!server.datacenter?.location?.country && server.datacenter.location.country !== 'Unknown';
  }

  getLocationWithFlag(server: Server): string {
    const city = server.datacenter?.location?.city || server.datacenter?.location?.name || 'Unknown';
    if (this.hasCountryData(server)) {
      return `${this.getCountryFlag(server)} ${city}`;
    }
    return city;
  }

  // Helper to get clean city name (removes state abbreviations)
  getCleanCityName(server: Server): string {
    // For server types (available servers), show "All Locations" since they can be deployed anywhere
    if (!server.datacenter) {
      return 'All Locations';
    }
    
    // For actual server instances, show the city
    const fullCity = server.datacenter?.location?.city || server.datacenter?.location?.name || 'Unknown';
    // Remove state abbreviations like ", VA", ", OR", etc.
    return fullCity.replace(/,\s*[A-Z]{2}$/, '');
  }

  // Availability helpers
  isServerAvailable(server: Server): boolean {
    return this.api.isServerTypeAvailable(server);
  }

  getAvailabilityStatus(server: Server): string {
    if (!this.isServerAvailable(server)) {
      return 'sold-out';
    }
    
    const soldOutLocations = this.api.getSoldOutLocations(server);
    if (soldOutLocations.length > 0) {
      return 'limited';
    }
    
    return 'available';
  }

  getAvailabilityText(server: Server): string {
    const soldOutLocations = this.api.getSoldOutLocations(server);
    const availableLocations = this.api.getAvailableLocations(server);
    
    if (availableLocations.length === 0) {
      return 'Sold out';
    }
    
    if (soldOutLocations.length > 0) {
      return `Limited (${soldOutLocations.length} locations sold out)`;
    }
    
    return 'Available';
  }

  getSoldOutTooltip(server: Server): string {
    const soldOutLocations = this.api.getSoldOutLocations(server);
    if (soldOutLocations.length === 0) return '';
    
    return `Sold out in: ${soldOutLocations.join(', ').toUpperCase()}`;
  }

  // Hardware specs helpers - using structured data only
  getCpuCount(server: Server): string {
    return server.server_type?.cores ? `${server.server_type.cores}` : '0';
  }

  getRamSize(server: Server): string {
    return server.server_type?.memory ? `${server.server_type.memory} GB` : '0 GB';
  }

  getDiskSize(server: Server): string {
    return server.server_type?.disk ? `${server.server_type.disk} GB` : '0 GB';
  }

  getHardwareSpecs(server: Server): string {
    return `${this.getCpuCount(server)} vCPU • ${this.getRamSize(server)} • ${this.getDiskSize(server)} SSD`;
  }

  // Für Skeleton-Schleifen
  skeletonRows = Array.from({ length: 6 });

  // Get sort indicator for column header
  getSortIndicator(column: string): string {
    if (this.sortColumn() !== column) {
      return '▲▼'; // Default: both arrows when not sorted
    }
    
    switch (this.sortDirection()) {
      case 'asc':
        return '▲'; // Ascending arrow only
      case 'desc':
        return '▼'; // Descending arrow only
      default:
        return '▲▼'; // Default: both arrows
    }
  }

  // Check if up arrow should be visible
  showUpArrow(column: string): boolean {
    if (this.sortColumn() !== column) {
      return true; // Show both arrows when not sorted
    }
    return this.sortDirection() === 'asc' || this.sortDirection() === 'none';
  }

  // Check if down arrow should be visible
  showDownArrow(column: string): boolean {
    if (this.sortColumn() !== column) {
      return true; // Show both arrows when not sorted
    }
    return this.sortDirection() === 'desc' || this.sortDirection() === 'none';
  }

  // Check if column is currently being sorted
  isColumnSorted(column: string): boolean {
    return this.sortColumn() === column && this.sortDirection() !== 'none';
  }

  // ============================================================================
  // WIZARD LOGIC
  // ============================================================================

  // Step completion check
  isStepCompleted(step: string): boolean {
    switch (step) {
      case 'architecture': return !!this.selectedArchitecture();
      case 'location': return !!this.selectedLocation();
      case 'image': return !!this.selectedImage();
      case 'type': return !!this.selectedServerType();
      case 'summary': return false; // Never completed until server is created
      default: return false;
    }
  }

  // Architecture selection
  selectArchitecture(architecture: string): void {
    this.selectedArchitecture.set(architecture);
  }

  // CPU Architecture selection
  selectCpuArchitecture(cpuArch: 'x86' | 'arm64'): void {
    this.selectedCpuArchitecture.set(cpuArch);
  }

  // Location selection
  selectLocation(location: string): void {
    this.selectedLocation.set(location);
  }

  // Image selection
  selectImage(image: string): void {
    this.selectedImage.set(image);
    // Set default version based on image
    switch (image) {
      case 'ubuntu':
        this.selectedImageVersion.set('24.04');
        break;
      case 'fedora':
        this.selectedImageVersion.set('42');
        break;
      case 'debian':
        this.selectedImageVersion.set('13');
        break;
      case 'centos':
        this.selectedImageVersion.set('Stream 10');
        break;
      case 'rocky':
      case 'almalinux':
        this.selectedImageVersion.set('10');
        break;
      case 'opensuse':
        this.selectedImageVersion.set('15');
        break;
      default:
        this.selectedImageVersion.set(null);
    }
  }

  setImageTab(tab: 'os' | 'apps'): void {
    this.activeImageTab.set(tab);
  }

  // Server type selection
  selectServerType(serverType: string): void {
    this.selectedServerType.set(serverType);
  }

  isServerTypeUnavailable(serverType: string): boolean {
    // Check if server type is sold out in selected location
    const servers = this.availableServers();
    const server = servers.find(s => s.name?.toLowerCase().includes(serverType.toLowerCase()));
    if (!server || !this.selectedLocation()) return false;
    
    return !this.api.isServerTypeAvailable(server);
  }

  // Navigation
  nextStep(): void {
    const current = this.currentStep();
    switch (current) {
      case 'architecture':
        if (this.selectedArchitecture()) this.currentStep.set('location');
        break;
      case 'location':
        if (this.selectedLocation()) this.currentStep.set('image');
        break;
      case 'image':
        if (this.selectedImage()) this.currentStep.set('type');
        break;
      case 'type':
        if (this.selectedServerType()) this.currentStep.set('summary');
        break;
    }
  }

  previousStep(): void {
    const current = this.currentStep();
    switch (current) {
      case 'location':
        this.currentStep.set('architecture');
        break;
      case 'image':
        this.currentStep.set('location');
        break;
      case 'type':
        this.currentStep.set('image');
        break;
      case 'summary':
        this.currentStep.set('type');
        break;
    }
  }

  // Server creation from wizard
  createServer(): void {
    const architecture = this.selectedArchitecture();
    const location = this.selectedLocation();
    const image = this.selectedImage();
    const imageVersion = this.selectedImageVersion();
    const serverType = this.selectedServerType();

    if (!architecture || !location || !image || !serverType) {
      console.error('Missing required selections for server creation');
      return;
    }

    // Find the selected server type from available servers
    const servers = this.availableServers();
    const selectedServer = servers.find(s => 
      s.name?.toLowerCase().includes(serverType.toLowerCase())
    );

    if (!selectedServer) {
      console.error('Selected server type not found');
      return;
    }

    // Show name dialog for server creation
    this.selectedServerId.set(selectedServer.id);
    this.showNameDialog.set(true);
  }

  startWizard(): void {
    this.currentStep.set('architecture');
  }

  resetWizard(): void {
    this.currentStep.set('list');
    this.selectedArchitecture.set(null);
    this.selectedCpuArchitecture.set('x86');
    this.selectedLocation.set(null);
    this.selectedImage.set(null);
    this.selectedImageVersion.set(null);
    this.selectedServerType.set(null);
    this.selectedServerId.set(null);
    this.activeImageTab.set('os');
  }

  // Override existing dialog handler to reset wizard after creation
  onServerNameConfirmedWizard(serverName: string): void {
    const selected = this.getSelectedServer();
    if (selected && serverName.trim()) {
      // Create server using the API service
      this.api.createServerFromType(selected, serverName);
      this.showNameDialog.set(false);
      
      // Reset wizard state
      this.resetWizard();
      
      // Only navigate back if we're in mock mode (actual creation happened)
      if (this.api.getCurrentMode() === 'mock') {
        // Navigate back to my servers
        this.router.navigate(['/my-servers']);
      }
    }
  }

  // Configuration toggle methods
  toggleBackups(): void {
    this.enableBackups.set(!this.enableBackups());
  }

  toggleMonitoring(): void {
    this.enableMonitoring.set(!this.enableMonitoring());
  }

  // Validation method
  canCreateServer(): boolean {
    return !!(this.selectedArchitecture() && this.selectedLocation() && this.selectedImage());
  }

  // Display name helpers
  getArchitectureDisplayName(): string {
    const arch = this.selectedArchitecture();
    const cpuArch = this.selectedCpuArchitecture();
    let archName = '';
    
    switch (arch) {
      case 'cost-optimized': archName = 'Cost-Optimized'; break;
      case 'regular-performance': archName = 'Regular Performance'; break;
      case 'general-purpose': archName = 'General Purpose'; break;
      default: archName = arch || '';
    }
    
    if (archName && cpuArch) {
      const cpuName = cpuArch === 'x86' ? 'x86' : 'Arm64';
      return `${archName} (${cpuName})`;
    }
    
    return archName;
  }

  getLocationDisplayName(): string {
    const location = this.selectedLocation();
    switch (location) {
      case 'fsn1': return 'Falkenstein (fsn1)';
      case 'nbg1': return 'Nürnberg (nbg1)';
      case 'hel1': return 'Helsinki (hel1)';
      case 'ash': return 'Ashburn (ash)';
      case 'hil': return 'Hillsboro (hil)';
      case 'sin': return 'Singapur (sin)';
      default: return 'Nicht ausgewählt';
    }
  }

  getImageDisplayName(): string {
    const image = this.selectedImage();
    switch (image) {
      case 'ubuntu': return 'Ubuntu 22.04 LTS';
      case 'fedora': return 'Fedora 38';
      case 'debian': return 'Debian 12';
      case 'centos': return 'CentOS Stream 9';
      case 'docker': return 'Docker auf Ubuntu 22.04';
      default: return image || '';
    }
  }

  // Server specs helper
  getSelectedServerSpecs(): { vcpus: number; memory: number; disk: number } {
    const serverType = this.selectedServerType();
    if (!serverType) return { vcpus: 0, memory: 0, disk: 0 };

    const servers = this.filteredServers();
    const selected = servers.find(s => s.server_type?.name === serverType);
    
    return {
      vcpus: selected?.server_type?.cores || 0,
      memory: selected?.server_type?.memory || 0,
      disk: selected?.server_type?.disk || 0
    };
  }

  // Pricing helpers
  getServerPrice(): string {
    const serverType = this.selectedServerType();
    if (!serverType) return '0.00';

    const servers = this.filteredServers();
    const selected = servers.find(s => s.server_type?.name === serverType);
    
    return selected?.server_type?.prices?.[0]?.price_monthly?.gross || '0.00';
  }

  getBackupPrice(): string {
    const basePrice = parseFloat(this.getServerPrice());
    return (basePrice * 0.2).toFixed(2);
  }

  getTotalPrice(): string {
    const basePrice = parseFloat(this.getServerPrice());
    const backupPrice = this.enableBackups() ? parseFloat(this.getBackupPrice()) : 0;
    return (basePrice + backupPrice).toFixed(2);
  }
}
