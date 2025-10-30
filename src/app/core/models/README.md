# Models Documentation

This directory contains all the TypeScript interfaces and types used throughout the Hetzner Cloud Angular Dashboard application.

## Structure

### `server.model.ts`
Contains all interfaces related to Hetzner Cloud servers:
- `Server` - Main server interface
- `ServerType` - Server configuration specifications
- `ServerStatus` - Union type for server states
- `ServerTypePricing` - Pricing information
- `Location` - Geographic location data
- `Datacenter` - Datacenter information
- `PublicNetwork` - Network configuration
- `IPv4Config` / `IPv6Config` - IP configuration
- `TrafficInfo` - Traffic statistics

### `api.model.ts`
Contains interfaces and types related to the API service:
- `ApiMode` - API operation mode ('mock' | 'real')
- `HetznerApiState` - Service state interface
- `CACHE_KEYS` - Constants for localStorage/sessionStorage keys
- `DEFAULT_INCLUDED_TRAFFIC` - Default traffic limit constant

### `ui.model.ts`
Contains interfaces and types for UI state management:
- `SortDirection` - Table sorting directions
- `StatusFilter` - Server status filter options
- `SortColumn` - Available table column identifiers
- `DialogState` - Confirmation dialog state
- `SortState` - Table sorting state

## Usage

Import models from the index file:

```typescript
import { Server, ApiMode, SortDirection } from '../core/models';
```

Or import specific model files:

```typescript
import { Server } from '../core/models/server.model';
import { ApiMode } from '../core/models/api.model';
```

## Benefits

1. **Type Safety**: Strong typing throughout the application
2. **Code Reusability**: Shared interfaces across components
3. **Maintainability**: Centralized type definitions
4. **Documentation**: Self-documenting code through interfaces
5. **IDE Support**: Better IntelliSense and autocomplete
6. **Refactoring**: Easier to update types across the application