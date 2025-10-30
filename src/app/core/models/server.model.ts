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
}

/**
 * Server type specification
 */
export interface ServerType {
  id: number;
  name: string;
  cores: number;
  memory: number;
  disk: number;
  description?: string;
  cpu_type?: string;
  storage_type?: string;
  architecture?: string;
  prices?: ServerTypePricing[];
}

/**
 * Geographic location information
 */
export interface Location {
  id: number;
  name: string;
  city: string;
  country: string;
  description: string;
  latitude: number;
  longitude: number;
  network_zone?: string;
}

/**
 * Datacenter information
 */
export interface Datacenter {
  id: number;
  name: string;
  location: Location;
}

/**
 * IPv4 network configuration
 */
export interface IPv4Config {
  id: number;
  ip: string;
  blocked: boolean;
  dns_ptr?: string;
}

/**
 * IPv6 network configuration
 */
export interface IPv6Config {
  id: number;
  ip: string;
  blocked: boolean;
  dns_ptr?: string[];
}

/**
 * Public network configuration
 */
export interface PublicNetwork {
  ipv4?: IPv4Config;
  ipv6?: IPv6Config;
  floating_ips?: any[];
  // Traffic data may be nested in public_net in some API responses
  ingoing_traffic?: number;
  outgoing_traffic?: number;
}

/**
 * Traffic information
 */
export interface TrafficInfo {
  ingoing?: number;
  outgoing?: number;
}

/**
 * Server protection settings
 */
export interface ServerProtection {
  delete: boolean;
  rebuild?: boolean;
}

/**
 * Main Server interface representing a Hetzner Cloud server
 */
export interface Server {
  id: number;
  name: string;
  status: ServerStatus;
  created?: string;
  server_type?: ServerType;
  datacenter?: Datacenter;
  public_net?: PublicNetwork;
  protection?: ServerProtection;
  
  // Traffic properties (may be at root level or nested)
  traffic?: TrafficInfo;
  included_traffic?: number;
  ingoing_traffic?: number;
  outgoing_traffic?: number;
  
  // Computed properties for compatibility
  type?: string;
  location?: string;
  priceEur?: number;
  vcpus?: number;
  ram?: number;
  ssd?: number;
  architecture?: string;
  country?: string;
}