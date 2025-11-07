import { Server, ServerType, Location } from './server.model';

/**
 * API mode types
 */
export type ApiMode = 'mock' | 'real';

/**
 * Service state interface
 */
export interface HetznerApiState {
  servers: Server[] | null;
  serverTypes: ServerType[] | null;
  locations: Location[] | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  showDemoRestrictionDialog: boolean;
  mode: ApiMode;
}

/**
 * Cache keys used by the service
 */
export const CACHE_KEYS = {
  MOCK_SERVERS: 'hetzner_mock_servers',
  USER_SERVERS: 'hetzner_user_servers',
  SERVERS: 'hetzner_servers',
  SERVER_TYPES: 'hetzner_server_types',
  LOCATIONS: 'hetzner_locations',
  DATACENTERS: 'hetzner_datacenters',
  IMAGES: 'hetzner_images',
  FIREWALLS: 'hetzner_firewalls',
  ACTIONS: 'hetzner_actions',
  FLOATING_IPS: 'hetzner_floating_ips',
  LOAD_BALANCERS: 'hetzner_load_balancers',
  NETWORKS: 'hetzner_networks',
  MODE: 'hetzner_api_mode',
  TOKEN: 'hz.token'
} as const;

/**
 * Default included traffic in bytes (20TB)
 */
export const DEFAULT_INCLUDED_TRAFFIC = 21990232555520;