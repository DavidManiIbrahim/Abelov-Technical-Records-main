import { query } from 'convex/server';

export const listRequests = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('service_requests').withIndex('by_created', q => q).order('desc').collect();
    return rows;
  },
});

export const listActivity = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('user_activity_logs').withIndex('by_created', q => q).order('desc').collect();
    return rows;
  },
});
