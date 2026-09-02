'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Video, ArrowRight, Keyboard } from 'lucide-react';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    if (action === 'create') {
      const newRoomId = Math.floor(1000 + Math.random() * 9000).toString(); // e.g., 4829
      router.replace(`/room/${newRoomId}`);
    }
  }, [action, router]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`);
    }
  };

  if (action === 'create') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl text-gray-400">Creating your meeting...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-xl">
            <Video className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">Join a Meeting</h1>
        <p className="text-gray-400 text-center mb-8">Enter the meeting ID provided by the host.</p>
        
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Keyboard className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder-gray-500"
              placeholder="e.g. 1234"
              required
              maxLength={4}
              pattern="\d{4}"
              title="Please enter a 4-digit code"
            />
          </div>
          <button
            type="submit"
            disabled={!roomId.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Join Meeting
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-[100dvh] bg-gray-950 text-white flex flex-col">
      <header className="border-b border-gray-800 p-4 shrink-0">
        <div className="container mx-auto flex items-center cursor-pointer" onClick={() => window.location.href='/'}>
          <Video className="w-5 h-5 text-blue-500 mr-2" />
          <span className="font-bold">MeetSync</span>
        </div>
      </header>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <JoinContent />
      </Suspense>
    </div>
  );
}
