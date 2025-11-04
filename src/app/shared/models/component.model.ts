/**
 * Shared UI component models and interfaces
 */

/**
 * Action configuration for selection components
 */
export interface SelectionAction {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
  hoverClass?: string;
  action: () => void;
}

/**
 * Navigation item for sidebar and menu components
 */
export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
}

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

/**
 * Component size variants
 */
export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * Loading state for async operations
 */
export interface LoadingState {
  loading: boolean;
  error?: string | null;
  lastUpdated?: Date;
}

/**
 * Generic confirmation dialog configuration
 */
export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}