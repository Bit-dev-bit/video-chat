import { useEffect, useRef, useState, useCallback } from 'react';
import { getPusherClient } from '@/lib/pusher';
import type { Channel, Members } from 'pusher-js';

// ICE Servers configuration (STUN for now, TURN can be added here)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ],
};

interface UseWebRTCProps {
  roomId: string;
  userName: string;
  localStream: MediaStream | null;
}

export function useWebRTC({ roomId, userName, localStream }: UseWebRTCProps) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [remoteUserName, setRemoteUserName] = useState<string>('Waiting for participant...');
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const pusherChannel = useRef<Channel | null>(null);
  const isInitiator = useRef(false);

  // Initialize WebRTC
  const initWebRTC = useCallback(() => {
    if (peerConnection.current) return;
    
    peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        if (localStream && peerConnection.current) {
          peerConnection.current.addTrack(track, localStream);
        }
      });
    }

    // Handle incoming remote stream
    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && pusherChannel.current) {
        pusherChannel.current.trigger('client-ice-candidate', {
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    peerConnection.current.onconnectionstatechange = () => {
      switch (peerConnection.current?.connectionState) {
        case 'connected':
          setConnectionState('connected');
          break;
        case 'disconnected':
        case 'failed':
        case 'closed':
          setConnectionState('disconnected');
          setRemoteStream(null);
          break;
      }
    };
  }, [localStream]);

  // Create and send offer
  const createOffer = async () => {
    if (!peerConnection.current || !pusherChannel.current) return;
    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      pusherChannel.current.trigger('client-offer', {
        sdp: offer,
        userName: userName
      });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
      setError('Pusher is not configured. Please add Pusher keys to your environment variables.');
      setConnectionState('disconnected');
      return;
    }

    initWebRTC();

    const pusher = getPusherClient();
    // Presence channels must be prefixed with 'presence-'
    const channelName = `presence-room-${roomId}`;
    const channel = pusher.subscribe(channelName);
    pusherChannel.current = channel;

    // When subscription succeeds
    channel.bind('pusher:subscription_succeeded', (members: Members) => {
      if (members.count > 2) {
        setError('Room is full (max 2 participants for this demo).');
        pusher.unsubscribe(channelName);
        return;
      }

      // If we are the second person joining, we trigger an event to tell the first person
      if (members.count === 2) {
        isInitiator.current = false;
        // Broadcast that we joined and our name
        channel.trigger('client-user-joined', { userName });
      } else {
        isInitiator.current = true; // We are alone, so we wait for someone to join and we will initiate
      }
    });

    // Handle a new user joining
    channel.bind('client-user-joined', (data: { userName: string }) => {
      setRemoteUserName(data.userName);
      if (isInitiator.current) {
        createOffer();
      }
    });

    // Handle incoming offer
    channel.bind('client-offer', async (data: { sdp: RTCSessionDescriptionInit, userName: string }) => {
      if (!peerConnection.current) return;
      setRemoteUserName(data.userName);
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        channel.trigger('client-answer', { sdp: answer });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // Handle incoming answer
    channel.bind('client-answer', async (data: { sdp: RTCSessionDescriptionInit }) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    // Handle incoming ICE candidates
    channel.bind('client-ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    // Handle member left
    channel.bind('pusher:member_removed', () => {
      setConnectionState('disconnected');
      setRemoteStream(null);
      setRemoteUserName('Participant left');
      
      // Reset peer connection for potential new user joining
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      isInitiator.current = true;
      initWebRTC(); // Reinitialize
    });

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      pusher.unsubscribe(channelName);
    };
  }, [roomId, userName, initWebRTC]);

  // Method to replace video track for screen sharing
  const replaceVideoTrack = async (newTrack: MediaStreamTrack) => {
    if (!peerConnection.current) return;
    const senders = peerConnection.current.getSenders();
    const videoSender = senders.find(sender => sender.track?.kind === 'video');
    if (videoSender) {
      await videoSender.replaceTrack(newTrack);
    }
  };

  return {
    remoteStream,
    connectionState,
    error,
    remoteUserName,
    pusherChannel: pusherChannel.current,
    replaceVideoTrack
  };
}
