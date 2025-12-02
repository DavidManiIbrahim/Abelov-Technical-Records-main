import { v } from 'convex/values';
import { mutation, query } from 'convex/server';
import { api } from './_generated/api';

export const signUp = mutation({
  args: { email: v.string(), password: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('user_profiles').withIndex('by_email', q => q.eq('email', args.email)).unique();
    if (existing) throw new Error('Email already registered');
    const id = await ctx.runAction(api.usersActions.generateId, {});
    const created_at = new Date().toISOString();
    await ctx.db.insert('user_profiles', { id, email: args.email, full_name: undefined, company_name: undefined, is_active: true, created_at });
    await ctx.db.insert('user_roles', { user_id: id, role: args.role, assigned_at: created_at });
    await ctx.db.insert('user_activity_logs', { user_id: id, action: 'sign_up', metadata: undefined, created_at });
    const hashed = await ctx.runAction(api.usersActions.hashPassword, { pw: args.password });
    await ctx.db.insert('user_profiles', { id: `${id}-auth`, email: hashed, full_name: undefined, company_name: undefined, is_active: true, created_at });
    return { id, email: args.email };
  },
});

export const signIn = query({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db.query('user_profiles').withIndex('by_email', q => q.eq('email', args.email)).unique();
    if (!profile) throw new Error('Invalid email or password');
    const hashed = await ctx.runAction(api.usersActions.hashPassword, { pw: args.password });
    const authRow = await ctx.db.query('user_profiles').withIndex('by_email', q => q.eq('email', hashed)).unique();
    if (!authRow) throw new Error('Invalid email or password');
    const roles = await ctx.db.query('user_roles').withIndex('by_user', q => q.eq('user_id', profile.id)).collect();
    return { user: { id: profile.id, email: profile.email }, roles: roles.map(r => r.role) };
  },
});

export const getRoles = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const roles = await ctx.db.query('user_roles').withIndex('by_user', q => q.eq('user_id', args.userId)).collect();
    return roles.map(r => ({ role: r.role, assigned_at: r.assigned_at }));
  },
});

export const assignRole = mutation({
  args: { userId: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    const assigned_at = new Date().toISOString();
    await ctx.db.insert('user_roles', { user_id: args.userId, role: args.role, assigned_at });
    return { user_id: args.userId, role: args.role };
  },
});

export const removeRole = mutation({
  args: { userId: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    const roles = await ctx.db.query('user_roles').withIndex('by_user', q => q.eq('user_id', args.userId)).collect();
    const found = roles.find(r => r.role === args.role);
    if (!found) return;
    await ctx.db.delete(found._id);
  },
});

export const toggleUserStatus = mutation({
  args: { userId: v.string(), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query('user_profiles').withIndex('by_email', q => q).collect();
    const row = user.find(u => u.id === args.userId);
    if (!row) throw new Error('User not found');
    await ctx.db.patch(row._id, { is_active: args.isActive });
    return { id: args.userId, is_active: args.isActive };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('user_profiles').withIndex('by_email', q => q).collect();
    return users.filter(u => !u.id.endsWith('-auth')).map(u => ({ id: u.id, email: u.email, full_name: u.full_name ?? null, company_name: u.company_name ?? null, is_active: u.is_active, created_at: u.created_at }));
  },
});
