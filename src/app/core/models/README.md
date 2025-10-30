# Angular 20 Models Documentation

This directory contains all the TypeScript 5.9 interfaces and types used throughout the Hetzner Cloud Angular 20 Dashboard application.

## Structure

### `server.model.ts`
Contains all interfaces related to Hetzner Cloud servers:
- `Server` - Main server interface with strong typing
- `ServerType` - Server configuration specifications
- `ServerStatus` - Union type for server states
- `ServerTypePricing` - Pricing information structure
- `Location` - Geographic location data
- `Datacenter` - Datacenter information
- `PublicNetwork` - Network configuration
- `IPv4Config` / `IPv6Config` - IP configuration interfaces
- `TrafficInfo` - Traffic statistics interface

### `api.model.ts`
Contains interfaces and types related to the API service:
- `ApiMode` - API operation mode ('mock' | 'real') union type
- `HetznerApiState` - Service state interface for Angular 20 signals
- `CACHE_KEYS` - Constants for localStorage/sessionStorage keys
- `DEFAULT_INCLUDED_TRAFFIC` - Default traffic limit constant

### `ui.model.ts`
Contains interfaces and types for UI state management:
- `SortDirection` - Table sorting directions union type
- `StatusFilter` - Server status filter options
- `SortColumn` - Available table column identifiers
- `DialogState` - Confirmation dialog state interface
- `SortState` - Table sorting state interface

## Angular 20 Usage

Import models from the index file:

```typescript
import { Server, ApiMode, SortDirection } from '../core/models';
```

Or import specific model files:

```typescript
import { Server } from '../core/models/server.model';
import { ApiMode } from '../core/models/api.model';
```

## Angular 20 Benefits

1. **Type Safety**: Strong typing throughout the Angular 20 application
2. **Code Reusability**: Shared interfaces across standalone components
3. **Maintainability**: Centralized type definitions with TypeScript 5.9
4. **Documentation**: Self-documenting code through interfaces
5. **IDE Support**: Better IntelliSense and autocomplete with modern TypeScript
6. **Refactoring**: Easier to update types across the application
7. **Signal Integration**: Properly typed signals and computed properties
8. **Compile-time Safety**: Catch errors before runtime with strict TypeScript