'use client';

import { useState } from 'react';
import Lobby from '@/components/Lobby';
import MeetingRoom from '@/components/MeetingRoom';

export default function RoomPage({ params }: { params: { id: string } }) {
  const [hasJoined, setHasJoined] = useState(false);
  const [userName, setUserName] = useState('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const handleJoin = (name: string, stream: MediaStream | null) => {
    setUserName(name);
    setMediaStream(stream);
    setHasJoined(true);
  };

  if (!hasJoined) {
    return <Lobby roomId={params.id} onJoin={handleJoin} />;
  }

  return (
    <MeetingRoom 
      roomId={params.id} 
      userName={userName} 
      initialStream={mediaStream} 
    />
  );
}
