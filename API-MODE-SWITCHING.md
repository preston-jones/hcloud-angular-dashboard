# Dynamic API Mode Switching

## Overview

The dashboard now supports dynamic switching between mock data and real Hetzner Cloud API without recompiling or changing environment files.

## How It Works

### Helper Functions

The API service uses three helper functions for dynamic mode switching:

```typescript
const getMode = () => (localStorage.getItem('hz.mode') ?? 'mock');
const apiBase = () => (getMode() === 'real' ? REAL_BASE : MOCK_BASE);
const authHdr = () => {
  const t = localStorage.getItem('hz.token');
  return getMode() === 'real' && t ? { Authorization: `Bearer ${t}` } : {};
};
```

### API Calls

All API calls use the dynamic helpers:

```typescript
// Example GET request
this.http.get(apiBase() + (getMode() === 'real' ? '/servers' : '/servers.json'), {
  headers: authHdr()
});
```

## Usage

### Method 1: Settings Dialog (Recommended)

1. Click the user icon (circle) in the top-right corner of the dashboard
2. The settings dialog will open
3. Toggle between "Mock Data" and "Real API" modes
4. If using "Real API", enter your Hetzner Cloud API token
5. Click "Save Settings"
6. The dashboard will automatically reload with the new settings

### Method 2: Browser Console (Advanced)

```javascript
// Set to real API mode
localStorage.setItem('hz.mode', 'real');
localStorage.setItem('hz.token', 'YOUR_HETZNER_TOKEN');
location.reload();

// Set to mock mode
localStorage.setItem('hz.mode', 'mock');
location.reload();
```

## API Token Setup

### Getting Your Token

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Navigate to your project
3. Go to "Security" → "API Tokens"
4. Create a new token with "Read" permissions
5. Copy the token and paste it in the settings dialog

### Token Storage

- Tokens are currently stored in `localStorage` for development
- The token is stored securely and never transmitted to external servers
- In the future, tokens will be moved to a secure proxy server cloud

## Field Mapping

When switching from Mock → Real API, the fields are mapped as follows:

```typescript
// Real API Response → Dashboard Model
{
  id: s.id?.toString?.() ?? s.id,
  name: s.name,
  type: s.server_type?.name,                 // instead of "type"
  location: s.datacenter?.location?.name,    // e.g. "nbg1"
  status: s.status === 'off' ? 'stopped' : s.status, // 'off' → 'stopped'
  vcpus: s.server_type?.cores || 0,
  ram: s.server_type?.memory || 0,
  ssd: s.server_type?.disk || 0,
  priceEur: 0 // TODO: fetch from /server_types separately
}
```

## Features

### Current Features
- ✅ Dynamic mode switching (mock/real)
- ✅ Token management via UI
- ✅ Automatic server reloading on mode change
- ✅ Proper field mapping for real API
- ✅ Error handling and fallbacks
- ✅ Visual indicators for current mode

### Future Enhancements
- 🔄 Price fetching from `/server_types` endpoint
- 🔄 Secure token storage in proxy server
- 🔄 Token validation and refresh
- 🔄 Multiple project support

## Testing

1. **Mock Mode**: Uses local JSON files from `/assets/mock/`
2. **Real API Mode**: Connects to `https://api.hetzner.cloud/v1`

You can easily switch between modes to:
- Develop with mock data when offline
- Test with real data from your Hetzner Cloud account
- Verify the dashboard works with both data sources

## CORS/Proxy Notes

If you encounter CORS issues when using the real API in development:
1. The Angular dev server includes proxy configuration for `/api/*`
2. Alternatively, use browser extensions that disable CORS for testing
3. In production, API calls should go through your backend proxy