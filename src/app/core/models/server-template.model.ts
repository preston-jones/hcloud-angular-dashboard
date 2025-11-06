/**
 * Server template and server type transformation models
 */

import { Server, ServerType } from './server.model';

/**
 * Server template created from server types for selection in the wizard
 * This represents a server template that can be used to create actual servers
 */
export interface ServerTemplate extends Omit<Server, 'datacenter' | 'image'> {
  server_type: ServerType;
  datacenter: null;
  image: null;
  status: 'available';
}

/**
 * Type alias for server types that are actually server templates
 * Used in the architecture wizard and server selection
 */
export type ServerTypeTemplate = ServerTemplate;