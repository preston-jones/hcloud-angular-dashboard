# Hetzner Cloud Angular Dashboard - Data Flow Architecture

## Overview

This document provides a comprehensive technical overview of the data flow architecture for the Hetzner Cloud Angular Dashboard. The application implements a sophisticated dual-mode system that can operate in both **Mock Mode** (for demonstrations) and **Real API Mode** (for production use).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Storage Layers](#data-storage-layers)
3. [Complete Data Flow Chain](#complete-data-flow-chain)
4. [Service Implementation](#service-implementation)
5. [Component Integration](#component-integration)
6. [Mode Switching](#mode-switching)
7. [Session Storage Strategy](#session-storage-strategy)
8. [Error Handling](#error-handling)
9. [Performance Considerations](#performance-considerations)

## Architecture Overview

The application uses Angular 18+ with standalone components and signals for reactive state management. The core architecture consists of three main layers:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │   Service       │    │   Data Sources  │
│                 │    │                 │    │                 │
│ - Templates     │◄──►│ HetznerApiService│◄──►│ - SessionStorage│
│ - Signals       │    │ - Signals       │    │ - JSON Files    │
│ - Computed      │    │ - HTTP Client   │    │ - Real API      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Storage Layers

### Layer 1: Angular Signals (RAM)
- **Purpose**: Reactive UI updates and in-memory state
- **Lifetime**: Until page refresh
- **Speed**: Instant access
- **Implementation**: TypeScript signals with computed properties

```typescript
servers = signal<Server[] | null>(null);
myServers = computed(() => {
  const allServers = this.servers();
  return allServers?.filter(s => s.status !== 'available') || [];
});
```

### Layer 2: SessionStorage (Browser)
- **Purpose**: Persist changes across navigation in mock mode
- **Lifetime**: Until browser tab closes
- **Speed**: Very fast (synchronous)
- **Key**: `hetzner_mock_servers`

### Layer 3: Static JSON Files
- **Purpose**: Initial demo data
- **Location**: `/assets/mock/*.json`
- **Files**: `servers.json`, `server_types.json`, `locations.json`
- **Lifetime**: Permanent (until code deployment)

### Layer 4: Real API
- **Purpose**: Production data source
- **Endpoint**: `https://api.hetzner.cloud/v1/*`
- **Authentication**: Bearer token
- **Lifetime**: Real-time server state

## Complete Data Flow Chain

### 1. Application Initialization

```mermaid
graph TD
    A[Browser Loads App] --> B[Angular Bootstrap]
    B --> C[HetznerApiService Constructor]
    C --> D[loadServers()]
    C --> E[loadLocations()]
    D --> F[Check SessionStorage]
    F --> G{Has Persisted Data?}
    G -->|Yes| H[Load from SessionStorage]
    G -->|No| I[Load from JSON/API]
    I --> J[Save to SessionStorage in Mock Mode]
    H --> K[Update Signal]
    J --> K
    K --> L[Components Render]
```

### 2. First Page Visit (Clean Browser)

**Step 1: Service Constructor**
```typescript
constructor() {
  console.log('🚀 HetznerApiService constructor called');
  this.loadServers();
  this.loadLocations();
}
```

**Step 2: Initial Data Loading**
```typescript
loadServers(): void {
  // Check sessionStorage first (empty on first visit)
  const persistedData = sessionStorage.getItem('hetzner_mock_servers');
  if (persistedData) {
    // Load from sessionStorage
    const servers = JSON.parse(persistedData);
    this.servers.set(servers);
    return;
  }

  // Load from JSON file or API
  const endpoint = this.getEndpoint('servers'); // /assets/mock/servers.json or API
  this.http.get(endpoint).subscribe(response => {
    const servers = response.servers;
    this.servers.set(servers); // Update signal
    
    // Save to sessionStorage in mock mode
    if (this.mode() === 'mock') {
      sessionStorage.setItem('hetzner_mock_servers', JSON.stringify(servers));
    }
  });
}
```

**Step 3: Component Rendering**
```typescript
// Component reads from service signals
servers = this.api.myServers; // Computed signal

// Template automatically updates
@for (server of servers(); track server.id) {
  <div>{{ server.name }}</div>
}
```

### 3. User Operations (CRUD)

#### Delete Operation Flow

```mermaid
graph TD
    A[User Clicks Delete] --> B[Confirm Dialog]
    B --> C[confirmDelete()]
    C --> D[api.deleteServer(id)]
    D --> E[Check Mode]
    E --> F{Mock Mode?}
    F -->|Yes| G[Filter Server from Array]
    F -->|No| H[Show Demo Restriction]
    G --> I[Update Signal]
    I --> J[Save to SessionStorage]
    J --> K[Navigate Back]
    K --> L[UI Auto-Updates]
```

**Implementation:**
```typescript
deleteServer(serverId: string): void {
  if (this.mode() !== 'mock') {
    this.showDemoRestrictionDialog.set(true);
    return;
  }

  // Get current servers from signal
  const currentServers = this.servers();
  
  // Remove deleted server
  const filteredServers = currentServers.filter(server => server.id !== serverId);
  
  // Update signal (triggers UI update)
  this.servers.set(filteredServers);
  
  // Persist to sessionStorage
  sessionStorage.setItem('hetzner_mock_servers', JSON.stringify(filteredServers));
}
```

#### Create Operation Flow

```typescript
createServerFromType(serverType: Server): void {
  if (this.mode() !== 'mock') {
    this.showDemoRestrictionDialog.set(true);
    return;
  }

  // Generate unique ID
  const createdId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const newServer: Server = {
    ...serverType,
    id: createdId,
    name: `${serverType.type}-${Date.now()}`,
    status: 'running',
    created: new Date().toISOString(),
  };

  // Add to existing servers
  const currentServers = this.servers() || [];
  const updatedServers = [...currentServers, newServer];
  
  // Update signal and persist
  this.servers.set(updatedServers);
  sessionStorage.setItem('hetzner_mock_servers', JSON.stringify(updatedServers));
}
```

### 4. Navigation and State Persistence

**Navigation Flow:**
```
Page A → User Navigates → Page B → Component Destroys → Page B Component Inits
```

**Key Points:**
- Service remains singleton across navigation
- SessionStorage preserves changes
- No unwanted data reloading
- Signals maintain reactivity

### 5. Subsequent Page Loads

```typescript
loadServers(): void {
  // 1. Check sessionStorage (contains modified data)
  const persistedData = sessionStorage.getItem('hetzner_mock_servers');
  if (persistedData) {
    // Load persisted changes
    const servers = JSON.parse(persistedData);
    this.servers.set(servers);
    return; // Exit early - don't load from JSON
  }
  
  // This code path is NOT executed if sessionStorage has data
}
```

## Service Implementation

### Core Service Structure

```typescript
@Injectable({ providedIn: 'root' })
export class HetznerApiService {
  private http = inject(HttpClient);
  private readonly MOCK_SERVERS_KEY = 'hetzner_mock_servers';
  
  // Reactive state
  mode = signal<'mock' | 'real'>('mock');
  servers = signal<Server[] | null>(null);
  locations = signal<Location[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Computed properties
  myServers = computed(() => {
    const allServers = this.servers();
    return allServers?.filter(s => s.status !== 'available') || [];
  });
  
  // Public API
  constructor() { /* initialization */ }
  loadServers(): void { /* loading logic */ }
  deleteServer(id: string): void { /* deletion logic */ }
  createServerFromType(type: Server): void { /* creation logic */ }
  setMode(mode: 'mock' | 'real'): void { /* mode switching */ }
}
```

### Endpoint Generation

```typescript
private getEndpoint(path: string): string {
  if (this.mode() === 'mock') {
    return `/assets/mock/${path}.json`;
  } else {
    return `https://api.hetzner.cloud/v1/${path}`;
  }
}
```

### Authentication Handling

```typescript
private getAuthHeaders(): Record<string, string> {
  const token = this.getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
```

## Component Integration

### Signal-Based Components

```typescript
@Component({
  selector: 'app-my-servers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (server of servers(); track server.id) {
      <div class="server-card">
        <h3>{{ server.name }}</h3>
        <span [class]="'status-' + server.status">{{ server.status }}</span>
        <button (click)="deleteServer(server.id)">Delete</button>
      </div>
    }
  `
})
export class MyServersPageComponent {
  private api = inject(HetznerApiService);
  
  // Reactive data binding
  servers = this.api.myServers;
  loading = this.api.loading;
  error = this.api.error;
  
  deleteServer(id: string): void {
    this.api.deleteServer(id);
  }
}
```

### Template Integration

```html
<!-- Automatic reactivity with signals -->
@if (loading()) {
  <div class="loading-spinner">Loading...</div>
} @else if (error()) {
  <div class="error-message">{{ error() }}</div>
} @else {
  @for (server of servers(); track server.id) {
    <div class="server-card">
      <h3>{{ server.name }}</h3>
      <p>Status: {{ server.status }}</p>
      <p>Price: €{{ (server.priceEur || 0).toFixed(2) }}/mo</p>
    </div>
  }
}
```

## Mode Switching

### Implementation

```typescript
setMode(newMode: 'mock' | 'real'): void {
  console.log('Setting mode to:', newMode);
  
  // Update mode signal
  this.mode.set(newMode);
  
  // Clear persisted mock data when switching modes
  sessionStorage.removeItem(this.MOCK_SERVERS_KEY);
  this.hasLoadedInitialData = false;
  
  // Reload data with new mode
  this.loadServers();
}
```

### Mode-Specific Behavior

**Mock Mode:**
- Data loaded from `/assets/mock/*.json`
- Changes persisted in sessionStorage
- CRUD operations work with local data
- No authentication required

**Real Mode:**
- Data loaded from `https://api.hetzner.cloud/v1/*`
- Changes sent to real API
- Requires valid Bearer token
- Demo restrictions prevent destructive operations

## Session Storage Strategy

### Storage Structure

```json
{
  "hetzner_mock_servers": [
    {
      "id": "4712",
      "name": "database-prod",
      "status": "running",
      "server_type": { "name": "cx41", "cores": 4, "memory": 16.0 },
      "datacenter": { "name": "nbg1-dc3" },
      "created": "2024-01-10T14:30:00+00:00"
    }
  ]
}
```

### Read Priority

```
1. Angular Signal (RAM)           → Instant access
2. SessionStorage (Browser)       → If signal empty
3. JSON Files (Static assets)     → If sessionStorage empty
4. Real API (External)           → If in real mode
```

### Write Strategy

**Mock Mode:**
```
1. Update Angular Signal          → Immediate UI update
2. Update SessionStorage         → Persist for navigation
```

**Real Mode:**
```
1. Make API Call                 → Server update
2. Update Signal on success      → UI reflects server response
```

## Error Handling

### Service Level

```typescript
loadServers(): void {
  this.http.get(endpoint).pipe(
    catchError((err: HttpErrorResponse) => {
      console.error('Servers loading failed:', err);
      this.error.set(err.message || 'Failed to load servers');
      return of([]); // Fallback to empty array
    })
  ).subscribe(/* ... */);
}
```

### Component Level

```typescript
// Template handles error states
@if (error()) {
  <div class="error-card">
    <h3>Error Loading Servers</h3>
    <p>{{ error() }}</p>
    <button (click)="retry()">Retry</button>
  </div>
}
```

### Missing Data Handling

```html
<!-- Graceful degradation for missing properties -->
<div class="price">€{{ (server.priceEur || 0).toFixed(2) }}/mo</div>
```

## Performance Considerations

### Optimization Techniques

1. **Signal-Based Reactivity**: Only updates components when data actually changes
2. **Computed Properties**: Efficiently derived state with automatic dependency tracking
3. **OnPush Change Detection**: Reduces unnecessary change detection cycles
4. **SessionStorage Caching**: Eliminates redundant HTTP requests
5. **Early Returns**: Prevents unnecessary processing when data is cached

### Memory Management

```typescript
// Signals automatically handle cleanup
// No manual subscription management needed
servers = this.api.myServers; // Auto-subscribes and unsubscribes
```

### Bundle Size Impact

- SessionStorage adds minimal overhead
- JSON files served as static assets
- No additional dependencies required

## Best Practices

### Service Design

1. **Single Responsibility**: Service handles only data management
2. **Reactive State**: Use signals for all shared state
3. **Error Boundaries**: Comprehensive error handling at service level
4. **Mode Isolation**: Clear separation between mock and real modes

### Component Design

1. **Signal Integration**: Direct binding to service signals
2. **Minimal Logic**: Keep components focused on presentation
3. **Change Detection**: Use OnPush for performance
4. **Error Display**: Handle error states in templates

### Data Management

1. **Immutable Updates**: Always create new arrays/objects for signal updates
2. **Consistent Persistence**: Always update both signal and sessionStorage together
3. **Clean Transitions**: Clear state when switching modes
4. **Type Safety**: Maintain strong typing throughout the data flow

## Debugging

### Console Logging

The service includes comprehensive logging for debugging:

```typescript
console.log('🚀 HetznerApiService constructor called');
console.log('📱 Loading persisted mock servers from sessionStorage');
console.log('💾 SERVER DELETED AND SAVED TO SESSIONSTORAGE');
```

### Browser DevTools

1. **Application Tab**: Check sessionStorage contents
2. **Network Tab**: Monitor HTTP requests
3. **Console**: View detailed operation logs
4. **Angular DevTools**: Inspect signal values

### Debug Helper

```typescript
// Available in browser console
debugHetznerService(); // Returns current service state
```

## Conclusion

This architecture provides a robust, performant, and maintainable solution for managing data in a dual-mode Angular application. The combination of Angular signals, sessionStorage persistence, and clean separation of concerns creates a seamless user experience that can transition between demo and production modes without code changes.

The reactive nature of signals ensures optimal performance, while the sessionStorage strategy provides realistic demo behavior that persists across navigation. This makes the application suitable for both development/demonstration purposes and production deployment with minimal configuration changes.