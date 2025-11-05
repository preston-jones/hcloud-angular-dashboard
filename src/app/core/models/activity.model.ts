/**
 * Activity and event tracking models
 */

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string; // ISO date string
  status: ActivityStatus;
  icon: string;
  category: ActivityCategory;
  metadata?: Record<string, any>;
}

export type ActivityType = 
  | 'server_created'
  | 'server_started' 
  | 'server_stopped'
  | 'server_rebooted'
  | 'backup_created'
  | 'backup_restored'
  | 'firewall_updated'
  | 'configuration_changed'
  | 'monitoring_alert'
  | 'update_installed'
  | 'ssl_certificate_renewed'
  | 'disk_usage_warning'
  | 'load_balancer_connected'
  | 'load_balancer_disconnected'
  | 'image_created'
  | 'snapshot_created'
  | 'maintenance_scheduled'
  | 'maintenance_completed'
  | 'network_attached'
  | 'network_detached'
  | 'volume_attached'
  | 'volume_detached'
  | 'scaling_performed'
  | 'password_changed'
  | 'ssh_key_added'
  | 'rescue_mode_enabled'
  | 'rescue_mode_disabled';

export type ActivityStatus = 
  | 'completed'
  | 'in_progress' 
  | 'failed'
  | 'warning'
  | 'pending'
  | 'cancelled';

export type ActivityCategory = 
  | 'lifecycle'
  | 'power'
  | 'backup'
  | 'security'
  | 'configuration'
  | 'monitoring'
  | 'maintenance'
  | 'networking'
  | 'storage'
  | 'scaling'
  | 'authentication';

export interface ActivityTypeConfig {
  label: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray';
  priority: 'low' | 'medium' | 'high';
}

export interface ServerActivities {
  [serverId: string]: Activity[];
}

export interface ActivityTypesConfig {
  [activityType: string]: ActivityTypeConfig;
}

export interface ActivitiesData {
  serverActivities: ServerActivities;
  activityTypes: ActivityTypesConfig;
}