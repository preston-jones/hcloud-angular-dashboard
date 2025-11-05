# Mode-Based Server Filtering Test

## Test Implementation

The solution implements mode-aware server filtering in the `DataStorageService.getServers()` method:

```typescript
getServers(mode?: 'mock' | 'real'): Server[] {
  try {
    // Get API servers (mock or real)
    const apiServers = sessionStorage.getItem(CACHE_KEYS.SERVERS);
    const servers = apiServers ? JSON.parse(apiServers) : [];
    
    // In live/real mode, only return API servers
    if (mode === 'real') {
      return servers;
    }
    
    // In mock mode or when mode is not specified, combine with user-created servers
    const userServers = sessionStorage.getItem('user-servers');
    const userCreatedServers = userServers ? JSON.parse(userServers) : [];
    
    // Combine both arrays, with user-created servers first (most recent)
    return [...userCreatedServers, ...servers];
  } catch {
    return [];
  }
}
```

## Test Scenarios

### 1. Live Mode (mode === 'real')
- **Expected**: Only API servers from 'hetzner_servers' key
- **Behavior**: User-created servers from 'user-servers' key are ignored
- **Use Case**: Production environment with real Hetzner API

### 2. Mock Mode (mode === 'mock') 
- **Expected**: Combined servers (user-created + API mock servers)
- **Behavior**: User-created servers appear first, followed by mock API servers
- **Use Case**: Development/demo environment

### 3. No Mode Specified (backwards compatibility)
- **Expected**: Combined servers (same as mock mode)
- **Behavior**: Maintains existing functionality for any code not passing mode
- **Use Case**: Backwards compatibility

## Implementation Details

1. **API Service Integration**: All calls to `storage.getServers()` in `HetznerApiService` now pass `this.mode()`

2. **Storage Operations**: 
   - `addServer()`: Adds only to user-created servers ('user-servers' key)
   - `updateServer()`: Searches both API and user-created servers
   - `deleteServer()`: Searches both API and user-created servers

3. **Session Storage Keys**:
   - `'hetzner_servers'`: API servers (mock or real)
   - `'user-servers'`: User-created servers from wizard

## Verification Steps

1. Switch to live mode → Should only show API servers
2. Create server in mock mode → Should save to 'user-servers' and appear in list
3. Switch back to live mode → User-created servers should not appear
4. API server operations (update/delete) → Should work correctly in both modes

This ensures clean separation between real API data and demo/user-created data.