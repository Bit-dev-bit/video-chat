import Link from 'next/link';
import { Video, MessageSquare, MonitorUp, Users, UserX, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-gray-950 text-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">MeetSync</span>
          </div>
          <nav className="flex gap-6 text-sm font-medium text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="#" className="hover:text-white transition-colors">About</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full max-w-5xl mx-auto px-6 py-24 text-center flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Simple. Fast. Reliable Video Meetings.
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl">
            Connect with your classmates, friends and teams using real-time video communication. No downloads or accounts required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/join?action=create" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              Create Meeting
            </Link>
            <Link 
              href="/join" 
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 border border-gray-700"
            >
              Join Meeting
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="w-full bg-gray-900 py-24 border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
              <p className="text-gray-400">Built for seamless college project demonstrations and real-world usage.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Video className="w-6 h-6 text-blue-400" />}
                title="HD Video Calling"
                description="Crystal clear peer-to-peer video connections powered by WebRTC."
              />
              <FeatureCard 
                icon={<MessageSquare className="w-6 h-6 text-green-400" />}
                title="Real-Time Chat"
                description="Send text messages to meeting participants instantly during calls."
              />
              <FeatureCard 
                icon={<MonitorUp className="w-6 h-6 text-purple-400" />}
                title="Screen Sharing"
                description="Share your screen, presentations, or specific application windows easily."
              />
              <FeatureCard 
                icon={<Users className="w-6 h-6 text-orange-400" />}
                title="Participant Management"
                description="See who is in the room and view their microphone and camera status."
              />
              <FeatureCard 
                icon={<UserX className="w-6 h-6 text-pink-400" />}
                title="No Account Required"
                description="Just enter your name, create a room, and share the link. No friction."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>Built as a college project demonstrating WebRTC capabilities.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl hover:bg-gray-800 transition-colors">
      <div className="bg-gray-900 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-100">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
