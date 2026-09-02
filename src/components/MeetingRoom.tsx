'use client';

import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, MessageSquare, Users, PhoneOff, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';

interface MeetingRoomProps {
  roomId: string;
  userName: string;
  initialStream: MediaStream | null;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export default function MeetingRoom({ roomId, userName, initialStream }: MeetingRoomProps) {
  const router = useRouter();
  
  // Local Media State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // UI Panels State
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { 
    remoteStream, 
    connectionState, 
    error, 
    remoteUserName, 
    pusherChannel,
    replaceVideoTrack 
  } = useWebRTC({ roomId, userName, localStream: initialStream });

  // Handle Initial Stream
  useEffect(() => {
    setMounted(true);
    if (initialStream) {
      const audioTrack = initialStream.getAudioTracks()[0];
      const videoTrack = initialStream.getVideoTracks()[0];
      if (audioTrack) setIsMicOn(audioTrack.enabled);
      if (videoTrack) setIsVideoOn(videoTrack.enabled);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = initialStream;
      }
    }
  }, [initialStream]);

  // Handle Remote Stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle Chat Subscription
  useEffect(() => {
    if (pusherChannel) {
      pusherChannel.bind('client-chat-message', (data: ChatMessage) => {
        setMessages(prev => [...prev, data]);
      });
    }
    return () => {
      if (pusherChannel) {
        pusherChannel.unbind('client-chat-message');
      }
    };
  }, [pusherChannel]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChat]);

  const toggleMic = () => {
    if (initialStream) {
      initialStream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = () => {
    if (initialStream) {
      initialStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          stopScreenShare();
        };

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        await replaceVideoTrack(screenTrack);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error sharing screen:', err);
        alert('Could not share screen. Permission might be denied or not supported.');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    if (initialStream) {
      const videoTrack = initialStream.getVideoTracks()[0];
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = initialStream;
      }
      if (videoTrack) {
        await replaceVideoTrack(videoTrack);
      }
    }
    setIsScreenSharing(false);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !pusherChannel) return;

    const messageData: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: userName,
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Send to other peer
    pusherChannel.trigger('client-chat-message', messageData);
    
    // Add to local UI
    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
  };

  const leaveMeeting = () => {
    if (initialStream) {
      initialStream.getTracks().forEach(track => track.stop());
    }
    router.push('/');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Meeting link copied!');
  };

  return (
    <div className="h-[100dvh] bg-gray-950 flex flex-col font-sans text-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 bg-gray-900/80 backdrop-blur-sm z-10 relative">
        <div className="flex items-center gap-4">
          <h1 className="text-lg sm:text-xl font-bold hidden sm:block">Meeting: <span className="font-mono text-gray-400">{roomId}</span></h1>
          <button onClick={copyLink} className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors border border-gray-700">
            Copy Link
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {error && (
            <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm border border-red-500/50">
              {error}
            </div>
          )}
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full text-sm border border-gray-700">
            <div className={`w-2.5 h-2.5 rounded-full ${
              connectionState === 'connected' ? 'bg-green-500' : 
              connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            <span className="hidden sm:inline capitalize">{connectionState}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative p-4 gap-4">
        
        {/* Video Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden shadow-2xl flex items-center justify-center">
            
            {/* Remote Video (Main) */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-500 p-8 text-center">
                <Users className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-xl font-medium text-gray-400">Waiting for others to join...</p>
                <p className="mt-2">Share the meeting link to invite them.</p>
              </div>
            )}
            
            {/* Remote User Label */}
            {remoteStream && (
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium border border-white/10">
                {remoteUserName}
              </div>
            )}

            {/* Local Video (Floating or Side-by-side) */}
            <div className="absolute bottom-4 right-4 w-32 sm:w-48 md:w-64 aspect-video bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-700 shadow-2xl">
              {!mounted ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-500">
                  <span className="text-xs">Loading...</span>
                </div>
              ) : isVideoOn || isScreenSharing ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isScreenSharing ? 'transform scale-x-[-1]' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-500">
                  <VideoOff className="w-8 h-8 mb-1" />
                  <span className="text-xs">You</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-medium">
                You {isScreenSharing ? '(Screen)' : ''}
              </div>
              {!isMicOn && (
                <div className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-lg">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 shrink-0 pb-2">
            <button
              onClick={toggleMic}
              className={`p-3 sm:p-4 rounded-2xl transition-colors shadow-lg ${
                isMicOn ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' : 'bg-red-500 hover:bg-red-600'
              }`}
              title="Toggle Microphone"
            >
              {isMicOn ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 sm:p-4 rounded-2xl transition-colors shadow-lg ${
                isVideoOn ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' : 'bg-red-500 hover:bg-red-600'
              }`}
              title="Toggle Camera"
            >
              {isVideoOn ? <VideoIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            </button>
            <button 
              onClick={toggleScreenShare}
              className={`p-3 sm:p-4 rounded-2xl transition-colors shadow-lg border border-gray-700 hidden sm:block ${
                isScreenSharing ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title="Share Screen"
            >
              <MonitorUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
              className={`p-3 sm:p-4 rounded-2xl transition-colors shadow-lg border border-gray-700 ${
                showChat ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title="Chat"
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
              className={`p-3 sm:p-4 rounded-2xl transition-colors shadow-lg border border-gray-700 ${
                showParticipants ? 'bg-blue-600 hover:bg-blue-700 border-blue-500' : 'bg-gray-800 hover:bg-gray-700'
              }`}
              title="Participants"
            >
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={leaveMeeting}
              className="p-3 sm:p-4 rounded-2xl bg-red-600 hover:bg-red-700 transition-colors shadow-lg flex items-center gap-2 font-semibold ml-auto sm:ml-4"
              title="Leave Meeting"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <span className="hidden sm:inline text-white">Leave</span>
            </button>
          </div>
        </div>

        {/* Side Panels (Chat / Participants) */}
        {(showChat || showParticipants) && (
          <div className="absolute inset-0 z-20 md:relative md:inset-auto md:w-80 bg-gray-900 md:rounded-3xl border-l md:border border-gray-800 flex flex-col overflow-hidden shadow-2xl shrink-0">
            {/* Panel Header */}
            <div className="p-4 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
              <h2 className="font-semibold text-lg">{showChat ? 'In-Meeting Chat' : 'Participants'}</h2>
              <button 
                onClick={() => { setShowChat(false); setShowParticipants(false); }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Chat Panel */}
            {showChat && (
              <>
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">No messages yet. Start the conversation!</div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.sender === userName ? 'items-end' : 'items-start'}`}>
                        <div className="text-xs text-gray-500 mb-1 flex gap-2">
                          <span>{msg.sender === userName ? 'You' : msg.sender}</span>
                          <span>{msg.time}</span>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl max-w-[90%] ${
                          msg.sender === userName ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-gray-800 bg-gray-800/30">
                  <form onSubmit={sendMessage} className="relative">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..." 
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* Participants Panel */}
            {showParticipants && (
              <div className="flex-1 p-2 overflow-y-auto">
                <div className="p-3 bg-gray-800/50 rounded-xl mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{userName} (You)</div>
                      <div className="text-xs text-green-400">In Meeting</div>
                    </div>
                  </div>
                  <div className="flex gap-2 text-gray-400">
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-400" />}
                    {isVideoOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
                
                {remoteStream ? (
                  <div className="p-3 bg-gray-800/30 rounded-xl flex items-center justify-between border border-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
                        {remoteUserName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{remoteUserName}</div>
                        <div className="text-xs text-green-400">In Meeting</div>
                      </div>
                    </div>
                    {/* We don't have remote mic/cam status trivially without sending signaling data, 
                        so we just show they are connected */}
                    <div className="text-xs bg-gray-700 px-2 py-1 rounded-md text-gray-300">
                      Connected
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 mt-10 text-sm">
                    No one else is here yet.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
