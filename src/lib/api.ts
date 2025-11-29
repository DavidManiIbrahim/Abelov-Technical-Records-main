import { supabase } from './supabase';
import { ServiceRequest } from '@/types/database';
import { getOrFetch, setCache, getCache, invalidateCache } from '@/utils/storage';

export const serviceRequestAPI = {
  async create(request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('service_requests')
      .insert([request])
      .select()
      .single();
    if (error) throw error;
    const record = data as ServiceRequest;
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
    return getOrFetch<ServiceRequest | null>(`service_request:${id}`, async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as ServiceRequest) || null;
    });
  },

  async getByUserId(userId: string) {
    return getOrFetch<ServiceRequest[]>(`service_requests:${userId}`, async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceRequest[];
    });
  },

  async update(id: string, updates: Partial<ServiceRequest>) {
    const { data, error } = await supabase
      .from('service_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const record = data as ServiceRequest;
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
    const { error } = await supabase
      .from('service_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
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
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', userId)
        .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,device_brand.ilike.%${query}%,id.ilike.%${query}%`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceRequest[];
    });
  },

  async getByStatus(userId: string, status: string) {
    const key = `status:${userId}:${status}`;
    return getOrFetch<ServiceRequest[]>(key, async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ServiceRequest[];
    });
  },

  async getStats(userId: string) {
    return getOrFetch<{ total: number; completed: number; pending: number; inProgress: number; totalRevenue: number }>(`stats:${userId}`, async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select('status, total_cost, deposit_paid, payment_completed')
        .eq('user_id', userId);
      if (error) throw error;
      const rows = (data || []) as Array<{ status: string; total_cost: number | null; deposit_paid: number | null; payment_completed: boolean }>;
      const totalRevenue = rows.reduce((sum, r) => {
        const paid = r.payment_completed ? (r.total_cost || 0) : (r.deposit_paid || 0);
        return sum + paid;
      }, 0);
      return {
        total: rows.length || 0,
        completed: rows.filter((r) => r.status === 'Completed').length || 0,
        pending: rows.filter((r) => r.status === 'Pending').length || 0,
        inProgress: rows.filter((r) => r.status === 'In-Progress').length || 0,
        totalRevenue,
      };
    });
  },
};

export const adminAPI = {
  async getAllUsersWithStats() {
    const users = await getOrFetch<Array<{ id: string; email: string; full_name: string | null; company_name: string | null; is_active: boolean; created_at: string }>>('admin:users', async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, company_name, is_active, created_at');
      if (error) throw error;
      return (data || []) as Array<{ id: string; email: string; full_name: string | null; company_name: string | null; is_active: boolean; created_at: string }>;
    });

    const enrichedUsers = await Promise.all(
      (users || []).map(async (user) => {
        const { data: requests, error: requestsError } = await supabase
          .from('service_requests')
          .select('id, status, total_cost, deposit_paid, created_at, payment_completed')
          .eq('user_id', user.id);

        if (requestsError) {
          console.error(`Failed to fetch requests for user ${user.id}:`, requestsError);
          return {
            ...user,
            ticketCount: 0,
            totalRevenue: 0,
            pendingTickets: 0,
            completedTickets: 0,
          };
        }

        const reqs = (requests || []) as Array<{ id: string; status: string; total_cost: number | null; deposit_paid: number | null; created_at: string; payment_completed: boolean }>;
        const totalRevenue = reqs.reduce((sum, r) => {
          const paid = r.payment_completed ? (r.total_cost || 0) : (r.deposit_paid || 0);
          return sum + paid;
        }, 0);

        return {
          ...user,
          ticketCount: reqs.length,
          totalRevenue,
          pendingTickets: reqs.filter((r) => r.status === 'Pending').length,
          completedTickets: reqs.filter((r) => r.status === 'Completed').length,
          lastActivityDate: reqs.length > 0 ? reqs[0].created_at : null,
        };
      })
    );

    setCache('admin:usersWithStats', enrichedUsers);
    return enrichedUsers;
  },

  async getAllServiceRequests(limit = 100, offset = 0) {
    const key = `admin:requests:${offset}:${limit}`;
    return getOrFetch<{ requests: unknown[]; total: number }>(key, async () => {
      const { data, error, count } = await supabase
        .from('service_requests')
        .select('*, user_profiles:user_id(email, full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return { requests: data || [], total: count || 0 };
    });
  },

  async getRequestsByStatus(status: string, limit = 100, offset = 0) {
    const key = `admin:requestsByStatus:${status}:${offset}:${limit}`;
    return getOrFetch<{ requests: unknown[]; total: number }>(key, async () => {
      const { data, error, count } = await supabase
        .from('service_requests')
        .select('*, user_profiles:user_id(email, full_name)', { count: 'exact' })
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return { requests: data || [], total: count || 0 };
    });
  },

  async getActivityLogs(limit = 50, offset = 0) {
    const key = `admin:logs:${offset}:${limit}`;
    return getOrFetch<{ logs: unknown[]; total: number }>(key, async () => {
      const { data, error, count } = await supabase
        .from('user_activity_logs')
        .select('*, user_profiles:user_id(email, full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return { logs: data || [], total: count || 0 };
    });
  },

  async getGlobalStats() {
    return getOrFetch<{ totalUsers: number; totalTickets: number; pendingTickets: number; completedTickets: number; inProgressTickets: number; totalRevenue: number }>('admin:globalStats', async () => {
      const { data: requests, error: reqError } = await supabase
        .from('service_requests')
        .select('status, total_cost, deposit_paid, user_id, created_at, payment_completed');
      if (reqError) throw reqError;

      const { data: users, error: userError } = await supabase
        .from('user_profiles')
        .select('id');
      if (userError) throw userError;

      const reqs = (requests || []) as Array<{ status: string; total_cost: number | null; deposit_paid: number | null; user_id: string; created_at: string; payment_completed: boolean }>;
      const totalRevenue = reqs.reduce((sum, r) => {
        const paid = r.payment_completed ? (r.total_cost || 0) : (r.deposit_paid || 0);
        return sum + paid;
      }, 0);

      return {
        totalUsers: users?.length || 0,
        totalTickets: reqs.length,
        pendingTickets: reqs.filter((r) => r.status === 'Pending').length,
        completedTickets: reqs.filter((r) => r.status === 'Completed').length,
        inProgressTickets: reqs.filter((r) => r.status === 'In-Progress').length,
        totalRevenue,
      };
    });
  },

  async searchRequests(query: string, limit = 50, offset = 0) {
    const key = `admin:search:${query}:${offset}:${limit}`;
    return getOrFetch<{ requests: unknown[]; total: number }>(key, async () => {
      const { data, error, count } = await supabase
        .from('service_requests')
        .select('*, user_profiles:user_id(email, full_name)', { count: 'exact' })
        .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,device_brand.ilike.%${query}%,id.ilike.%${query}%,customer_email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return { requests: data || [], total: count || 0 };
    });
  },

  async getUserRoles(userId: string) {
    const key = `roles:${userId}`;
    return getOrFetch<Array<{ role: string; assigned_at: string }>>(key, async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, assigned_at')
        .eq('user_id', userId);
      if (error) throw error;
      return (data || []) as Array<{ role: string; assigned_at: string }>;
    });
  },

  async assignRole(userId: string, role: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role }])
      .select()
      .single();
    if (error) throw error;
    invalidateCache(`roles:${userId}`);
    invalidateCache('admin:usersWithStats');
    return data;
  },

  async removeRole(userId: string, role: string) {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);
    if (error) throw error;
    invalidateCache(`roles:${userId}`);
    invalidateCache('admin:usersWithStats');
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    invalidateCache('admin:users');
    invalidateCache('admin:usersWithStats');
    return data;
  },
};
