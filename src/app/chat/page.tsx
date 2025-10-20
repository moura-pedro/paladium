'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import PropertyCard, { PropertyCardData } from '@/components/PropertyCard';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';
import BookingCard, { BookingCardData } from '@/components/BookingCard';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  properties?: PropertyCardData[];
  bookings?: BookingCardData[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you find and book the perfect property. You can type or use the microphone to speak. How can I assist you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyCardData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          conversationId: conversationId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Debug logging
        console.log('📨 Received response:', {
          hasMessage: !!data.message,
          hasProperties: !!data.properties,
          propertiesCount: data.properties?.length || 0,
          hasBookings: !!data.bookings,
          bookingsCount: data.bookings?.length || 0,
          properties: data.properties,
          bookings: data.bookings,
        });

        // Save conversation ID for future messages
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message || 'I apologize, but I couldn\'t process that request.',
          properties: data.properties, // Include property data if available
          bookings: data.bookings, // Include booking data if available
        };
        
        console.log('💬 Assistant message:', assistantMessage);
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${data.error || 'Something went wrong'}`,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I can help you find and book the perfect property. You can type or use the microphone to speak. How can I assist you today?',
      },
    ]);
  };

  const handleViewPropertyDetails = (property: PropertyCardData) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Don't clear selectedProperty immediately to allow for exit animation
    setTimeout(() => setSelectedProperty(null), 300);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.text) {
        await sendMessage(data.text);
      } else {
        alert('Could not transcribe audio. Please try again or use text input.');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Transcription failed. Please try again or use text input.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="glass-strong sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold">
              ← Paladium
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={startNewConversation}
                className="text-sm px-3 py-1.5 glass-light rounded-lg hover:scale-[1.02] transition-all"
              >
                New Chat
              </button>
              <div className="text-sm text-foreground/70">AI Assistant</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx}>
                <div
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-foreground text-background'
                        : 'glass'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
                
                {/* Property Cards */}
                {msg.properties && msg.properties.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {msg.properties.map((property) => (
                      <PropertyCard
                        key={property.propertyId}
                        property={property}
                        onViewDetails={handleViewPropertyDetails}
                      />
                    ))}
                  </div>
                )}

                {/* Booking Cards */}
                {msg.bookings && msg.bookings.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {msg.bookings.map((booking) => (
                      <BookingCard
                        key={booking.bookingId}
                        booking={booking}
                        onCancel={async (bookingId) => {
                          // Ask the AI to cancel the booking
                          await sendMessage(`Cancel booking ${bookingId}`);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="glass px-4 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="glass-strong border-t border-white/10 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={recording ? 'Recording...' : 'Type a message or use voice...'}
              disabled={loading || recording}
              className="flex-1 glass-light px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-foreground/20 outline-none disabled:opacity-50"
            />
            
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                recording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'glass-light hover:scale-[1.05]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {recording ? '🔴' : '🎙️'}
            </button>

            <button
              type="submit"
              disabled={loading || !input.trim() || recording}
              className="bg-foreground text-background px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              Send
            </button>
          </form>
          
          <p className="text-xs text-center text-foreground/50 mt-2">
            Try: "Find a place in Miami for next weekend" or "Show me my bookings" or "I want to book a property"
          </p>
        </div>
      </div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}

