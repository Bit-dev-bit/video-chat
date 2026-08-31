import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    const data = await req.text();
    const [socketId, channelName, userName] = data.split('&').map(str => str.split('=')[1]);
    
    const decodedSocketId = decodeURIComponent(socketId);
    const decodedChannelName = decodeURIComponent(channelName);
    
    // In a real app we'd validate the user session, but this is a college project
    // so we just trust the name passed (or we can extract it from headers/body differently).
    // Actually, Pusher's default client SDK sends `socket_id` and `channel_name` as urlencoded form data.
    // If we want to pass user info, we can pass it in headers or parse it from a custom body.
    
    // Let's parse the form data properly
    const formData = new URLSearchParams(data);
    const sId = formData.get('socket_id');
    const cName = formData.get('channel_name');
    
    // We expect the client to send user name in a custom way or we can generate a random ID
    // Let's just generate a random ID for presence for now and let the client broadcast their name.
    const userId = Math.random().toString(36).substring(2, 15);
    
    if (!sId || !cName) {
      return new NextResponse('Missing socket_id or channel_name', { status: 400 });
    }

    const presenceData = {
      user_id: userId,
      user_info: {
        name: 'Guest' // We can improve this by having the client send their name in headers
      }
    };

    const authResponse = pusherServer.authorizeChannel(sId, cName, presenceData);
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
