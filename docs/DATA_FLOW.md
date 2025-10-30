# Hetzner Cloud Angular Dashboard - Data Flow Documentation

## **🚀 Application Initialization Flow**

```
1. App Starts
   ↓
2. HetznerApiService Constructor
   ↓
3. Load Persisted Mode (localStorage)
   ↓
4. Initialize Signals with Persisted Mode
   ↓
5. Load Data (servers, server types, locations)
```

## **📊 Data Loading Flow**

```
App Start → HetznerApiService.constructor()
    ↓
    Clear old cache → sessionStorage.removeItem()
    ↓
    Load persisted mode → getPersistedMode() from localStorage
    ↓
    Initialize mode signal → signal<'mock' | 'real'>(persistedMode)
    ↓
    Auto-load data → loadServers() + loadServerTypes() + loadLocations()
    ↓
    Check current mode:
    
    IF mode === 'mock':
        → Load from /assets/mock/*.json
        → Merge with user-created servers from sessionStorage
        → Allow write operations (create/delete servers)
    
    IF mode === 'real':
        → Load from Hetzner Cloud API
        → Use Bearer token authentication
        → Read-only mode (display actual servers)
```

## **🔄 Mode Switching Flow**

```
User clicks settings → Opens SettingsDialog
    ↓
    Changes mode (Mock ↔ API)
    ↓
    Calls api.setMode(newMode)
    ↓
    Updates mode signal → mode.set(newMode)
    ↓
    Persists to localStorage → persistMode(newMode)
    ↓
    Clears caches → sessionStorage.removeItem()
    ↓
    Reloads data → loadServers() with new mode
```

## **🖥️ Page Navigation Flow**

### **Server List Pages:**
```
/servers (Available) → ServersPage
    ↓
    Uses api.availableServerTypes()
    ↓
    Shows server configurations for creation
    ↓
    Location shows "All Locations" (not specific datacenter)

/my-servers → MyServersPage  
    ↓
    Uses api.myServers()
    ↓
    Shows actual running server instances
    ↓
    Location shows specific datacenter/city
```

### **Server Detail Page:**
```
/servers/:id → ServerDetailPage
    ↓
    Get ID from route → route.snapshot.paramMap.get('id')
    ↓
    Find server → computed(() => api.myServers().find(s => s.id === id))
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
    - hetzner_api_mode: 'mock' | 'real'

sessionStorage (Cleared on browser close):
    - hz.token: API authentication token
    - hetzner_user_servers: User-created servers (mock mode)
    - hetzner_mock_servers: Modified mock data (cleared on startup)
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

## **🎯 Key Computed Properties Flow**

```
HetznerApiService signals:
    ↓
    servers() → Raw server data from API/mock
    ↓
    myServers() → computed(() => servers().filter(s => s.status !== 'available'))
    ↓
    availableServerTypes() → computed(() => serverTypes().filter(s => s.status === 'available'))
    ↓
    Components subscribe → Reactive updates throughout UI
```

## **🚨 Error States & Loading Flow**

```
Component State Management:
    ↓
    loading() → Shows spinner/loading message
    ↓
    error() → Shows error message with retry option
    ↓
    !server() && !loading() && !error() → Shows "Server Not Found"
    ↓
    server() exists → Shows normal content
```

## **📱 Responsive UI Flow**

```
Screen Size Detection:
    ↓
    Desktop (md+) → Table layout with sortable columns
    ↓
    Mobile (sm) → Card-based layout with stacked information
    ↓
    CSS Grid → Responsive layouts adapt automatically
```

## **🔐 Authentication Flow (API Mode)**

```
Settings Dialog → Enter API Token
    ↓
    Store token → sessionStorage.setItem('hz.token', token)
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
    Mode signal initializes → signal<'mock' | 'real'>(persistedMode)
    ↓
    API token restored → sessionStorage.getItem('hz.token')
    ↓
    Data loads from correct source → loadServers() in API mode
    ↓
    Server detail page finds server → computed server property
    ↓
    No mode switching → Maintains user's choice
```

## **📊 Data Architecture**

### **Service Layer:**
- `HetznerApiService`: Central data management
- Mode-aware data loading (mock vs real API)
- Signal-based reactive state management
- Persistent settings with localStorage

### **Component Layer:**
- `ServersPage`: Available server types
- `MyServersPage`: Running server instances  
- `ServerDetailPage`: Individual server management
- `SettingsDialog`: Mode and token configuration

### **Data Models:**
```typescript
interface Server {
  id: number;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'available';
  server_type?: ServerType;
  datacenter?: Datacenter;
  public_net?: PublicNetwork;
  created?: string;
  priceEur?: number; // Computed property
}
```

## **🎨 UI State Management**

```
Angular Signals → Reactive UI Updates
    ↓
    API Service signals change → Components automatically update
    ↓
    Computed properties recalculate → UI reflects new state
    ↓
    No manual subscriptions needed → Simplified state management
```

## **🔧 Development Features**

### **Mock Mode Benefits:**
- Offline development capability
- Safe testing environment
- User-created server persistence
- Full CRUD operations available

### **API Mode Benefits:**
- Real data from Hetzner Cloud
- Live server monitoring
- Accurate pricing and usage
- Read-only safety

## **🚦 Error Recovery Mechanisms**

1. **Mode Persistence**: API mode survives page refreshes
2. **Graceful Degradation**: API errors don't break the app
3. **Manual Retry**: Users can retry failed operations
4. **Clear Error Messages**: Specific feedback for different failure types
5. **Loading States**: Visual feedback during data operations

This flow ensures a robust, user-friendly experience with proper state management, error handling, and persistence across browser sessions! 🎉