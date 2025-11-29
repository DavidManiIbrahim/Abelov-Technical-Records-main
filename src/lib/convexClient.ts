import { ConvexHttpClient } from 'convex/browser';

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
if (!convexUrl) {
  throw new Error('Missing Convex environment variable VITE_CONVEX_URL');
}

export const convex = new ConvexHttpClient(convexUrl);
