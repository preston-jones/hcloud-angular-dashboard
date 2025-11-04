/**
 * Server creation wizard models and interfaces
 */

/**
 * Architecture types for server creation
 */
export type ServerArchitecture = 'cost-optimized' | 'regular-performance' | 'general-purpose';

/**
 * CPU architecture types
 */
export type CpuArchitecture = 'x86' | 'arm64';

/**
 * Image tab types
 */
export type ImageTab = 'os' | 'apps';

/**
 * Backup window configuration
 */
export interface BackupWindow {
  value: string;
  label: string;
}

/**
 * Server label for creation wizard
 */
export interface ServerLabel {
  key: string;
  value: string;
}

/**
 * Server creation configuration interface
 */
export interface ServerCreationConfig {
  // Architecture & Type
  architecture: ServerArchitecture | '';
  cpuArchitecture: CpuArchitecture;
  serverType: string;
  
  // Location & Image
  location: string;
  image: string;
  imageTab: ImageTab;
  
  // Networking
  enablePublicIPv4: boolean;
  enablePublicIPv6: boolean;
  
  // Security
  selectedFirewalls: number[];
  
  // Backups
  enableBackups: boolean;
  backupWindow: string;
  
  // Labels & Name
  labels: ServerLabel[];
  serverName: string;
}

/**
 * Wizard step identifiers
 */
export type WizardStep = 
  | 'step-architecture' 
  | 'step-location' 
  | 'step-image' 
  | 'step-networking' 
  | 'step-security' 
  | 'step-extras' 
  | 'step-labels' 
  | 'step-name';

/**
 * Wizard navigation state
 */
export interface WizardState {
  activeSection: WizardStep;
  completedSteps: Set<WizardStep>;
}

/**
 * Location display mapping
 */
export interface LocationMapping {
  code: string;
  displayName: string;
  flag: string;
  country: string;
}

/**
 * Image display mapping
 */
export interface ImageMapping {
  code: string;
  displayName: string;
  category: 'os' | 'apps';
  description?: string;
}

/**
 * Server to create interface for session storage
 */
export interface ServerToCreate {
  id: number;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'available';
  server_type: any;
  datacenter: any;
  image: any;
  iso?: any;
  primary_disk_size: number;
  labels: Record<string, string>;
  protection: {
    delete: boolean;
    rebuild: boolean;
  };
  backup_window?: string | null;
  rescue_enabled: boolean;
  locked: boolean;
  placement_group?: any;
  public_net: {
    firewalls: Array<{
      id: number;
      status: string;
    }>;
    floating_ips: any[];
    ipv4: any | null;
    ipv6: any | null;
  };
  private_net: any[];
  load_balancers: any[];
  volumes: any[];
  included_traffic: number;
  ingoing_traffic: number;
  outgoing_traffic: number;
  created: string;
}