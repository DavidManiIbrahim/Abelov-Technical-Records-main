import { supabase } from './supabase';
import { ServiceRequest } from '@/types/database';

// Service Requests CRUD
export const serviceRequestAPI = {
  // Create
  async create(request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('service_requests')
      .insert([request])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Read one
  async getById(id: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Read all for user
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Update
  async update(id: string, updates: Partial<ServiceRequest>) {
    const { data, error } = await supabase
      .from('service_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Delete
  async delete(id: string) {
    const { error } = await supabase
      .from('service_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Search
  async search(userId: string, query: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('user_id', userId)
      .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,device_brand.ilike.%${query}%,id.ilike.%${query}%`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get by status
  async getByStatus(userId: string, status: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Get statistics
  async getStats(userId: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('status, total_cost, payment_completed')
      .eq('user_id', userId);
    if (error) throw error;
    
    const stats = {
      total: data?.length || 0,
      completed: data?.filter(r => r.status === 'Completed').length || 0,
      pending: data?.filter(r => r.status === 'Pending').length || 0,
      inProgress: data?.filter(r => r.status === 'In-Progress').length || 0,
      totalRevenue: data?.filter(r => r.payment_completed === true).reduce((sum, r) => sum + r.total_cost, 0) || 0,
    };
    return stats;
  },
};

// Admin API
export const adminAPI = {
  // Get all users with their stats
  async getAllUsersWithStats() {
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, company_name, is_active, created_at');
    
    if (usersError) throw usersError;

    const enrichedUsers = await Promise.all(
      (users || []).map(async (user) => {
        const { data: requests, error: requestsError } = await supabase
          .from('service_requests')
          .select('id, status, total_cost, created_at, payment_completed')
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

        const reqs = requests || [];
        return {
          ...user,
          ticketCount: reqs.length,
          totalRevenue: reqs.filter(r => r.payment_completed === true).reduce((sum, r) => sum + (r.total_cost || 0), 0),
          pendingTickets: reqs.filter(r => r.status === 'Pending').length,
          completedTickets: reqs.filter(r => r.status === 'Completed').length,
          lastActivityDate: reqs.length > 0 ? reqs[0].created_at : null,
        };
      })
    );

    return enrichedUsers;
  },

  // Get all service requests (admin view)
  async getAllServiceRequests(limit = 100, offset = 0) {
    const { data, error, count } = await supabase
      .from('service_requests')
      .select('*, user_profiles:user_id(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { requests: data || [], total: count || 0 };
  },

  // Get requests by status (admin view)
  async getRequestsByStatus(status: string, limit = 100, offset = 0) {
    const { data, error, count } = await supabase
      .from('service_requests')
      .select('*, user_profiles:user_id(email, full_name)', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { requests: data || [], total: count || 0 };
  },

  // Get activity logs
  async getActivityLogs(limit = 50, offset = 0) {
    const { data, error, count } = await supabase
      .from('user_activity_logs')
      .select('*, user_profiles:user_id(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { logs: data || [], total: count || 0 };
  },

  // Get global stats
  async getGlobalStats() {
    const { data: requests, error: reqError } = await supabase
      .from('service_requests')
      .select('status, total_cost, user_id, created_at, payment_completed');

    if (reqError) throw reqError;

    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('id');

    if (userError) throw userError;

    const reqs = requests || [];
    return {
      totalUsers: users?.length || 0,
      totalTickets: reqs.length,
      pendingTickets: reqs.filter(r => r.status === 'Pending').length,
      completedTickets: reqs.filter(r => r.status === 'Completed').length,
      inProgressTickets: reqs.filter(r => r.status === 'In-Progress').length,
      totalRevenue: reqs.filter(r => r.payment_completed === true).reduce((sum, r) => sum + (r.total_cost || 0), 0),
    };
  },

  // Search requests across all users
  async searchRequests(query: string, limit = 50, offset = 0) {
    const { data, error, count } = await supabase
      .from('service_requests')
      .select('*, user_profiles:user_id(email, full_name)', { count: 'exact' })
      .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,device_brand.ilike.%${query}%,id.ilike.%${query}%,customer_email.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { requests: data || [], total: count || 0 };
  },

  // Get user roles
  async getUserRoles(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, assigned_at')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  // Assign role to user
  async assignRole(userId: string, role: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .insert([{ user_id: userId, role }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove role from user
  async removeRole(userId: string, role: string) {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) throw error;
  },

  // Disable/enable user
  async toggleUserStatus(userId: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
