'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';

interface LobbyProps {
  roomId: string;
  onJoin: (name: string, stream: MediaStream | null) => void;
}

export default function Lobby({ roomId, onJoin }: LobbyProps) {
  const [name, setName] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    async function setupMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Unable to access camera or microphone. You can still join without them.');
        // Create an empty stream so we can still join
      }
    }
    setupMedia();

    return () => {
      // Clean up stream if component unmounts before joining
      // But we shouldn't stop tracks here if we are passing them to the meeting
    };
  }, []);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleJoinClick = () => {
    if (!name.trim()) return;
    onJoin(name.trim(), stream);
  };

  return (
    <div className="min-h-[100dvh] bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        
        {/* Video Preview Section */}
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-video bg-gray-800 rounded-2xl overflow-hidden mb-6 flex items-center justify-center shadow-inner">
            {!mounted ? (
               <div className="text-gray-500">Loading camera...</div>
            ) : error ? (
              <div className="text-gray-400 text-center p-4">{error}</div>
            ) : isVideoOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="text-gray-500 flex flex-col items-center">
                <VideoOff className="w-12 h-12 mb-2" />
                <span>Camera is off</span>
              </div>
            )}
            
            {/* Overlay controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition-colors shadow-lg ${
                  isMicOn ? 'bg-gray-700/80 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isMicOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors shadow-lg ${
                  isVideoOn ? 'bg-gray-700/80 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isVideoOn ? <VideoIcon className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-white mb-2">Ready to join?</h1>
          <p className="text-gray-400 mb-8">Meeting ID: <span className="font-mono text-gray-300">{roomId}</span></p>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder-gray-500"
                placeholder="Enter your display name"
                required
              />
            </div>
            <button
              onClick={handleJoinClick}
              disabled={!name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-blue-900/20"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
