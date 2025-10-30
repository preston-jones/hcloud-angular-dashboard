/**
 * UI-specific models for component state management
 */

/**
 * Sort direction for table columns
 */
export type SortDirection = 'asc' | 'desc' | 'none';

/**
 * Server status filter options
 */
export type StatusFilter = 'all' | 'running' | 'stopped';

/**
 * Server table column identifiers
 */
export type SortColumn = 'name' | 'type' | 'vcpus' | 'ram' | 'ssd' | 'location' | 'status' | 'price';

/**
 * Dialog state for confirmation dialogs
 */
export interface DialogState {
  showDeleteAllDialog: boolean;
  showStartAllDialog: boolean;
  showStopAllDialog: boolean;
}

/**
 * Sorting state for server tables
 */
export interface SortState {
  column: string | null;
  direction: SortDirection;
}