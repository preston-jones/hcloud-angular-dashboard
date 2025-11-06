/**
 * Network and networking-related models
 */

/**
 * Network status types
 */
export type NetworkStatus = 'active' | 'inactive' | 'pending' | 'deleting';

/**
 * Network zone types
 */
export type NetworkZone = 'eu-central' | 'us-east' | 'us-west' | 'ap-southeast';

/**
 * IP range configuration
 */
export interface IPRange {
  ip: string;
  gateway: string;
  available_ips: number;
  used_ips: number;
}

/**
 * Network subnet configuration
 */
export interface NetworkSubnet {
  type: 'cloud' | 'server';
  ip_range: string;
  network_zone: NetworkZone;
  gateway: string;
  vswitch_id?: number;
}

/**
 * Network route configuration
 */
export interface NetworkRoute {
  destination: string;
  gateway: string;
}

/**
 * Network protection settings
 */
export interface NetworkProtection {
  delete: boolean;
}

/**
 * Complete network interface
 */
export interface Network {
  id: number;
  name: string;
  ip_range: string;
  subnets: NetworkSubnet[];
  routes: NetworkRoute[];
  servers: number[];
  protection: NetworkProtection;
  labels: Record<string, string>;
  load_balancers: number[];
  status: NetworkStatus;
  created: string;
}

/**
 * Floating IP types
 */
export type FloatingIPType = 'ipv4' | 'ipv6';

/**
 * Floating IP status
 */
export type FloatingIPStatus = 'active' | 'inactive' | 'pending' | 'deleting';

/**
 * Floating IP protection settings
 */
export interface FloatingIPProtection {
  delete: boolean;
}

/**
 * DNS pointer configuration
 */
export interface DNSPointer {
  ip: string;
  dns_ptr: string;
}

/**
 * Complete floating IP interface
 */
export interface FloatingIP {
  id: number;
  name?: string;
  description?: string;
  ip: string;
  type: FloatingIPType;
  server?: number | null;
  home_location: Location;
  blocked: boolean;
  protection: FloatingIPProtection;
  labels: Record<string, string>;
  dns_ptr: DNSPointer[];
  status: FloatingIPStatus;
  created: string;
}

/**
 * Load balancer algorithm types
 */
export type LoadBalancerAlgorithm = 'round_robin' | 'least_connections';

/**
 * Load balancer protocol types
 */
export type LoadBalancerProtocol = 'http' | 'https' | 'tcp';

/**
 * Load balancer status
 */
export type LoadBalancerStatus = 'active' | 'inactive' | 'pending' | 'deleting';

/**
 * Load balancer service configuration
 */
export interface LoadBalancerService {
  protocol: LoadBalancerProtocol;
  listen_port: number;
  destination_port: number;
  proxyprotocol: boolean;
  health_check: {
    protocol: LoadBalancerProtocol;
    port: number;
    interval: number;
    timeout: number;
    retries: number;
    http?: {
      domain?: string;
      path: string;
      response?: string;
      tls: boolean;
      status_codes?: string[];
    };
  };
  http?: {
    sticky_sessions: boolean;
    redirect_http: boolean;
    cookie_name?: string;
    cookie_lifetime?: number;
  };
}

/**
 * Load balancer target configuration
 */
export interface LoadBalancerTarget {
  type: 'server' | 'label_selector' | 'ip';
  server?: {
    id: number;
  };
  label_selector?: {
    selector: string;
  };
  ip?: {
    ip: string;
  };
  use_private_ip: boolean;
  health_status?: Array<{
    listen_port: number;
    status: 'healthy' | 'unhealthy' | 'unavailable';
  }>;
}

/**
 * Load balancer protection settings
 */
export interface LoadBalancerProtection {
  delete: boolean;
}

/**
 * Complete load balancer interface
 */
export interface LoadBalancer {
  id: number;
  name: string;
  public_net: {
    enabled: boolean;
    ipv4: {
      ip: string;
    };
    ipv6: {
      ip: string;
    };
  };
  private_net: Array<{
    network: number;
    ip: string;
  }>;
  location: Location;
  load_balancer_type: {
    id: number;
    name: string;
    description: string;
    max_connections: number;
    max_assigned_certificates: number;
    max_services: number;
    max_targets: number;
    prices: Array<{
      location: string;
      price_hourly: {
        net: string;
        gross: string;
      };
      price_monthly: {
        net: string;
        gross: string;
      };
    }>;
  };
  protection: LoadBalancerProtection;
  labels: Record<string, string>;
  algorithm: {
    type: LoadBalancerAlgorithm;
  };
  services: LoadBalancerService[];
  targets: LoadBalancerTarget[];
  status: LoadBalancerStatus;
  created: string;
}

// Re-export Location from server.model.ts to avoid circular dependencies
import type { Location } from './server.model';