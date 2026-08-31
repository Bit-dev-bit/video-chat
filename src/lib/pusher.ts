import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher instance
// We use a singleton pattern so we don't create multiple instances on the client
export const getPusherClient = () => {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2'; // fallback to prevent crash

  if (!key) {
    console.error("Pusher key is missing");
  }
  
  return new PusherClient(key, {
    cluster: cluster,
    authEndpoint: '/api/pusher/auth',
  });
};
