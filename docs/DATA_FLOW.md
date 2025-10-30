# Hetzner Cloud Angular 20 Dashboard - Data Flow Documentation

## **🚀 Angular 20 Application Initialization Flow**

```
1. Angular 20 App Starts (Standalone Bootstrap)
   ↓
2. HetznerApiService Constructor (Singleton)
   ↓
3. Load Persisted Mode (localStorage) 
   ↓
4. Initialize Angular 20 Signals with Persisted Mode
   ↓
5. Load Data using Modern HTTP Client (servers, server types, locations)
```

## **📊 Angular 20 Data Loading Flow**

```
Angular 20 Standalone App Start → HetznerApiService.constructor()
    ↓
    Clear old cache → sessionStorage.removeItem()
    ↓
    Load persisted mode → getPersistedMode() from localStorage
    ↓
    Initialize mode signal → signal<ApiMode>(persistedMode) [TypeScript typed]
    ↓
    Auto-load data → loadServers() + loadServerTypes() + loadLocations()
    ↓
    Check current mode using extracted models:
    
    IF mode === 'mock':
        → Load from /assets/mock/*.json
        → Merge with user-created servers from sessionStorage
        → Allow write operations (create/delete servers)
    
    IF mode === 'real':
        → Load from Hetzner Cloud API v1
        → Use Bearer token authentication
        → Read-only mode (display actual servers)
```

## **🔄 Mode Switching Flow**

```
User clicks settings → Opens SettingsDialog
    ↓
    Changes mode (Mock ↔ API)
    ↓
    Calls api.setMode(newMode: ApiMode)
    ↓
    Updates mode signal → mode.set(newMode)
    ↓
    Persists to localStorage → persistMode(newMode)
    ↓
    Clears caches → sessionStorage.removeItem(CACHE_KEYS.*)
    ↓
    Reloads data → loadServers() with new mode
```

## **🖥️ Page Navigation Flow**

### **Server List Pages (Angular 20 Standalone Components):**
```
/servers (Available) → ServersPage [Standalone Component]
    ↓
    Uses api.availableServerTypes() [Computed Signal]
    ↓
    Shows server configurations for creation
    ↓
    Location shows "All Locations" (not specific datacenter)

/my-servers → MyServersPage [Standalone Component]
    ↓
    Uses api.myServers() [Computed Signal]
    ↓
    Shows actual running server instances
    ↓
    Uses new @for control flow syntax for rendering
    ↓
    Location shows specific datacenter/city
```

### **Server Detail Page (Angular 20 Features):**
```
/servers/:id → ServerDetailPage [Standalone Component]
    ↓
    Get ID from route → route.snapshot.paramMap.get('id')
    ↓
    Find server → computed(() => api.myServers().find(s => s.id === id)) [Signal-based]
    ↓
    Uses @if/@else control flow for conditional rendering
    ↓
    Display server details:
    - Real-time uptime timer
    - Usage cost calculation
    - Power controls (mock mode only)
    - Backup management
    - Traffic monitoring
```

## **🔧 Error Handling & Recovery Flow**

```
API Call Fails:
    ↓
    Catch error → catchError((err: HttpErrorResponse))
    ↓
    Log warning → console.warn('Server loading failed:', err.message)
    ↓
    Set error signal → error.set(errorMessage)
    ↓
    Return empty array → of([])
    ↓
    Continue with empty data (don't switch modes)
    ↓
    User can retry → api.retry() method available
```

## **💾 Data Persistence Flow**

```
localStorage (Persistent across browser sessions):
    - CACHE_KEYS.MODE: ApiMode ('mock' | 'real')

sessionStorage (Cleared on browser close):
    - CACHE_KEYS.TOKEN: API authentication token
    - CACHE_KEYS.USER_SERVERS: User-created servers (mock mode)
    - CACHE_KEYS.MOCK_SERVERS: Modified mock data (cleared on startup)
```

## **⚡ Real-time Features Flow**

### **Usage Cost Calculation:**
```
Server Detail Page → calculateCurrentUsage()
    ↓
    Get monthly price → api.getServerPrice(server)
    ↓
    Convert to hourly → monthlyPrice / (30 * 24)
    ↓
    Calculate runtime → now - server.created
    ↓
    Calculate cost → hourlyPrice * runtimeHours
    ↓
    Apply minimum → Math.max(0.01, usageCost)
```

### **Uptime Timer:**
```
Server Detail Page → initializeTimer()
    ↓
    Check if server running → server.status === 'running'
    ↓
    Start interval → setInterval(1000ms)
    ↓
    Update display → formatUptime(now - server.created)
    ↓
    Auto-cleanup → clearInterval on destroy
```

## **🎯 Angular 20 Signals & Computed Properties Flow**

```
HetznerApiService Angular 20 signals:
    ↓
    servers() → Raw server data from API/mock [WritableSignal<Server[]>]
    ↓
    myServers() → computed(() => servers().filter(s => s.status !== 'available')) [Computed Signal]
    ↓
    availableServerTypes() → computed(() => serverTypes().filter(s => s.status === 'available')) [Computed Signal]
    ↓
    Standalone Components subscribe → Reactive updates throughout UI
    ↓
    OnPush change detection → Optimized performance
```

## **🚨 Angular 20 Error States & Loading Flow**

```
Component State Management (OnPush Strategy):
    ↓
    loading() → Shows spinner/loading message [@if control flow]
    ↓
    error() → Shows error message with retry option [@if control flow]
    ↓
    !server() && !loading() && !error() → Shows "Server Not Found" [@if/@else control flow]
    ↓
    server() exists → Shows normal content [Signal-based reactivity]
```

## **📱 Angular 20 Responsive UI Flow**

```
Screen Size Detection (Tailwind CSS Integration):
    ↓
    Desktop (md+) → Table layout with sortable columns [@for control flow]
    ↓
    Mobile (sm) → Card-based layout with stacked information [@for control flow]
    ↓
    CSS Grid → Responsive layouts adapt automatically
    ↓
    Angular 20 Signals → Reactive updates without subscriptions
```

## **🔐 Authentication Flow (API Mode)**

```
Settings Dialog → Enter API Token
    ↓
    Store token → sessionStorage.setItem(CACHE_KEYS.TOKEN, token)
    ↓
    API calls include → headers: { 'Authorization': 'Bearer ' + token }
    ↓
    Invalid token → HTTP 401/403 errors shown in UI
    ↓
    Valid token → Data loads successfully
```

## **🔄 Page Refresh Persistence Flow**

```
User refreshes page while in API mode:
    ↓
    App re-initializes → HetznerApiService.constructor()
    ↓
    Load persisted mode → getPersistedMode() from localStorage
    ↓
    Mode signal initializes → signal<ApiMode>(persistedMode)
    ↓
    API token restored → sessionStorage.getItem(CACHE_KEYS.TOKEN)
    ↓
    Data loads from correct source → loadServers() in API mode
    ↓
    Server detail page finds server → computed server property
    ↓
    No mode switching → Maintains user's choice
```

## **📊 Angular 20 Data Architecture**

### **Service Layer (Angular 20 Signals):**
- `HetznerApiService`: Central data management with WritableSignals
- Mode-aware data loading (mock vs real API)
- Signal-based reactive state management (no RxJS subscriptions needed)
- Persistent settings with localStorage
- Extracted TypeScript models in `/core/models/`

### **Component Layer (Standalone Components):**
- `ServersPage`: Available server types [Standalone Component]
- `MyServersPage`: Running server instances [Standalone Component]
- `ServerDetailPage`: Individual server management [Standalone Component]
- `SettingsDialog`: Mode and token configuration [Standalone Component]
- All components use OnPush change detection strategy

### **Data Models (TypeScript 5.9):**
```typescript
// Extracted to /core/models/server.model.ts
interface Server {
  id: number;
  name: string;
  status: ServerStatus; // Union type
  server_type?: ServerType;
  datacenter?: Datacenter;
  public_net?: PublicNetwork;
  created?: string;
  priceEur?: number; // Computed property
}

// Additional model files:
// - api.model.ts: ApiMode, CACHE_KEYS, HetznerApiState, DEFAULT_INCLUDED_TRAFFIC
// - ui.model.ts: SortDirection, StatusFilter, DialogState, SortState
// - index.ts: Centralized exports for easy importing
```

## **🎨 Angular 20 UI State Management**

```
Angular 20 Signals → Reactive UI Updates (No Subscriptions Needed)
    ↓
    API Service signals change → Standalone Components automatically update
    ↓
    Computed properties recalculate → UI reflects new state via OnPush
    ↓
    New @if/@for control flow → Cleaner template syntax
    ↓
    No manual subscriptions needed → Simplified state management
    ↓
    TypeScript 5.9 strong typing → Better IDE support and fewer runtime errors
```

## **🔧 Angular 20 Development Features**

### **Mock Mode Benefits:**
- Offline development capability with Angular 20 dev server
- Safe testing environment with TypeScript compile-time checks
- User-created server persistence via sessionStorage
- Full CRUD operations available with signal-based reactivity

### **API Mode Benefits:**
- Real data from Hetzner Cloud API v1
- Live server monitoring with Angular 20 signals
- Accurate pricing and usage with strongly-typed models
- Read-only safety with TypeScript interface enforcement

### **Angular 20 Specific Features:**
- **Standalone Components**: No NgModules required
- **New Control Flow**: @if, @for, @switch syntax
- **Signals**: Reactive state without RxJS complexity
- **OnPush Everywhere**: Optimized change detection by default
- **Extracted Models**: TypeScript interfaces in dedicated files (`/core/models/`)
- **Method Extraction**: Refactored service methods for better maintainability
- **Cache Constants**: Centralized cache key management with CACHE_KEYS

## **🚦 Angular 20 Error Recovery Mechanisms**

1. **Mode Persistence**: API mode survives page refreshes via localStorage
2. **Graceful Degradation**: API errors don't break the app (signal-based error handling)
3. **Manual Retry**: Users can retry failed operations with dedicated service methods
4. **Clear Error Messages**: Specific feedback for different failure types using TypeScript unions
5. **Loading States**: Visual feedback during data operations via loading signals
6. **TypeScript Safety**: Compile-time error prevention with extracted model interfaces
7. **OnPush Performance**: Minimal change detection cycles for better performance

This flow ensures a robust, user-friendly experience with proper state management, error handling, and persistence across browser sessions using Angular 20's latest features! 🎉