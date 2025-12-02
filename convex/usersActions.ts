"use node";
import { action } from 'convex/server';
import { v } from 'convex/values';
import crypto from 'crypto';

export const hashPassword = action({
  args: { pw: v.string() },
  handler: async (_ctx, args) => {
    return crypto.createHash('sha256').update(args.pw).digest('hex');
  },
});

export const generateId = action({
  args: {},
  handler: async () => {
    return crypto.randomUUID();
  },
});
