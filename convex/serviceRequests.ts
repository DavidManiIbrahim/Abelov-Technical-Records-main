import { v } from 'convex/values';
import { mutation, query } from 'convex/server';

export const create = mutation({
  args: { request: v.object({
    id: v.string(), user_id: v.string(), shop_name: v.string(), technician_name: v.string(), request_date: v.string(),
    customer_name: v.string(), customer_phone: v.string(), customer_email: v.optional(v.string()), customer_address: v.string(),
    device_model: v.string(), device_brand: v.string(), serial_number: v.string(), operating_system: v.string(), accessories_received: v.string(),
    problem_description: v.string(), diagnosis_date: v.string(), diagnosis_technician: v.string(), fault_found: v.string(), parts_used: v.string(),
    repair_action: v.string(), status: v.string(), service_charge: v.number(), parts_cost: v.number(), total_cost: v.number(), deposit_paid: v.number(),
    balance: v.number(), payment_completed: v.boolean(), repair_timeline: v.array(v.object({ step: v.string(), date: v.string(), note: v.string(), status: v.string() })),
    customer_confirmation: v.object({ customer_collected: v.boolean(), technician: v.string() }), created_at: v.string(), updated_at: v.string(),
  }) },
  handler: async (ctx, args) => {
    await ctx.db.insert('service_requests', args.request);
    return args.request;
  },
});

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('service_requests').withIndex('by_user', q => q).collect();
    return rows.find(r => r.id === args.id) ?? null;
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('service_requests').withIndex('by_user', q => q.eq('user_id', args.userId)).order('desc').collect();
    return rows;
  },
});

export const update = mutation({
  args: { id: v.string(), updates: v.any() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('service_requests').withIndex('by_user', q => q).collect();
    const existing = rows.find(r => r.id === args.id);
    if (!existing) throw new Error('Request not found');
    const updated = { ...existing, ...args.updates, updated_at: new Date().toISOString() };
    await ctx.db.patch(existing._id, updated);
    return updated;
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('service_requests').withIndex('by_user', q => q).collect();
    const existing = rows.find(r => r.id === args.id);
    if (!existing) return;
    await ctx.db.delete(existing._id);
  },
});

export const search = query({
  args: { userId: v.string(), q: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('service_requests').withIndex('by_user', q => q.eq('user_id', args.userId)).order('desc').collect();
    const s = args.q.toLowerCase().trim();
    return rows.filter(r =>
      (r.customer_name ?? '').toLowerCase().includes(s) ||
      (r.customer_phone ?? '').toLowerCase().includes(s) ||
      (r.device_brand ?? '').toLowerCase().includes(s) ||
      (r.id ?? '').toLowerCase().includes(s) ||
      (r.customer_email ?? '').toLowerCase().includes(s)
    );
  },
});

export const byStatus = query({
  args: { userId: v.string(), status: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('service_requests').withIndex('by_status', q => q.eq('user_id', args.userId).eq('status', args.status)).order('desc').collect();
    return rows;
  },
});

export const stats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query('service_requests').withIndex('by_user', q => q.eq('user_id', args.userId)).collect();
    const totalRevenue = rows.reduce((sum, r) => sum + (r.payment_completed ? (r.total_cost ?? 0) : (r.deposit_paid ?? 0)), 0);
    return {
      total: rows.length,
      completed: rows.filter(r => r.status === 'Completed').length,
      pending: rows.filter(r => r.status === 'Pending').length,
      inProgress: rows.filter(r => r.status === 'In-Progress').length,
      totalRevenue,
    };
  },
});
