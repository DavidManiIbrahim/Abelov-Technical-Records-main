import { ServiceRequest } from '@/types/database';
import { getCache, setCache, invalidateCache } from '@/utils/storage';

// Memory cache keys (in-memory cache only, no persistence)
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'https://abelov-technical-records-backend.onrender.com/api/v1';

const apiFetch = async (path: string, init?: RequestInit) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: { ...headers, ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorMsg = body?.error || body?.details || `API error ${res.status}`;
    throw new Error(errorMsg);
  }
  if (res.status === 204) return null;
  return res.json();
};

// Service Request API - All calls go to MongoDB backend
export const serviceRequestAPI = {
  async create(request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const res = await apiFetch('/requests', { 
      method: 'POST', 
      body: JSON.stringify(request) 
    });
    const record = (res?.data || res) as ServiceRequest;
    setCache<ServiceRequest>(`service_request:${record.id}`, record);
    if (record.user_id) {
      invalidateCache(`service_requests:${record.user_id}`);
      invalidateCache(`stats:${record.user_id}`);
    }
    return record;
  },

  async getById(id: string) {
    const cached = getCache<ServiceRequest | null>(`service_request:${id}`);
    if (cached) return cached;
    const res = await apiFetch(`/requests/${id}`);
    const record = (res?.data || res) as ServiceRequest;
    setCache<ServiceRequest>(`service_request:${id}`, record);
    return record;
  },

  async getByUserId(userId: string) {
    const key = `service_requests:${userId}`;
    const cached = getCache<ServiceRequest[]>(key);
    if (cached) return cached;
    const res = await apiFetch(`/requests?user_id=${userId}`);
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
    if (record.user_id) {
      invalidateCache(`service_requests:${record.user_id}`);
      invalidateCache(`stats:${record.user_id}`);
    }
    return record;
  },

  async delete(id: string) {
    await apiFetch(`/requests/${id}`, { method: 'DELETE' });
    invalidateCache(`service_request:${id}`);
    // Invalidate all related service request and stats caches
    // Note: We rely on explicit cache invalidation in the calling code
  },

  async search(userId: string, query: string) {
    const res = await apiFetch(`/requests/search?user_id=${userId}&q=${encodeURIComponent(query)}`);
    const list = (res?.data || res) as ServiceRequest[];
    return list;
  },

  async getByStatus(userId: string, status: string) {
    const res = await apiFetch(`/requests?user_id=${userId}&status=${status}`);
    const list = (res?.data || res) as ServiceRequest[];
    return list;
  },

  async getStats(userId: string) {
    const key = `stats:${userId}`;
    const cached = getCache<{ total: number; completed: number; pending: number; inProgress: number; totalRevenue: number }>(key);
    if (cached) return cached;
    const res = await apiFetch(`/requests/stats/${userId}`);
    const stats = (res?.data || res) as any;
    setCache(key, stats);
    return stats;
  },
};

type UserProfile = { id: string; email: string; full_name: string | null; company_name: string | null; is_active: boolean; created_at: string };

// Admin API - All calls go to MongoDB backend
export const adminAPI = {
  async getAllUsersWithStats() {
    const res = await apiFetch('/admin/users');
    return (res?.data || res) as unknown[];
  },

  async getAllServiceRequests(limit = 100, offset = 0) {
    const res = await apiFetch(`/admin/requests?limit=${limit}&offset=${offset}`);
    return { 
      requests: (res?.data || res?.requests || []) as ServiceRequest[], 
      total: res?.total || 0 
    };
  },

  async getRequestsByStatus(status: string, limit = 100, offset = 0) {
    const res = await apiFetch(`/admin/requests?status=${status}&limit=${limit}&offset=${offset}`);
    return { 
      requests: (res?.data || res?.requests || []) as ServiceRequest[], 
      total: res?.total || 0 
    };
  },

  async getActivityLogs(limit = 50, offset = 0) {
    const res = await apiFetch(`/admin/logs?limit=${limit}&offset=${offset}`);
    return { 
      logs: (res?.data || res?.logs || []) as any[], 
      total: res?.total || 0 
    };
  },

  async getGlobalStats() {
    const res = await apiFetch('/admin/stats');
    return res as any;
  },

  async searchRequests(query: string, limit = 50, offset = 0) {
    const res = await apiFetch(`/admin/requests/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
    return { 
      requests: (res?.data || res?.requests || []) as ServiceRequest[], 
      total: res?.total || 0 
    };
  },

  async getUserRoles(userId: string) {
    const res = await apiFetch(`/admin/users/${userId}/roles`);
    return (res?.data || res || []) as Array<{ role: string; assigned_at: string }>;
  },

  async assignRole(userId: string, role: string) {
    const res = await apiFetch(`/admin/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    return res?.data || res;
  },

  async removeRole(userId: string, role: string) {
    const res = await apiFetch(`/admin/users/${userId}/roles/${role}`, {
      method: 'DELETE',
    });
    return res?.data || res;
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    const res = await apiFetch(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
    return res?.data || res;
  },
};

// Auth API - all calls go to backend, token cached after success
export const authAPI = {
  async signup(email: string, password: string, role?: 'user' | 'admin') {
    const res = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    const user = res?.user || res;
    return user;
  },

  async login(email: string, password: string) {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const user = res?.user || res;
    return user;
  },

  async me() {
    const res = await apiFetch('/auth/me');
    const user = res?.user || res;
    return user;
  },

  async logout() {
    await apiFetch('/auth/logout', {
      method: 'POST',
    });
  },
};
