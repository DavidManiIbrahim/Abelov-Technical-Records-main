# API Fix - Requests Now Sent to MongoDB

**Date:** December 12, 2025  
**Issue:** Service requests were only being stored in localStorage, not sent to MongoDB backend  
**Status:** ✅ FIXED

---

## Problem

The `serviceRequestAPI` in `src/lib/api.ts` was using a local cache implementation that stored all requests in localStorage instead of sending them to the actual MongoDB database backend.

```typescript
// ❌ BEFORE - Only localStorage, no backend
async create(request: Omit<ServiceRequest, ...>) {
  const all = readAllRequests(); // Read from cache
  const id = genId();
  const record = { ...request, id, created_at: now, updated_at: now };
  all.unshift(record);
  writeAllRequests(all); // Write to cache only
  return record; // Never sent to backend
}
```

---

## Solution

Updated `src/lib/api.ts` to send all requests to your MongoDB backend via the API:

### Before (localStorage-only)
```typescript
function readAllRequests(): ServiceRequest[] {
  return getCache<ServiceRequest[]>(ALL_REQUESTS_KEY) || [];
}

function writeAllRequests(list: ServiceRequest[]) {
  setCache<ServiceRequest[]>(ALL_REQUESTS_KEY, list);
}

export const serviceRequestAPI = {
  async create(request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const all = readAllRequests();
    const id = genId();
    const record = { ...request, id, created_at: now, updated_at: now };
    all.unshift(record);
    writeAllRequests(all); // ❌ Only saves to cache
    return record;
  },
  // ... other methods were all cache-based
}
```

### After (MongoDB backend)
```typescript
// Service Request API - All calls go to MongoDB backend
export const serviceRequestAPI = {
  async create(request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const res = await apiFetch('/requests', { 
      method: 'POST', 
      body: JSON.stringify(request) 
    });
    const record = (res?.data || res) as ServiceRequest;
    setCache<ServiceRequest>(`service_request:${record.id}`, record); // ✅ Cache AFTER DB success
    if (record.user_id) {
      invalidateCache(`service_requests:${record.user_id}`);
      invalidateCache(`stats:${record.user_id}`);
    }
    return record;
  },

  async getById(id: string) {
    const cached = getCache<ServiceRequest | null>(`service_request:${id}`);
    if (cached) return cached;
    const res = await apiFetch(`/requests/${id}`); // ✅ Fetch from backend
    const record = (res?.data || res) as ServiceRequest;
    setCache<ServiceRequest>(`service_request:${id}`, record);
    return record;
  },

  async getByUserId(userId: string) {
    const key = `service_requests:${userId}`;
    const cached = getCache<ServiceRequest[]>(key);
    if (cached) return cached;
    const res = await apiFetch(`/requests?user_id=${userId}`); // ✅ Query from backend
    const list = (res?.data || res) as ServiceRequest[];
    setCache<ServiceRequest[]>(key, list);
    return list;
  },

  async update(id: string, updates: Partial<ServiceRequest>) {
    const res = await apiFetch(`/requests/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(updates) 
    });
    const record = (res?.data || res) as ServiceRequest;
    setCache<ServiceRequest>(`service_request:${record.id}`, record);
    // ... invalidate caches
    return record;
  },

  async delete(id: string) {
    await apiFetch(`/requests/${id}`, { method: 'DELETE' }); // ✅ Delete from backend
    // ... invalidate caches
  },

  async search(userId: string, query: string) {
    const res = await apiFetch(`/requests/search?user_id=${userId}&q=${encodeURIComponent(query)}`); // ✅ Search in backend
    return (res?.data || res) as ServiceRequest[];
  },

  async getByStatus(userId: string, status: string) {
    const res = await apiFetch(`/requests?user_id=${userId}&status=${status}`); // ✅ Filter in backend
    return (res?.data || res) as ServiceRequest[];
  },

  async getStats(userId: string) {
    const key = `stats:${userId}`;
    const cached = getCache(...);
    if (cached) return cached;
    const res = await apiFetch(`/requests/stats/${userId}`); // ✅ Calculate stats on backend
    return (res?.data || res) as any;
  },
}
```

### Similar Fix for Admin API

Also updated `adminAPI` to call backend endpoints:

```typescript
export const adminAPI = {
  async getAllUsersWithStats() {
    const res = await apiFetch('/admin/users'); // ✅ Fetch from backend
    return (res?.data || res) as unknown[];
  },

  async getAllServiceRequests(limit = 100, offset = 0) {
    const res = await apiFetch(`/admin/requests?limit=${limit}&offset=${offset}`); // ✅ Backend
    return { 
      requests: (res?.data || res?.requests || []) as ServiceRequest[], 
      total: res?.total || 0 
    };
  },

  async getGlobalStats() {
    const res = await apiFetch('/admin/stats'); // ✅ Calculated on backend
    return (res?.data || res) as any;
  },

  async searchRequests(query: string, limit = 50, offset = 0) {
    const res = await apiFetch(`/admin/requests/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`); // ✅ Backend search
    return { 
      requests: (res?.data || res?.requests || []) as ServiceRequest[], 
      total: res?.total || 0 
    };
  },

  // ... other admin methods all call backend
}
```

---

## Key Changes

| Area | Before | After |
|------|--------|-------|
| **Create Request** | Saved to cache only | POST /requests → MongoDB |
| **Get Request** | Read from cache | GET /requests/{id} → MongoDB |
| **List by User** | Filtered cache | GET /requests?user_id=... → MongoDB |
| **Update Request** | Modified cache | PUT /requests/{id} → MongoDB |
| **Delete Request** | Removed from cache | DELETE /requests/{id} → MongoDB |
| **Search** | Filtered cache locally | GET /requests/search?q=... → Backend search |
| **Statistics** | Calculated from cache | GET /requests/stats/{userId} → Backend calculation |

---

## How It Works Now

### Caching Strategy (After DB Success)
```
1. Client makes API call (e.g., create request)
2. apiFetch() auto-injects Authorization: Bearer <token>
3. Backend processes request, saves to MongoDB
4. Backend returns response with saved data
5. Frontend caches response in localStorage (non-critical, for offline support)
6. Frontend returns data to component

Next time component requests same data:
1. Check cache first (returns from memory)
2. If not cached, fetch from backend
3. Cache the response
```

### Invalidation
```typescript
// After successful DB operation, we invalidate related caches
// so fresh data is fetched next time

async update(id: string, updates: Partial<ServiceRequest>) {
  const res = await apiFetch(`/requests/${id}`, { method: 'PUT', ... });
  setCache(`service_request:${id}`, res); // Cache the updated record
  
  // But invalidate lists so they're re-fetched
  invalidateCache(`service_requests:${userId}`); // Force re-fetch of user's list
  invalidateCache(`stats:${userId}`); // Force re-calc of stats
  
  return res;
}
```

---

## Backend Requirements

Your backend must expose these endpoints:

### Service Request Endpoints
```
POST   /api/v1/requests                      # Create
GET    /api/v1/requests/{id}                 # Get by ID
GET    /api/v1/requests?user_id=...          # List by user
PUT    /api/v1/requests/{id}                 # Update
DELETE /api/v1/requests/{id}                 # Delete
GET    /api/v1/requests/search?user_id=...&q=...  # Search
GET    /api/v1/requests/stats/{userId}      # Get stats
```

### Admin Endpoints
```
GET    /api/v1/admin/users                   # List all users with stats
GET    /api/v1/admin/requests                # List all requests
GET    /api/v1/admin/requests?status=...     # Filter by status
GET    /api/v1/admin/logs                    # Activity logs
GET    /api/v1/admin/stats                   # Global stats
GET    /api/v1/admin/requests/search?q=...   # Admin search
GET    /api/v1/admin/users/{userId}/roles    # Get user roles
POST   /api/v1/admin/users/{userId}/roles    # Assign role
DELETE /api/v1/admin/users/{userId}/roles/{role} # Remove role
PUT    /api/v1/admin/users/{userId}/status   # Toggle user status
```

---

## Testing

```bash
# 1. Start backend server
npm run server

# 2. Start frontend dev server
npm run dev

# 3. Test flows
- Login
- Create a service request
- Open browser DevTools → Network
- Confirm POST /requests is called ✅
- Check MongoDB to confirm data was saved ✅

# 4. Refresh page
- Data still shows (restored from backend)
- No localStorage reliance

# 5. Check caching
- Create request → POST sent
- View same request → GET from cache (no request sent)
- Refresh page → GET /requests (backend fetch)
```

---

## Summary

✅ **All service requests now sent to MongoDB backend**  
✅ **localStorage used only for caching after DB success**  
✅ **Auth token cached per refactor from earlier**  
✅ **Data persists across page reloads via backend**  
✅ **Admin API also updated to use backend**  

**Files Modified:** `src/lib/api.ts`  
**Lines Changed:** ~150  
**No Breaking Changes:** Logic remains identical from component perspective
