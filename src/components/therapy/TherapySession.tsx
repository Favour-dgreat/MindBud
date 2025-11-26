
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Loader2, BrainCircuit, X } from "lucide-react";
import { cn } from "@/lib/utils";
import DisclaimerDialog from "./DisclaimerDialog";
import { therapyConversation } from "@/ai/flows/therapy-conversation";
import type { MessageData } from 'genkit';
import { useWellnessStore } from "@/lib/data";

type TranscriptItem = {
  speaker: "user" | "ai";
  text: string;
};

// A state machine to manage the session's flow and prevent race conditions.
type SessionState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function TherapySession() {
  const [isMounted, setIsMounted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const currentTranscriptRef = useRef("");
  const [history, setHistory] = useState<MessageData[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [voice, setVoice] = useState('Algenib');

  const { currentMood, sleepHours, steps } = useWellnessStore();

  // Refs for state access inside callbacks without re-triggering effects
  const sessionStateRef = useRef<SessionState>('idle');

  // Update refs when state changes
  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  const aiAvatar = PlaceHolderImages.find((p) => p.id === "therapy-session-ai");

  // --- Client-side Initialization ---
  useEffect(() => {
    setIsMounted(true);
    audioRef.current = new Audio();
    const savedVoice = localStorage.getItem('aiVoice') || 'Algenib';
    setVoice(savedVoice);
  }, []);

  const playAudio = useCallback((audioDataUri: string) => {
    if (audioRef.current) {
      setSessionState('speaking');
      audioRef.current.src = audioDataUri;

      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing audio:", error);
          // If play fails, go back to idle to allow user to try again.
          setSessionState('idle');
        });
      }

      audioRef.current.onended = () => {
        // After audio finishes, return to idle
        setSessionState('idle');
      };

      audioRef.current.onerror = (e) => {
        console.error("Audio element error:", e);
        setSessionState('idle');
      };
    }
  }, []);


  const handleSpeech = useCallback(async (text: string) => {
    if (!text) {
      setSessionState('idle');
      return;
    }

    setSessionState('thinking'); // Move to thinking state while waiting for AI.

    const userMessage: TranscriptItem = { speaker: "user", text };
    setTranscript((prev) => [...prev, userMessage]);

    const currentHistory: MessageData[] = [...history, { role: 'user', content: [{ text }] }];
    setHistory(currentHistory);

    try {
      const result = await therapyConversation({
        history: currentHistory.map(h => ({
          role: h.role as 'user' | 'model',
          content: h.content.map(part => ({ text: part.text || '' }))
        })),
        message: text,
        voiceName: voice,
        userContext: {
          mood: currentMood,
          sleepHours: sleepHours,
          steps: steps
        }
      });
      const aiMessage: TranscriptItem = { speaker: "ai", text: result.response };

      setTranscript((prev) => [...prev, aiMessage]);
      setHistory((prev) => [...prev, { role: 'model', content: [{ text: result.response }] }]);

      if (result.audio) {
        playAudio(result.audio);
      } else {
        // If there's no audio (e.g., TTS failed), return to idle
        setSessionState('idle');
      }

    } catch (error) {
      console.error("Error with therapy conversation flow:", error);
      const errorMessage = "I'm having a little trouble connecting right now. Please give me a moment.";
      const aiMessage: TranscriptItem = { speaker: "ai", text: errorMessage };
      setTranscript((prev) => [...prev, aiMessage]);
      setHistory((prev) => [...prev, { role: 'model', content: [{ text: errorMessage }] }]);

      setSessionState('idle');
    }
  }, [history, voice, playAudio, currentMood, sleepHours, steps]);

  // --- Speech Recognition Setup ---
  useEffect(() => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window)) {
      console.log("Speech recognition not supported");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
    }
    const recognition = recognitionRef.current;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      if (sessionStateRef.current !== 'listening') setSessionState('listening');
    };

    recognition.onend = () => {
      // After user stops speaking, we remain in idle/stopped state
      // Do not auto-restart
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);

      if (event.error === 'not-allowed') {
        const message = `Microphone access is required for voice therapy sessions.

To enable microphone access:

Chrome/Edge:
1. Click the lock icon (🔒) or camera icon in the address bar
2. Find "Microphone" and change to "Allow"
3. Reload the page and try again

Safari:
1. Safari menu → Settings for This Website
2. Set Microphone to "Allow"
3. Or: System Settings → Privacy & Security → Microphone → Enable Safari

Firefox:
1. Click the microphone icon in the address bar
2. Select "Allow" for microphone access
3. Reload the page and try again`;

        alert(message);
      } else if (event.error === 'no-speech') {
        // User didn't speak, just return to idle quietly
        setSessionState('idle');
        return;
      } else if (event.error === 'audio-capture') {
        alert('No microphone was found or microphone is not working. Please check your device settings.');
      }

      setSessionState('idle');
    };

    recognition.onstart = () => {
      console.log('Speech recognition started');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      if (transcript) {
        setCurrentTranscript(transcript);
        currentTranscriptRef.current = transcript;
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [handleSpeech]);

  const toggleListen = () => {
    if (sessionState === 'listening') {
      // Stop listening and put transcript into text field
      recognitionRef.current?.stop();
      const text = currentTranscriptRef.current.trim();
      if (text) {
        setMessageInput(text);
      }
      setCurrentTranscript("");
      currentTranscriptRef.current = "";
      setSessionState('idle');
    } else if (sessionState === 'idle') {
      // Just start listening - SpeechRecognition will request permissions if needed
      try {
        setSessionState('listening');
        setCurrentTranscript("");
        currentTranscriptRef.current = "";
        setMessageInput(""); // Clear input when starting voice
        recognitionRef.current?.start();
      } catch (error: any) {
        console.error('Speech recognition start error:', error);
        alert('Unable to start voice input. Please check your browser permissions and try again.');
        setSessionState('idle');
      }
    }
  };

  const handleSendMessage = () => {
    const text = messageInput.trim();
    if (!text || sessionState !== 'idle') return;

    setMessageInput("");
    handleSpeech(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDisclaimerAgree = () => {
    setShowDisclaimer(false);
    setSessionState('idle');
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);



  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (showDisclaimer) {
    return <DisclaimerDialog onAgree={handleDisclaimerAgree} />;
  }

  const isSendDisabled = !messageInput.trim() || sessionState !== 'idle';
  const isMicDisabled = sessionState === 'thinking' || sessionState === 'speaking';

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {aiAvatar && (
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
              <video
                src={aiAvatar.imageUrl}
                data-ai-hint={aiAvatar.imageHint}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-white">Bloom</h2>
            <p className="text-xs text-gray-400">AI Therapy Companion</p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/dashboard')}
          size="sm"
          variant="ghost"
          className="text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {transcript.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <BrainCircuit className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Start a conversation with Bloom</p>
            <p className="text-sm mt-2">Type a message or use voice input</p>
          </div>
        )}

        {transcript.map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              item.speaker === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 shadow-lg",
                item.speaker === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-gray-700 text-white rounded-bl-sm'
              )}
            >
              <p className="text-sm leading-relaxed">{item.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {(sessionState === 'thinking' || sessionState === 'speaking') && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {sessionState === 'thinking' ? 'Bloom is thinking...' : 'Bloom is responding...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice transcription preview */}
      {sessionState === 'listening' && currentTranscript && (
        <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
          <p className="text-sm text-gray-400 italic">Listening: {currentTranscript}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleListen}
            size="lg"
            variant="ghost"
            className={cn(
              "rounded-full w-12 h-12 transition-all",
              sessionState === 'listening'
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-white",
              isMicDisabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={isMicDisabled}
          >
            {sessionState === 'listening' ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={sessionState !== 'idle'}
          />

          <Button
            onClick={handleSendMessage}
            size="lg"
            className={cn(
              "rounded-full w-12 h-12",
              isSendDisabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={isSendDisabled}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

