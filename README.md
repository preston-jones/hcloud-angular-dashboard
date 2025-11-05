# Hetzner Cloud Angular Dashboard

[![Hetzner Dashboard CI](https://github.com/preston-jones/hcloud-angular-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/preston-jones/hcloud-angular-dashboard/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-20+-red.svg)](https://angular.io/)

A modern Angular 20 dashboard for managing Hetzner Cloud servers with dual-mode operation (Mock/Production).

## 🚀 Technology Stack

- **Angular 20.3** - Latest Angular with standalone components and modern features
- **TypeScript 5.9** - Strong typing and modern JavaScript features  
- **Angular Signals** - Reactive state management without RxJS complexity
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Angular Material 20** - UI component library
- **ESLint 9** - Code quality and consistency

## 🔄 Complete Data Flow Chain - Step by Step

This document provides a detailed walkthrough of how data flows through the application from the first page visit to final rendering.

### Step 1: Application Bootstrap

**What Happens:**
```
Browser loads index.html → Angular 20 starts → App component initializes → Services instantiate
```

**Code Flow:**
```typescript
// main.ts
bootstrapApplication(AppComponent, appConfig);

// App starts and creates service instances
@Injectable({ providedIn: 'root' })
export class HetznerApiService {
  constructor() {
    console.log('🚀 Service created');
    this.loadServers();  // Triggers initial data load
  }
}
```

**Result:** Service singleton created, constructor runs once

---

### Step 2: Initial Data Loading Check

**What Happens:**
```
loadServers() called → Check sessionStorage → Determine data source
```

**Code Flow:**
```typescript
loadServers(): void {
  console.log('🔄 loadServers called - Mode:', this.mode());
  
  // STEP 2A: Check if we have cached data
  if (this.mode() === 'mock') {
    const persistedData = sessionStorage.getItem(CACHE_KEYS.MOCK_SERVERS);
    if (persistedData) {
      console.log('📱 Found cached data in sessionStorage');
      const servers = JSON.parse(persistedData);
      this.servers.set(servers);  // Update signal directly
      return; // Exit early - no HTTP request needed
    }
  }
  
  // STEP 2B: No cached data, proceed to HTTP request
  console.log('🌐 No cached data, loading from source');
}
```

**First Visit Result:** No sessionStorage data exists, continues to HTTP request
**Return Visit Result:** Loads from sessionStorage, skips HTTP request

---

### Step 3: HTTP Data Request

**What Happens:**
```
Determine endpoint → Make HTTP request → Process response
```

**Code Flow:**
```typescript
// STEP 3A: Determine endpoint based on mode
const { endpoint, httpOptions } = this.prepareServerRequest();
// Mock mode: '/assets/mock/servers.json'
// Real mode: 'https://api.hetzner.cloud/v1/servers'

// STEP 3B: Make HTTP request
console.log('Loading servers from:', endpoint);
this.http.get<any>(endpoint, httpOptions).pipe(
  map(response => this.processServerResponse(response)),
  catchError(error => this.handleServerError(error))
)
```

**Result:** HTTP request made to appropriate endpoint

---

### Step 4: Response Processing and Signal Update

**What Happens:**
```
HTTP response arrives → Extract servers → Update signal → Cache in sessionStorage
```

**Code Flow:**
```typescript
.subscribe(servers => {
  console.log('Servers loaded:', servers.length);
  
  // STEP 4A: Update Angular signal (triggers reactivity)
  this.finalizeServerLoad(servers);
  // servers signal now contains: [
  //   { id: '4711', name: 'web-frontend-1', status: 'running' },
  //   { id: '4712', name: 'database-prod', status: 'running' },
  //   { id: '4713', name: 'api-backend', status: 'stopped' }
  // ]
  
  // STEP 4B: Cache in sessionStorage (mock mode only)
  console.log('💾 Cached servers in sessionStorage');
  
  this.loading.set(false);
});
```

**Result:** 
- Signal contains server data
- SessionStorage has cached copy (mock mode)
- UI will automatically update

---

### Step 5: Computed Signal Recalculation

**What Happens:**
```
servers signal changes → Computed signals recalculate → Components get new data
```

**Code Flow:**
```typescript
// This computed signal automatically recalculates when servers signal changes
myServers = computed(() => {
  console.log('🔄 myServers computed - recalculating');
  const allServers = this.servers();  // Read from servers signal
  
  if (!allServers) return [];
  
  // Filter out server types (status: 'available'), keep actual servers
  const myActualServers = allServers.filter(s => s.status !== 'available');
  console.log('👥 My servers count:', myActualServers.length);
  
  return myActualServers;
});
```

**Signal Dependency Chain:**
```
servers signal changes
    ↓
myServers computed recalculates  
    ↓
Components reading myServers get notified
    ↓
Templates re-render automatically
```

**Result:** Derived data (myServers) automatically updates

---

### Step 6: Component Data Binding

**What Happens:**
```
Component reads from service signals → Templates bind to data → Change detection runs
```

**Code Flow:**
```typescript
// In component
@Component({
  selector: 'app-my-servers',
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimized change detection
})
export class MyServersPageComponent {
  private api = inject(HetznerApiService);
  
  // STEP 6A: Direct signal binding (no subscriptions needed)
  servers = this.api.myServers;     // Points to computed signal
  loading = this.api.loading;       // Points to loading signal
  error = this.api.error;           // Points to error signal
  
  // These are reactive - when signals change, template updates automatically
}
```

**Signal Connection:**
```
Service Signal ←→ Component Property ←→ Template Binding
     ↓                    ↓                   ↓
  servers.set()      this.servers       {{ servers() }}
```

**Result:** Component has live connection to service data

---

### Step 7: Template Rendering

**What Happens:**
```
Angular change detection → Read signal values → Update DOM → Display to user
```

**Template Code:**
```html
<!-- STEP 7A: Conditional rendering based on state -->
@if (loading()) {
  <div class="loading">Loading servers...</div>
} @else if (error()) {
  <div class="error">{{ error() }}</div>
} @else {
  <!-- STEP 7B: Loop through servers with tracking -->
  @for (server of servers(); track server.id) {
    <div class="server-card">
      <h3>{{ server.name }}</h3>
      <span class="status-{{ server.status }}">{{ server.status }}</span>
      <button (click)="deleteServer(server.id)">Delete</button>
    </div>
  }
}
```

**Rendering Process:**
```
1. Angular reads signal values: servers(), loading(), error()
2. Evaluates conditions: @if, @else
3. Loops through data: @for
4. Creates DOM elements for each server
5. Sets up event listeners: (click)
6. Displays final UI to user
```

**Result:** User sees server list with interactive buttons

---

### Step 8: User Interaction (Delete Server)

**What Happens:**
```
User clicks delete → Confirmation → Service method → Signal update → UI refresh
```

**Code Flow:**
```typescript
// STEP 8A: User clicks delete button
<button (click)="deleteServer('4711')">Delete</button>

// STEP 8B: Component method calls service
deleteServer(id: string): void {
  this.api.deleteServer(id);
}

// STEP 8C: Service processes deletion
deleteServer(serverId: string): void {
  console.log('🗑️ Delete server:', serverId);
  
  // Get current data from signal
  const currentServers = this.servers();  // [4711, 4712, 4713]
  
  // Filter out deleted server
  const filteredServers = currentServers.filter(s => s.id !== serverId);
  // Result: [4712, 4713]
  
  // Update signal (triggers automatic UI update)
  this.servers.set(filteredServers);
  
  // Update sessionStorage cache
  sessionStorage.setItem(CACHE_KEYS.MOCK_SERVERS, JSON.stringify(filteredServers));
  console.log('💾 Deletion cached in sessionStorage');
}
```

**Reactive Update Chain:**
```
servers.set([4712, 4713])
    ↓
myServers computed recalculates → returns [4712, 4713]
    ↓
Component.servers automatically gets new value
    ↓
Template re-renders → Server 4711 disappears from UI
```

**Result:** Server immediately disappears from UI, change persisted

---

### Step 9: Navigation to Another Page

**What Happens:**
```
User navigates → Component destroys → New component creates → Reads existing data
```

**Code Flow:**
```typescript
// STEP 9A: User navigates (e.g., to dashboard)
this.router.navigate(['/dashboard']);

// STEP 9B: Old component destroys (automatic cleanup)
// No manual cleanup needed - signals handle this automatically

// STEP 9C: New component initializes
@Component({...})
export class DashboardComponent {
  private api = inject(HetznerApiService); // Same service instance
  
  // STEP 9D: Connect to existing signals
  servers = this.api.myServers; // Gets current data [4712, 4713]
  
  ngOnInit() {
    // No need to load data - service already has it
    console.log('Dashboard loaded, servers:', this.servers().length);
  }
}
```

**State Preservation:**
```
Service (Singleton)
├── servers signal: [4712, 4713] ✓ Preserved
├── sessionStorage: [4712, 4713] ✓ Preserved  
└── loading state: false ✓ Preserved
```

**Result:** Navigation is instant, no data loss, no reloading

---

### Step 10: Return to Original Page

**What Happens:**
```
Navigate back → Component creates → Service still exists → Loads from sessionStorage
```

**Code Flow:**
```typescript
// STEP 10A: User returns to servers page
this.router.navigate(['/servers']);

// STEP 10B: MyServersPageComponent initializes again
ngOnInit() {
  // Component reconnects to service signals
  this.servers = this.api.myServers; // Still [4712, 4713]
}

**Code Flow:**
```typescript
// STEP 10C: If loadServers() is called for any reason
loadServers(): void {
  // Check sessionStorage first
  const cached = sessionStorage.getItem(CACHE_KEYS.MOCK_SERVERS);
  if (cached) {
    console.log('📱 Loading from cache, no HTTP request needed');
    const servers = JSON.parse(cached); // [4712, 4713]
    this.servers.set(servers);
    return; // Early exit - no JSON file loaded
  }
  
  // This path is not taken because we have cached data
}
```

**Performance Benefits:**
```
❌ Without caching: HTTP request → 200ms delay → UI shows loading
✅ With caching: Instant load → 0ms delay → UI shows immediately
```

**Result:** Instant page load, deleted server still gone, no unwanted data resets

---

### Step 11: Mode Switching

**What Happens:**
```
User switches modes → Clear cache → Reload from new source → Update UI
```

**Code Flow:**
```typescript
// STEP 11A: User switches from mock to real mode
setMode(newMode: ApiMode): void {
  console.log('🔄 Switching to real mode');
  
  // Update mode signal
  this.mode.set(newMode);
  
  // Clear mock data cache
  sessionStorage.removeItem(CACHE_KEYS.MOCK_SERVERS);
  console.log('🗑️ Cleared mock cache');
  
  // Reload data from new source
  this.loadServers(); // Now hits real API
}

// STEP 11B: loadServers() in real mode
loadServers(): void {
  // No sessionStorage check in real mode
  const { endpoint, httpOptions } = this.prepareServerRequest();
  
  this.http.get(endpoint, httpOptions).subscribe(servers => {
    this.finalizeServerLoad(servers); // Real server data
    // No sessionStorage caching in real mode
  });
}
```

**Mode Transition:**
```
Mock Mode: [4712, 4713] (cached, modified)
    ↓ (switch mode)
Real Mode: [real-1, real-2, real-3] (fresh from API)
```

**Result:** Clean transition, real data loaded, no cache pollution

---

## 📊 Data Reading/Writing Summary

### Reading Priority (Top to Bottom)
```
1. Angular Signal (RAM)           → Instant access
   └── servers.set() / servers()

2. SessionStorage (Browser)       → Very fast
   └── sessionStorage.getItem(CACHE_KEYS.MOCK_SERVERS)

3. JSON Files (Static Assets)     → Fast (cached by browser)
   └── /assets/mock/servers.json

4. Real API (Network)            → Slower
   └── https://api.hetzner.cloud/v1/servers
```

### Writing Strategy
```
Mock Mode:
1. Update Angular Signal          → Immediate UI update
2. Update SessionStorage         → Persist for navigation

Real Mode:
1. Make API Call                 → Update server
2. Update Signal on success      → Reflect server state
```

### Reactivity Chain
```
Data Source → HTTP Client → Service Signal → Computed Signal → Component → Template → DOM → User
```

### Performance Optimizations
- **Angular 20 Signals**: Only update when data actually changes
- **SessionStorage**: Eliminates redundant HTTP requests  
- **OnPush**: Reduces change detection cycles
- **Computed**: Efficient derived state calculation
- **Early Returns**: Skip unnecessary processing
- **Extracted Models**: Centralized TypeScript interfaces
- **Method Extraction**: Simplified service methods for better maintainability

This step-by-step flow ensures a smooth, performant user experience with realistic demo behavior and seamless transitions between mock and production modes.

## Quick Start

### Development server
```bash
ng serve
```
Navigate to `http://localhost:4200/`

### Build
```bash
ng build
```

### Features
- **Dual Mode Operation**: Mock mode for demos, Real mode for production
- **Reactive State Management**: Angular 20 signals with computed properties
- **Persistent Demo Changes**: SessionStorage caching in mock mode
- **Modern Angular**: Standalone components, new control flow syntax (@if, @for)
- **Performance Optimized**: OnPush change detection, minimal HTTP requests
- **Type Safety**: Full TypeScript integration with extracted model interfaces

### Architecture
- **Service Layer**: `HetznerApiService` manages all data operations with Angular 20 signals
- **Component Layer**: Reactive standalone components with signal bindings
- **Data Layer**: JSON files (mock) + Real API + SessionStorage cache
- **Model Layer**: TypeScript interfaces extracted to dedicated model files
- **UI Layer**: Tailwind CSS with responsive design and modern Angular features
