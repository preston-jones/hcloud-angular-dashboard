/**
 * Firewall and security-related models
 */

/**
 * Firewall rule direction
 */
export type FirewallRuleDirection = 'inbound' | 'outbound';

/**
 * Firewall rule protocol
 */
export type FirewallRuleProtocol = 'tcp' | 'udp' | 'icmp' | 'esp' | 'gre';

/**
 * Firewall rule action
 */
export type FirewallRuleAction = 'allow' | 'deny';

/**
 * Firewall status
 */
export type FirewallStatus = 'active' | 'inactive' | 'pending';

/**
 * Firewall rule configuration
 */
export interface FirewallRule {
  direction: FirewallRuleDirection;
  protocol: FirewallRuleProtocol;
  port?: string | number;
  source_ips?: string[];
  destination_ips?: string[];
  action: FirewallRuleAction;
  description?: string;
}

/**
 * Complete firewall configuration
 */
export interface Firewall {
  id: number;
  name: string;
  labels: Record<string, string>;
  rules: FirewallRule[];
  applied_to: Array<{
    type: 'server' | 'label_selector';
    server?: {
      id: number;
      name: string;
    };
    label_selector?: {
      selector: string;
    };
  }>;
  status: FirewallStatus;
  created: string;
}

/**
 * Firewall selection state for wizard
 */
export interface FirewallSelection {
  selectedIds: number[];
  availableFirewalls: Firewall[];
}

/**
 * Firewall application status
 */
export interface FirewallApplicationStatus {
  firewall_id: number;
  status: 'applied' | 'pending' | 'error';
  error_message?: string;
}

/**
 * Security group configuration for server creation
 */
export interface SecurityGroupConfig {
  enablePublicIPv4: boolean;
  enablePublicIPv6: boolean;
  selectedFirewalls: number[];
  customRules?: FirewallRule[];
}