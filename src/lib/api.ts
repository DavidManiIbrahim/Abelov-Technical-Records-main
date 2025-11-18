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
      totalRevenue: data?.reduce((sum, r) => sum + r.total_cost, 0) || 0,
    };
    return stats;
  },
};
