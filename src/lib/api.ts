import { ServiceRequest } from '@/types/database';
import { getCache, setCache, invalidateCache } from '@/utils/storage';

// Local storage key to keep all requests
const ALL_REQUESTS_KEY = 'requests:all';

const genId = () => `sr_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

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
    const now = new Date().toISOString();
    const record = { ...(request as ServiceRequest), id, created_at: now, updated_at: now } as ServiceRequest;
    all.unshift(record);
    writeAllRequests(all);
    setCache<ServiceRequest>(`service_request:${record.id}`, record);
    if (record.user_id) {
      const listKey = `service_requests:${record.user_id}`;
      const cached = getCache<ServiceRequest[]>(listKey) || [];
      setCache(listKey, [record, ...cached]);
      invalidateCache(`stats:${record.user_id}`);
    }
    return record;
  },

  async getById(id: string) {
    const cached = getCache<ServiceRequest | null>(`service_request:${id}`);
    if (cached) return cached;
    const all = readAllRequests();
    const found = all.find(r => r.id === id) || null;
    if (found) setCache<ServiceRequest>(`service_request:${id}`, found);
    return found;
  },

  async getByUserId(userId: string) {
    const key = `service_requests:${userId}`;
    const cached = getCache<ServiceRequest[]>(key);
    if (cached) return cached;
    const all = readAllRequests();
    const list = all.filter(r => r.user_id === userId);
    setCache<ServiceRequest[]>(key, list);
    return list;
  },

  async update(id: string, updates: Partial<ServiceRequest>) {
    const all = readAllRequests();
    const idx = all.findIndex(r => r.id === id);
    if (idx < 0) throw new Error('Not found');
    const existing = all[idx];
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() } as ServiceRequest;
    all[idx] = updated;
    writeAllRequests(all);
    setCache<ServiceRequest>(`service_request:${updated.id}`, updated);
    if (updated.user_id) {
      const listKey = `service_requests:${updated.user_id}`;
      const cached = getCache<ServiceRequest[]>(listKey) || [];
      const ii = cached.findIndex(r => r.id === updated.id);
      if (ii >= 0) {
        cached[ii] = updated;
        setCache(listKey, [...cached]);
      }
      invalidateCache(`stats:${updated.user_id}`);
    }
    return updated;
  },

  async delete(id: string) {
    const all = readAllRequests();
    const idx = all.findIndex(r => r.id === id);
    if (idx >= 0) {
      const removed = all.splice(idx, 1)[0];
      writeAllRequests(all);
      if (removed.user_id) {
        const listKey = `service_requests:${removed.user_id}`;
        const arr = getCache<ServiceRequest[]>(listKey) || [];
        setCache(listKey, arr.filter(r => r.id !== id));
        invalidateCache(`stats:${removed.user_id}`);
      }
    }
    invalidateCache(`service_request:${id}`);
  },

  async search(userId: string, query: string) {
    const q = query.toLowerCase();
    const all = readAllRequests();
    return all.filter(r => (
      (r.customer_name || '').toLowerCase().includes(q) ||
      (r.customer_phone || '').toLowerCase().includes(q) ||
      (r.device_brand || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q) ||
      (r.customer_email || '').toLowerCase().includes(q)
    ) && r.user_id === userId);
  },

  async getByStatus(userId: string, status: string) {
    const all = readAllRequests();
    return all.filter(r => r.user_id === userId && r.status === status);
  },

  async getStats(userId: string) {
    const all = readAllRequests();
    const byUser = all.filter(r => r.user_id === userId);
    const completed = byUser.filter(r => r.status === 'Completed').length;
    const pending = byUser.filter(r => r.status === 'Pending').length;
    const inProgress = byUser.filter(r => r.status === 'In-Progress').length;
    const totalRevenue = byUser.reduce((sum, r) => sum + (r.payment_completed ? (r.total_cost ?? 0) : (r.deposit_paid ?? 0)), 0);
    return { total: byUser.length, completed, pending, inProgress, totalRevenue };
  },
};

type UserProfile = { id: string; email: string; full_name: string | null; company_name: string | null; is_active: boolean; created_at: string };

export const adminAPI = {
  async getAllUsersWithStats() {
    // Users are currently not kept centrally; return empty list
    return [] as unknown[];
  },
  async getAllServiceRequests(limit = 100, offset = 0) {
    const list = readAllRequests();
    const sorted = list.sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));
    return { requests: sorted.slice(offset, offset + limit), total: sorted.length };
  },
  async getRequestsByStatus(status: string, limit = 100, offset = 0) {
    const list = readAllRequests();
    const filtered = list.filter(r => r.status === status).sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));
    return { requests: filtered.slice(offset, offset + limit), total: filtered.length };
  },
  async getActivityLogs(limit = 50, offset = 0) {
    return { logs: [], total: 0 };
  },
  async getGlobalStats() {
    const list = readAllRequests();
    const totalRevenue = list.reduce((sum, r) => sum + (r.payment_completed ? (r.total_cost ?? 0) : (r.deposit_paid ?? 0)), 0);
    return {
      totalUsers: 0,
      totalTickets: list.length,
      pendingTickets: list.filter(r => r.status === 'Pending').length,
      completedTickets: list.filter(r => r.status === 'Completed').length,
      inProgressTickets: list.filter(r => r.status === 'In-Progress').length,
      totalRevenue,
    };
  },
  async searchRequests(query: string, limit = 50, offset = 0) {
    const q = query.toLowerCase();
    const list = readAllRequests();
    const filtered = list.filter(r =>
      (r.customer_name ?? '').toLowerCase().includes(q) ||
      (r.customer_phone ?? '').toLowerCase().includes(q) ||
      (r.device_brand ?? '').toLowerCase().includes(q) ||
      (r.id ?? '').toLowerCase().includes(q) ||
      (r.customer_email ?? '').toLowerCase().includes(q)
    ).sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));
    return { requests: filtered.slice(offset, offset + limit), total: filtered.length };
  },
  async getUserRoles(userId: string) {
    return [] as Array<{ role: string; assigned_at: string }>;
  },
  async assignRole(userId: string, role: string) {
    return null;
  },
  async removeRole(userId: string, role: string) {
    return null;
  },
  async toggleUserStatus(userId: string, isActive: boolean) {
    return null;
  },
};
