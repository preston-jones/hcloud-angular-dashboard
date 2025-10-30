/**
 * API mode types
 */
export type ApiMode = 'mock' | 'real';

/**
 * Service state interface
 */
export interface HetznerApiState {
  servers: any[] | null;
  serverTypes: any[] | null;
  locations: any[] | null;
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
  MODE: 'hetzner_api_mode',
  TOKEN: 'hz.token'
} as const;

/**
 * Default included traffic in bytes (20TB)
 */
export const DEFAULT_INCLUDED_TRAFFIC = 21990232555520;