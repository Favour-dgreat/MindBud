
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles, Heart, Shield } from 'lucide-react';

export default function TherapyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <MessageCircle className="w-16 h-16 text-primary mx-auto animate-pulse" />
          </div>
          <h1 className="text-5xl font-headline font-bold text-white mb-4">
            Talk to Bloom
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Your AI-powered mental wellness companion
          </p>
          <p className="text-md text-gray-400">
            Safe, confidential, and available 24/7
          </p>
        </div>

        {/* Main CTA */}
        <div className="mb-12 flex justify-center">
          <Link href={`/therapy-session/immediate-${Date.now().toString()}`} passHref>
            <Button
              size="lg"
              className="w-full max-w-md h-16 text-lg font-semibold shadow-2xl hover:scale-105 transition-transform"
            >
              <MessageCircle className="mr-3 h-6 w-6" />
              Start Conversation
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Personalized Support
            </h3>
            <p className="text-sm text-gray-400">
              Bloom adapts to your mood, sleep, and daily progress
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors">
            <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Private & Secure
            </h3>
            <p className="text-sm text-gray-400">
              Your conversations are confidential and never shared
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors">
            <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Always Available
            </h3>
            <p className="text-sm text-gray-400">
              Talk whenever you need support, day or night
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-headline font-semibold text-white mb-6">
            How it works
          </h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-start gap-4 text-left">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Start a conversation</h4>
                <p className="text-gray-400 text-sm">Click the button above to begin chatting with Bloom</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-left">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Share what's on your mind</h4>
                <p className="text-gray-400 text-sm">Type or speak your thoughts and feelings</p>
              </div>
            </div>
            <div className="flex items-start gap-4 text-left">
              <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">Get personalized support</h4>
                <p className="text-gray-400 text-sm">Bloom responds with empathy and guidance tailored to you</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
