import { ServiceRequest } from '@/types/database';
import { getOrFetch, setCache, getCache, invalidateCache } from '@/utils/storage';
import { convex } from './convexClient';

export const serviceRequestAPI = {
  async create(request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const now = new Date().toISOString();
    const record = { ...request, id: `SR-${Date.now()}`, created_at: now, updated_at: now } as ServiceRequest;
    const created = await convex.mutation('serviceRequests:create', { request: record });
    setCache<ServiceRequest>(`service_request:${record.id}`, record);
    if (record.user_id) {
      const listKey = `service_requests:${record.user_id}`;
      const cached = getCache<ServiceRequest[]>(listKey) || [];
      setCache(listKey, [record, ...cached]);
      invalidateCache(`stats:${record.user_id}`);
    }
    return created as ServiceRequest;
  },

  async getById(id: string) {
    return getOrFetch<ServiceRequest | null>(`service_request:${id}`, async () => {
      const data = await convex.query('serviceRequests:getById', { id });
      return (data as ServiceRequest) || null;
    });
  },

  async getByUserId(userId: string) {
    return getOrFetch<ServiceRequest[]>(`service_requests:${userId}`, async () => {
      const data = await convex.query('serviceRequests:getByUserId', { userId });
      return (data || []) as ServiceRequest[];
    });
  },

  async update(id: string, updates: Partial<ServiceRequest>) {
    const record = await convex.mutation('serviceRequests:update', { id, updates });
    setCache<ServiceRequest>(`service_request:${record.id}`, record);
    if (record.user_id) {
      const listKey = `service_requests:${record.user_id}`;
      const cached = getCache<ServiceRequest[]>(listKey) || [];
      const idx = cached.findIndex(r => r.id === record.id);
      if (idx >= 0) {
        cached[idx] = record;
        setCache(listKey, [...cached]);
      }
      invalidateCache(`stats:${record.user_id}`);
    }
    return record;
  },

  async delete(id: string) {
    await convex.mutation('serviceRequests:remove', { id });
    const cached = getCache<ServiceRequest | null>(`service_request:${id}`);
    if (cached && cached.user_id) {
      const listKey = `service_requests:${cached.user_id}`;
      const arr = getCache<ServiceRequest[]>(listKey) || [];
      setCache(listKey, arr.filter(r => r.id !== id));
      invalidateCache(`stats:${cached.user_id}`);
    }
    invalidateCache(`service_request:${id}`);
  },

  async search(userId: string, query: string) {
    const key = `search:${userId}:${query}`;
    return getOrFetch<ServiceRequest[]>(key, async () => {
      const data = await convex.query('serviceRequests:search', { userId, q: query });
      return (data || []) as ServiceRequest[];
    });
  },

  async getByStatus(userId: string, status: string) {
    const key = `status:${userId}:${status}`;
    return getOrFetch<ServiceRequest[]>(key, async () => {
      const data = await convex.query('serviceRequests:byStatus', { userId, status });
      return (data || []) as ServiceRequest[];
    });
  },

  async getStats(userId: string) {
    return getOrFetch<{ total: number; completed: number; pending: number; inProgress: number; totalRevenue: number }>(`stats:${userId}`, async () => {
      const stats = await convex.query('serviceRequests:stats', { userId });
      return stats as { total: number; completed: number; pending: number; inProgress: number; totalRevenue: number };
    });
  },
};

type UserProfile = { id: string; email: string; full_name: string | null; company_name: string | null; is_active: boolean; created_at: string };

export const adminAPI = {
  async getAllUsersWithStats() {
    const users = await convex.query('users:list', {});
    const enriched = await Promise.all((users as UserProfile[]).map(async (u) => {
      const reqs = await convex.query('serviceRequests:getByUserId', { userId: u.id });
      const list = (reqs || []) as ServiceRequest[];
      const totalRevenue = list.reduce((sum, r) => sum + (r.payment_completed ? (r.total_cost ?? 0) : (r.deposit_paid ?? 0)), 0);
      return {
        ...u,
        ticketCount: list.length,
        totalRevenue,
        pendingTickets: list.filter(r => r.status === 'Pending').length,
        completedTickets: list.filter(r => r.status === 'Completed').length,
        lastActivityDate: list.length > 0 ? list[0].created_at : null,
      };
    }));
    setCache('admin:usersWithStats', enriched);
    return enriched;
  },

  async getAllServiceRequests(limit = 100, offset = 0) {
    const key = `admin:requests:${offset}:${limit}`;
    return getOrFetch<{ requests: unknown[]; total: number }>(key, async () => {
      const all = await convex.query('admin:listRequests', {});
      const list = (all || []) as ServiceRequest[];
      const sorted = list.sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));
      return { requests: sorted.slice(offset, offset + limit), total: sorted.length };
    });
  },

  async getRequestsByStatus(status: string, limit = 100, offset = 0) {
    const key = `admin:requestsByStatus:${status}:${offset}:${limit}`;
    return getOrFetch<{ requests: unknown[]; total: number }>(key, async () => {
      const all = await convex.query('admin:listRequests', {});
      const list = (all || []) as ServiceRequest[];
      const filtered = list.filter(r => r.status === status).sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));
      return { requests: filtered.slice(offset, offset + limit), total: filtered.length };
    });
  },

  async getActivityLogs(limit = 50, offset = 0) {
    const key = `admin:logs:${offset}:${limit}`;
    return getOrFetch<{ logs: unknown[]; total: number }>(key, async () => {
      const all = await convex.query('admin:listActivity', {});
      const list = (all || []) as Array<{ created_at: string }>;
      const sorted = list.sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));
      return { logs: sorted.slice(offset, offset + limit), total: sorted.length };
    });
  },

  async getGlobalStats() {
    return getOrFetch<{ totalUsers: number; totalTickets: number; pendingTickets: number; completedTickets: number; inProgressTickets: number; totalRevenue: number }>('admin:globalStats', async () => {
      const users = await convex.query('users:list', {});
      const reqs = await convex.query('admin:listRequests', {});
      const list = (reqs || []) as ServiceRequest[];
      const totalRevenue = list.reduce((sum, r) => sum + (r.payment_completed ? (r.total_cost ?? 0) : (r.deposit_paid ?? 0)), 0);
      return {
        totalUsers: ((users || []) as UserProfile[]).length,
        totalTickets: list.length,
        pendingTickets: list.filter(r => r.status === 'Pending').length,
        completedTickets: list.filter(r => r.status === 'Completed').length,
        inProgressTickets: list.filter(r => r.status === 'In-Progress').length,
        totalRevenue,
      };
    });
  },

  async searchRequests(query: string, limit = 50, offset = 0) {
    const key = `admin:search:${query}:${offset}:${limit}`;
    return getOrFetch<{ requests: unknown[]; total: number }>(key, async () => {
      const all = await convex.query('admin:listRequests', {});
      const q = query.toLowerCase();
      const list = (all || []) as ServiceRequest[];
      const filtered = list.filter(r =>
        (r.customer_name ?? '').toLowerCase().includes(q) ||
        (r.customer_phone ?? '').toLowerCase().includes(q) ||
        (r.device_brand ?? '').toLowerCase().includes(q) ||
        (r.id ?? '').toLowerCase().includes(q) ||
        (r.customer_email ?? '').toLowerCase().includes(q)
      ).sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));
      return { requests: filtered.slice(offset, offset + limit), total: filtered.length };
    });
  },

  async getUserRoles(userId: string) {
    const key = `roles:${userId}`;
    return getOrFetch<Array<{ role: string; assigned_at: string }>>(key, async () => {
      const roles = await convex.query('users:getRoles', { userId });
      return roles as Array<{ role: string; assigned_at: string }>;
    });
  },

  async assignRole(userId: string, role: string) {
    const data = await convex.mutation('users:assignRole', { userId, role });
    invalidateCache(`roles:${userId}`);
    invalidateCache('admin:usersWithStats');
    return data;
  },

  async removeRole(userId: string, role: string) {
    await convex.mutation('users:removeRole', { userId, role });
    invalidateCache(`roles:${userId}`);
    invalidateCache('admin:usersWithStats');
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    const data = await convex.mutation('users:toggleUserStatus', { userId, isActive });
    invalidateCache('admin:users');
    invalidateCache('admin:usersWithStats');
    return data;
  },
};
