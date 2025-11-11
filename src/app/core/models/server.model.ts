/**
 * Server status types
 */
export type ServerStatus = 'running' | 'stopped' | 'error' | 'available';

/**
 * Pricing information for a server type
 */
export interface ServerTypePricing {
  location: string;
  price_hourly: {
    net: string;
    gross: string;
  };
  price_monthly: {
    net: string;
    gross: string;
  };
  included_traffic?: number;
  price_per_tb_traffic?: {
    net: string;
    gross: string;
  };
  available?: boolean; // Whether this server type is available in this location
}

/**
 * Location reference
 */
export interface LocationReference {
  id: number;
  name: string;
  deprecation?: any;
}

/**
 * Server type specification
 */
export interface ServerType {
  id: number;
  name: string;
  architecture: string;
  cores: number;
  cpu_type: string;
  category: string;
  deprecated: boolean;
  deprecation?: any;
  description: string;
  disk: number;
  memory: number;
  prices: ServerTypePricing[];
  storage_type: string;
  locations: LocationReference[];
}

/**
 * Geographic location information
 */
export interface Location {
  id: number;
  name: string;
  description: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  network_zone: string;
}

/**
 * Server types availability in datacenter
 */
export interface DatacenterServerTypes {
  available: number[];
  available_for_migration: number[];
  supported: number[];
}

/**
 * Datacenter information
 */
export interface Datacenter {
  id: number;
  description: string;
  location: Location;
  name: string;
  server_types: DatacenterServerTypes;
}

/**
 * Image protection settings
 */
export interface ImageProtection {
  delete: boolean;
}

/**
 * Server image information
 */
export interface ServerImage {
  id: number;
  type: string;
  name: string;
  architecture: string;
  bound_to?: any;
  created_from?: any;
  deprecated?: any;
  description: string;
  disk_size: number;
  image_size?: any;
  labels: { [key: string]: string };
  os_flavor: string;
  os_version: string;
  protection: ImageProtection;
  rapid_deploy: boolean;
  status: string;
  created: string;
  deleted?: any;
}

/**
 * IPv4 network configuration
 */
export interface IPv4Config {
  id: number;
  ip: string;
  blocked: boolean;
  dns_ptr: string;
}

/**
 * IPv6 network configuration
 */
export interface IPv6Config {
  id: number;
  ip: string;
  blocked: boolean;
  dns_ptr: string[];
}

/**
 * Firewall reference
 */
export interface FirewallReference {
  id: number;
  status: string;
}

/**
 * Private network reference
 */
export interface PrivateNetworkReference {
  id: number;
  ip: string;
  alias_ips: string[];
  mac_address: string;
}

/**
 * Load balancer reference
 */
export interface LoadBalancerReference {
  id: number;
  name: string;
  status: string;
}

/**
 * Volume reference
 */
export interface VolumeReference {
  id: number;
  name: string;
  size: number;
  server?: number;
}

/**
 * Public network configuration
 */
export interface PublicNetwork {
  firewalls: FirewallReference[];
  floating_ips: [];
  ipv4: IPv4Config | [];
  ipv6: IPv6Config | [];
}

/**
 * Server protection settings
 */
export interface ServerProtection {
  delete: boolean;
  rebuild: boolean;
}

/**
 * Main Server interface representing a Hetzner Cloud server
 */
export interface Server {
  id: number;
  name: string;
  status: ServerStatus;
  server_type: ServerType;
  datacenter: Datacenter;
  image: ServerImage;
  iso?: any;
  primary_disk_size: number;
  labels: { [key: string]: string };
  protection: ServerProtection;
  backup_window?: any;
  rescue_enabled: boolean;
  locked: boolean;
  placement_group?: any;
  public_net: PublicNetwork;
  private_net: PrivateNetworkReference[];
  load_balancers: LoadBalancerReference[];
  volumes: VolumeReference[];
  included_traffic: number;
  ingoing_traffic: number;
  outgoing_traffic: number;
  created: string;

  // Computed properties for backward compatibility
  type?: string;
  location?: string;
  priceEur?: number;
  vcpus?: number;
  ram?: number;
  ssd?: number;
  architecture?: string;
  country?: string;
}