/**
 * Action and activity models for Hetzner Cloud operations
 */

/**
 * Action status types
 */
export type ActionStatus = 'running' | 'success' | 'error';

/**
 * Action command types
 */
export type ActionCommand = 
  | 'create_server' 
  | 'start_server' 
  | 'stop_server' 
  | 'reboot_server' 
  | 'reset_server' 
  | 'delete_server'
  | 'rebuild_server'
  | 'power_off_server'
  | 'power_on_server'
  | 'enable_backup'
  | 'disable_backup'
  | 'enable_rescue'
  | 'disable_rescue'
  | 'attach_iso'
  | 'detach_iso'
  | 'change_protection'
  | 'request_console'
  | 'add_to_placement_group'
  | 'remove_from_placement_group'
  | 'attach_to_network'
  | 'detach_from_network'
  | 'change_dns_ptr'
  | 'create_image'
  | 'resize'
  | 'upgrade'
  | 'migrate';

/**
 * Resource reference in actions
 */
export interface ActionResource {
  id: number;
  type: 'server' | 'image' | 'volume' | 'network' | 'floating_ip' | 'load_balancer' | 'firewall';
}

/**
 * Action error information
 */
export interface ActionError {
  code: string;
  message: string;
}

/**
 * Complete action interface
 */
export interface Action {
  id: number;
  command: ActionCommand;
  status: ActionStatus;
  progress: number;
  started: string;
  finished: string | null;
  resources: ActionResource[];
  error: ActionError | null;
  parent_id?: number;
}

/**
 * Actions API response structure
 */
export interface ActionsResponse {
  actions: Action[];
  meta: {
    pagination: {
      page: number;
      per_page: number;
      previous_page: number | null;
      next_page: number | null;
      last_page: number;
      total_entries: number;
    };
  };
}

/**
 * Action display information for UI
 */
export interface ActionDisplay {
  icon: string;
  label: string;
  description: string;
  color: string;
}

/**
 * Action filter options
 */
export type ActionFilter = 'all' | 'running' | 'success' | 'error';

/**
 * Action time filter options
 */
export type ActionTimeFilter = 'today' | 'week' | 'month' | 'all';