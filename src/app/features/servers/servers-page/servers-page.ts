import { ChangeDetectionStrategy, Component, computed, signal, inject, OnInit, OnDestroy, AfterViewInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { HetznerApiService } from '../../../core/hetzner-api.service';
import { Server } from '../../../core/models';

@Component({
  selector: 'app-servers-page',
  standalone: true,
  imports: [],
  templateUrl: './servers-page.html',
  styleUrls: ['./servers-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServersPage implements OnInit, OnDestroy, AfterViewInit {
  private api = inject(HetznerApiService);
  private router = inject(Router);

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
  currentStep = signal<'list' | 'architecture' | 'location' | 'image' | 'type' | 'networking' | 'security' | 'extras' | 'labels' | 'name' | 'summary'>('architecture');
  
  // Scroll spy state
  activeSection = signal<string>('step-architecture');
  private scrollEventListener?: () => void;
  
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
  enablePublicIPv4 = signal(true);
  enablePublicIPv6 = signal(true);
  
  // Backup window selection
  selectedBackupWindow = signal<string>('22-02');
  availableBackupWindows = [
    { value: '22-02', label: '22:00 - 02:00 UTC (Late Night)' },
    { value: '02-06', label: '02:00 - 06:00 UTC (Early Morning)' },
    { value: '06-10', label: '06:00 - 10:00 UTC (Morning)' },
    { value: '10-14', label: '10:00 - 14:00 UTC (Midday)' },
    { value: '14-18', label: '14:00 - 18:00 UTC (Afternoon)' },
    { value: '18-22', label: '18:00 - 22:00 UTC (Evening)' }
  ];

  selectedBackupWindowLabel = computed(() => {
    return this.availableBackupWindows.find(w => w.value === this.selectedBackupWindow())?.label || '';
  });
  
  // Firewall selection
  selectedFirewalls = signal<number[]>([]);

  // Labels management
  serverLabels = signal<Array<{key: string, value: string}>>([]);
  labelsTextarea = signal<string>('');

  // Server name management
  serverName = signal<string>('');
  nameError = signal<string>('');

  constructor() {
    // No auto-generation of suggestions - keep it simple
  }

      // Get data from service
  servers = this.api.availableServerTypes;  // Use server types for creation page
  locations = this.api.locations;
  firewalls = this.api.firewalls;
  loading = this.api.loading;
  error = this.api.error;
  searchQuery = this.api.searchQuery;
  get isUsingMockData() { return this.api.isUsingMockData(); }

  ngOnInit() {
    // Load server types (available configurations) for this page
    this.api.loadServerTypes();
    
    // Load saved firewall selection
    this.loadFirewallSelection();
  }

  ngOnDestroy() {
    this.cleanupScrollSpy();
  }

  ngAfterViewInit() {
    this.setupScrollSpy();
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
      // Use the actual mock data fields instead of parsing server type names
      const serverCategory = server.server_type?.category;
      const serverArchitecture = server.server_type?.architecture;
      
      // Map UI selection to mock data categories
      let matchesArchitecture = false;
      if (arch === 'cost-optimized') {
        matchesArchitecture = serverCategory === 'cost_optimized';
      } else if (arch === 'regular-performance') {
        matchesArchitecture = serverCategory === 'regular_purpose';
      } else if (arch === 'general-purpose') {
        matchesArchitecture = serverCategory === 'general_purpose';
      }
      
      // Filter by CPU architecture using actual mock data
      let matchesCpuArch = false;
      if (cpuArch === 'x86') {
        matchesCpuArch = serverArchitecture === 'x86';
      } else if (cpuArch === 'arm64') {
        matchesCpuArch = serverArchitecture === 'arm';
      }
      
      return matchesArchitecture && matchesCpuArch;
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
      const serverConfig = {
        enableIPv4: this.enablePublicIPv4(),
        enableIPv6: this.enablePublicIPv6(),
        enableBackups: this.enableBackups(),
        backupWindow: this.enableBackups() ? this.selectedBackupWindow() : null,
        selectedFirewalls: this.selectedFirewalls()
      };
      this.api.createServerFromType(selected, serverName, serverConfig);
      this.showNameDialog.set(false);
      
      // Navigate back to my servers after creation
      setTimeout(() => {
        this.router.navigate(['/my-servers']);
      }, 100);
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
      case 'networking': return this.enablePublicIPv4() || this.enablePublicIPv6();
      case 'security': return this.selectedFirewalls().length > 0;
      case 'extras': return this.enableBackups();
      case 'labels': return this.serverLabels().length > 0;
      case 'name': return !!this.serverName().trim(); // Red when name is provided, green when empty
      case 'summary': return false; // Never completed until server is created
      default: return false;
    }
  }

  // Architecture selection
  selectArchitecture(architecture: string): void {
    this.selectedArchitecture.set(architecture);
    
    // Automatically set CPU architecture based on selection
    if (architecture === 'regular-performance' || architecture === 'general-purpose') {
      this.selectedCpuArchitecture.set('x86');
    }
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

    // Use provided name or generate one using Hetzner style
    let finalName = this.serverName().trim();
    if (!finalName) {
      finalName = this.generateHetznerStyleName();
      this.serverName.set(finalName);
    }

    // Validate the name
    if (!this.validateServerName()) {
      console.error('Invalid server name');
      return;
    }

    // Create server directly with all configuration
    this.createServerWithConfig(selectedServer, finalName);
  }

  private createServerWithConfig(selectedServer: any, serverName: string): void {
    // Create server using the API service with all configuration options
    const serverConfig = {
      enableIPv4: this.enablePublicIPv4(),
      enableIPv6: this.enablePublicIPv6(),
      enableBackups: this.enableBackups(),
      backupWindow: this.enableBackups() ? this.selectedBackupWindow() : null,
      selectedFirewalls: this.selectedFirewalls()
    };
    
    this.api.createServerFromType(selectedServer, serverName, serverConfig);
    
    // Reset wizard state
    this.resetWizard();
    
    // Navigate to servers list page after creation
    setTimeout(() => {
      this.router.navigate(['/my-servers']);
    }, 100);
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
      // Create server using the API service with all configuration options
      const serverConfig = {
        enableIPv4: this.enablePublicIPv4(),
        enableIPv6: this.enablePublicIPv6(),
        enableBackups: this.enableBackups(),
        backupWindow: this.enableBackups() ? this.selectedBackupWindow() : null,
        selectedFirewalls: this.selectedFirewalls()
      };
      this.api.createServerFromType(selected, serverName, serverConfig);
      this.showNameDialog.set(false);
      
      // Reset wizard state
      this.resetWizard();
      
      // Navigate back to my servers after creation
      setTimeout(() => {
        this.router.navigate(['/my-servers']);
      }, 100);
    }
  }

  // Configuration toggle methods
  toggleBackups(): void {
    this.enableBackups.set(!this.enableBackups());
  }

  togglePublicIPv4(): void {
    this.enablePublicIPv4.set(!this.enablePublicIPv4());
  }

  togglePublicIPv6(): void {
    this.enablePublicIPv6.set(!this.enablePublicIPv6());
  }

  selectBackupWindow(window: string): void {
    this.selectedBackupWindow.set(window);
  }

  toggleFirewall(firewallId: number): void {
    const current = this.selectedFirewalls();
    const index = current.indexOf(firewallId);
    
    if (index > -1) {
      // Remove firewall if already selected
      this.selectedFirewalls.set(current.filter(id => id !== firewallId));
    } else {
      // Add firewall if not selected
      this.selectedFirewalls.set([...current, firewallId]);
    }
    
    // Persist to session storage
    this.persistFirewallSelection();
  }

  private persistFirewallSelection(): void {
    const selectedIds = this.selectedFirewalls();
    sessionStorage.setItem('selectedFirewalls', JSON.stringify(selectedIds));
  }

  private loadFirewallSelection(): void {
    const saved = sessionStorage.getItem('selectedFirewalls');
    if (saved) {
      try {
        const selectedIds = JSON.parse(saved);
        if (Array.isArray(selectedIds)) {
          this.selectedFirewalls.set(selectedIds);
        }
      } catch (e) {
        console.warn('Failed to parse saved firewall selection');
      }
    }
  }

  // Labels management methods
  removeLabel(key: string): void {
    const currentLabels = this.serverLabels();
    this.serverLabels.set(currentLabels.filter(label => label.key !== key));
  }

  updateLabelsTextarea(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.labelsTextarea.set(target.value);
    
    // Auto-parse labels as user types for real-time validation
    this.parseLabelsFromTextareaRealtime();
  }

  parseLabelsFromTextarea(): void {
    const text = this.labelsTextarea().trim();
    if (!text) return;

    const lines = text.split('\n');
    const newLabels: Array<{key: string, value: string}> = [];
    const currentLabels = this.serverLabels();
    const existingKeys = new Set(currentLabels.map(l => l.key));

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').trim();
      
      if (key && value && !existingKeys.has(key.trim())) {
        newLabels.push({ key: key.trim(), value });
        existingKeys.add(key.trim());
      }
    }

    if (newLabels.length > 0) {
      this.serverLabels.set([...currentLabels, ...newLabels]);
      this.labelsTextarea.set('');
    }
  }

  parseLabelsFromTextareaRealtime(): void {
    const text = this.labelsTextarea().trim();
    if (!text) {
      // If textarea is empty, clear all labels that came from textarea
      this.serverLabels.set([]);
      return;
    }

    const lines = text.split('\n');
    const validLabels: Array<{key: string, value: string}> = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=').trim();
      
      if (key && value) {
        const trimmedKey = key.trim();
        // Check if this key already exists in validLabels
        if (!validLabels.some(label => label.key === trimmedKey)) {
          validLabels.push({ key: trimmedKey, value });
        }
      }
    }

    // Update serverLabels with the valid labels from textarea
    this.serverLabels.set(validLabels);
  }

  // Server name management methods
  updateServerName(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.serverName.set(target.value);
    this.nameError.set(''); // Clear error when typing
  }

  validateServerName(): boolean {
    const name = this.serverName().trim();
    
    // If no name provided, that's fine - we'll auto-generate
    if (!name) {
      this.nameError.set('');
      return true;
    }
    
    if (name.length < 3 || name.length > 63) {
      this.nameError.set('Name must be 3-63 characters long');
      return false;
    }
    
    // Basic validation: alphanumeric, hyphens, no consecutive hyphens
    const validPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    if (!validPattern.test(name)) {
      this.nameError.set('Name must contain only alphanumeric characters and hyphens');
      return false;
    }
    
    this.nameError.set('');
    return true;
  }

  generateHetznerStyleName(): string {
    const image = this.selectedImage() || 'server';
    const location = this.selectedLocation() || 'dc';
    
    // Get RAM size from selected server type
    const servers = this.availableServers();
    const selectedServer = servers.find(s => 
      s.name?.toLowerCase().includes((this.selectedServerType() || '').toLowerCase())
    );
    const memory = selectedServer?.server_type?.memory || 4;
    
    // Get datacenter ID (simulate with random number for now)
    const datacenterId = Math.floor(Math.random() * 9) + 1;
    
    // Format: image-memory-location-id (e.g., ubuntu-4gb-hel1-3)
    return `${image}-${memory}gb-${location}-${datacenterId}`;
  }

  // Validation method
  canCreateServer(): boolean {
    const hasRequiredSelections = !!(this.selectedArchitecture() && this.selectedLocation() && this.selectedImage());
    const hasValidName = this.serverName().trim().length > 0;
    
    return hasRequiredSelections && (hasValidName || true); // Allow auto-generation of name
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

  // Navigation helper for summary card
  scrollToStep(stepId: string): void {
    console.log('scrollToStep called with:', stepId);
    const element = document.getElementById(stepId);
    const mainContent = document.querySelector('.wizard-main');
    
    console.log('Element found:', !!element);
    console.log('Main content found:', !!mainContent);
    
    if (element && mainContent) {
      const elementTop = element.offsetTop;
      const headerHeight = 100; // Reduced header offset
      const scrollPosition = elementTop - headerHeight;
      
      console.log('Scrolling to position:', scrollPosition);
      
      mainContent.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
      
      // Manually update active section when clicking
      setTimeout(() => {
        console.log('Setting active section to:', stepId);
        this.activeSection.set(stepId);
        console.log('Active section is now:', this.activeSection());
      }, 100);
    } else {
      console.log('Failed to find element or main content for:', stepId);
    }
  }

  // Scroll spy functionality
  private setupScrollSpy(): void {
    console.log('Setting up scroll spy...');
    const stepIds = ['step-architecture', 'step-location', 'step-image', 'step-networking', 'step-security', 'step-extras', 'step-labels', 'step-name'];
    const scrollContainer = document.querySelector('.wizard-main') as HTMLElement;
    
    if (!scrollContainer) {
      console.log('Scroll container not found');
      return;
    }
    
    console.log('Scroll container found:', scrollContainer);
    
    const updateActiveSection = () => {
      const scrollTop = scrollContainer.scrollTop;
      let activeStep = stepIds[0]; // Default to first step
      
      console.log('Checking scroll position:', scrollTop);
      
      // Find the section that's currently most visible
      for (let i = stepIds.length - 1; i >= 0; i--) {
        const element = document.getElementById(stepIds[i]) as HTMLElement;
        if (element) {
          const elementTop = element.offsetTop;
          console.log(`${stepIds[i]} top:`, elementTop, 'threshold:', elementTop - 200);
          // If we've scrolled past this element (with small offset)
          if (scrollTop >= elementTop - 200) {
            activeStep = stepIds[i];
            console.log('Active step set to:', activeStep);
            break;
          }
        } else {
          console.log('Element not found:', stepIds[i]);
        }
      }
      
      // Update if changed
      if (activeStep !== this.activeSection()) {
        console.log('Updating active section from', this.activeSection(), 'to', activeStep);
        this.activeSection.set(activeStep);
        this.scrollSummaryToActiveStep(activeStep);
      }
    };
    
    // Add throttled scroll listener
    let ticking = false;
    const onScroll = () => {
      console.log('Scroll event triggered!');
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    this.scrollEventListener = onScroll;
    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    console.log('Scroll event listener attached');
    
    // Initial check
    setTimeout(() => updateActiveSection(), 300);
  }

  private cleanupScrollSpy(): void {
    if (this.scrollEventListener) {
      const scrollContainer = document.querySelector('.wizard-main');
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', this.scrollEventListener);
      }
      this.scrollEventListener = undefined;
    }
  }

  // Scroll the summary sections to show the active step
  private scrollSummaryToActiveStep(activeStepId: string): void {
    const summaryContainer = document.querySelector('.summary-sections');
    if (!summaryContainer) return;

    // Find the corresponding summary section element
    const summaryElements = summaryContainer.querySelectorAll('.summary-section');
    const stepMapping: { [key: string]: number } = {
      'step-architecture': 0,
      'step-location': 1,
      'step-image': 2,
      'step-networking': 3,
      'step-security': 4,
      'step-extras': 5,
      'step-labels': 6,
      'step-name': 7
    };

    const activeIndex = stepMapping[activeStepId];
    if (activeIndex !== undefined && summaryElements[activeIndex]) {
      const activeElement = summaryElements[activeIndex] as HTMLElement;
      
      // Calculate scroll position to center the active element
      const containerHeight = summaryContainer.clientHeight;
      const elementHeight = activeElement.offsetHeight;
      const elementTop = activeElement.offsetTop;
      
      const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);
      
      summaryContainer.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }

  // Check if a summary section is currently active
  isSectionActive(stepId: string): boolean {
    const isActive = this.activeSection() === stepId;
    console.log(`isSectionActive(${stepId}):`, isActive, 'current activeSection:', this.activeSection());
    return isActive;
  }
}
