import { ServiceRequest } from '@/types/database';

const REQUESTS_KEY = 'service_requests';
const USERS_KEY = 'users';

type StoredUser = {
  id: string;
  email: string;
  full_name?: string | null;
  company_name?: string | null;
  is_active?: boolean;
  roles?: string[];
  created_at?: string;
};

function normalizeRequest(r: any): ServiceRequest {
  return {
    id: r.id,
    user_id: r.user_id,
    shop_name: r.shop_name || '',
    technician_name: r.technician_name || '',
    request_date: r.request_date || new Date().toISOString().split('T')[0],
    customer_name: r.customer_name || '',
    customer_phone: r.customer_phone || '',
    customer_email: r.customer_email || '',
    customer_address: r.customer_address || '',
    device_model: r.device_model || 'Laptop',
    device_brand: r.device_brand || '',
    serial_number: r.serial_number || '',
    operating_system: r.operating_system || '',
    accessories_received: r.accessories_received || '',
    problem_description: r.problem_description || '',
    diagnosis_date: r.diagnosis_date || '',
    diagnosis_technician: r.diagnosis_technician || '',
    fault_found: r.fault_found || '',
    parts_used: r.parts_used || '',
    repair_action: r.repair_action || '',
    status: r.status || 'Pending',
    service_charge: Number(r.service_charge || 0),
    parts_cost: Number(r.parts_cost || 0),
    total_cost: Number(r.total_cost || 0),
    deposit_paid: Number(r.deposit_paid || 0),
    balance: Number(r.balance || 0),
    payment_completed: Boolean(r.payment_completed || false),
    repair_timeline: Array.isArray(r.repair_timeline) ? r.repair_timeline : [],
    customer_confirmation: r.customer_confirmation || { customer_collected: false, technician: '' },
    created_at: r.created_at || new Date().toISOString(),
    updated_at: r.updated_at || r.created_at || new Date().toISOString(),
  } as ServiceRequest;
}

function readRequests(): ServiceRequest[] {
  const raw = localStorage.getItem(REQUESTS_KEY);
  const arr = raw ? JSON.parse(raw) : [];
  return Array.isArray(arr) ? arr.map(normalizeRequest) : [];
}

function writeRequests(requests: ServiceRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

function readUsers(): StoredUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const serviceRequestAPI = {
  async create(request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const reqs = readRequests();
    const id = `SR-${Date.now()}`;
    const now = new Date().toISOString();
    const record: ServiceRequest = {
      ...request,
      id,
      created_at: now,
      updated_at: now,
    } as ServiceRequest;
    reqs.unshift(record);
    writeRequests(reqs);
    return record;
  },

  async getById(id: string) {
    const reqs = readRequests();
    return reqs.find(r => r.id === id) || null;
  },

  async getByUserId(userId: string) {
    const reqs = readRequests();
    return reqs.filter(r => r.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async update(id: string, updates: Partial<ServiceRequest>) {
    const reqs = readRequests();
    const idx = reqs.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Request not found');
    const updated = { ...reqs[idx], ...updates, updated_at: new Date().toISOString() } as ServiceRequest;
    reqs[idx] = updated;
    writeRequests(reqs);
    return updated;
  },

  async delete(id: string) {
    const reqs = readRequests();
    writeRequests(reqs.filter(r => r.id !== id));
  },

  async search(userId: string, query: string) {
    const q = query.trim().toLowerCase();
    const reqs = readRequests();
    return reqs
      .filter(r => r.user_id === userId)
      .filter(r =>
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.customer_phone || '').toLowerCase().includes(q) ||
        (r.device_brand || '').toLowerCase().includes(q) ||
        (r.id || '').toLowerCase().includes(q) ||
        (r.customer_email || '').toLowerCase().includes(q)
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getByStatus(userId: string, status: string) {
    const reqs = readRequests();
    return reqs
      .filter(r => r.user_id === userId && r.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getStats(userId: string) {
    const reqs = readRequests().filter(r => r.user_id === userId);
    const revenue = reqs.reduce((sum, r) => {
      const paid = r.payment_completed ? (r.total_cost || 0) : (r.deposit_paid || 0);
      return sum + paid;
    }, 0);
    return {
      total: reqs.length,
      completed: reqs.filter(r => r.status === 'Completed').length,
      pending: reqs.filter(r => r.status === 'Pending').length,
      inProgress: reqs.filter(r => r.status === 'In-Progress').length,
      totalRevenue: revenue,
    };
  },
};

export const adminAPI = {
  async getAllUsersWithStats() {
    const users = readUsers();
    const reqs = readRequests();
    return users.map(u => {
      const userReqs = reqs.filter(r => r.user_id === u.id);
      const revenue = userReqs.reduce((sum, r) => {
        const paid = r.payment_completed ? (r.total_cost || 0) : (r.deposit_paid || 0);
        return sum + paid;
      }, 0);
      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name ?? null,
        company_name: u.company_name ?? null,
        is_active: u.is_active ?? true,
        created_at: u.created_at || new Date().toISOString(),
        ticketCount: userReqs.length,
        totalRevenue: revenue,
        pendingTickets: userReqs.filter(r => r.status === 'Pending').length,
        completedTickets: userReqs.filter(r => r.status === 'Completed').length,
        lastActivityDate: userReqs.length > 0 ? userReqs[0].created_at : null,
      };
    });
  },

  async getAllServiceRequests(limit = 100, offset = 0) {
    const reqs = readRequests().sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { requests: reqs.slice(offset, offset + limit), total: reqs.length };
  },

  async getRequestsByStatus(status: string, limit = 100, offset = 0) {
    const filtered = readRequests().filter(r => r.status === status).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { requests: filtered.slice(offset, offset + limit), total: filtered.length };
  },

  async getActivityLogs(limit = 50, offset = 0) {
    return { logs: [], total: 0 };
  },

  async getGlobalStats() {
    const reqs = readRequests();
    const users = readUsers();
    const revenue = reqs.reduce((sum, r) => {
      const paid = r.payment_completed ? (r.total_cost || 0) : (r.deposit_paid || 0);
      return sum + paid;
    }, 0);
    return {
      totalUsers: users.length,
      totalTickets: reqs.length,
      pendingTickets: reqs.filter(r => r.status === 'Pending').length,
      completedTickets: reqs.filter(r => r.status === 'Completed').length,
      inProgressTickets: reqs.filter(r => r.status === 'In-Progress').length,
      totalRevenue: revenue,
    };
  },

  async searchRequests(query: string, limit = 50, offset = 0) {
    const q = query.trim().toLowerCase();
    const reqs = readRequests()
      .filter(r =>
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.customer_phone || '').toLowerCase().includes(q) ||
        (r.device_brand || '').toLowerCase().includes(q) ||
        (r.id || '').toLowerCase().includes(q) ||
        (r.customer_email || '').toLowerCase().includes(q)
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { requests: reqs.slice(offset, offset + limit), total: reqs.length };
  },

  async getUserRoles(userId: string) {
    const users = readUsers();
    const u = users.find(x => x.id === userId);
    return (u?.roles || []).map(role => ({ role, assigned_at: u?.created_at || new Date().toISOString() }));
  },

  async assignRole(userId: string, role: string) {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    const roles = new Set(users[idx].roles || []);
    roles.add(role);
    users[idx].roles = Array.from(roles);
    writeUsers(users);
    return { user_id: userId, role };
  },

  async removeRole(userId: string, role: string) {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return;
    users[idx].roles = (users[idx].roles || []).filter(r => r !== role);
    writeUsers(users);
  },

  async toggleUserStatus(userId: string, isActive: boolean) {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    users[idx].is_active = isActive;
    writeUsers(users);
    return users[idx];
  },

  async deleteUser(userId: string) {
    const users = readUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    writeUsers(filteredUsers);
    const reqs = readRequests();
    const filteredReqs = reqs.filter(r => r.user_id !== userId);
    writeRequests(filteredReqs);
  },
};
