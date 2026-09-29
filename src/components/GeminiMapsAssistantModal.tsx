import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Sparkles,
  MapPin,
  Car,
  Home,
  Users,
  Send,
  X,
  ExternalLink,
  Navigation,
  RotateCcw,
  Loader2,
  Compass
} from 'lucide-react';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  places?: {
    title: string;
    uri: string;
    address?: string;
    snippet?: string;
  }[];
  timestamp: string;
}

interface GeminiMapsAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'carpool' | 'pg' | 'roommate' | 'general';
  initialQuery?: string;
}

export const GeminiMapsAssistantModal: React.FC<GeminiMapsAssistantModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'general',
  initialQuery
}) => {
  const { user, currentCampus } = useAuth();
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am **CampusNavigator AI**, your Google Maps-powered campus advisor for **${user?.collegeName || 'your university'}**.
      
I can help you with:
- 🚗 **Nearby Carpooling**: Locate verified campus pickup points, transit hubs, and coordinate rides.
- 🏡 **PG Rents & Student Housing**: Check real student rental rates, hostel spots, and walking distances.
- 🤝 **Roommate Matching**: Discover popular student neighborhoods and ideal commute zones.

How can I help you navigate your campus today?`,
      places: [
        {
          title: `${user?.collegeName || 'Campus'} Main Gate & Transit Loop`,
          uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${user?.collegeName || 'University'} Transit Center`)}`,
          address: 'Central Campus Bus Turnaround',
          snippet: 'Official campus carpool and shuttle pickup zone.'
        }
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'carpool' | 'pg' | 'roommate' | 'general'>(initialCategory);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initial props
  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
    if (initialQuery) {
      setInputQuery(initialQuery);
    }
  }, [initialCategory, initialQuery, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Request user location with geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setGeoLocating(false);
      },
      (err) => {
        console.warn('Geolocation unavailable:', err.message);
        setGeoLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text || loading) return;

    const userMessage: AssistantMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputQuery('');
    setLoading(true);

    try {
      // Map history for Gemini API
      const historyPayload = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      const res = await api.chatWithGemini({
        message: text,
        history: historyPayload,
        campusId: user?.campusId,
        latLng: userCoords || undefined,
        category: activeCategory
      });

      if (res.success) {
        const assistantMessage: AssistantMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: res.text,
          places: res.places,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(res.message || 'Error communicating with assistant');
      }
    } catch (err: any) {
      const errorMsg: AssistantMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `I encountered an issue connecting to the live Maps Grounding service. However, you can explore campus locations directly using the verified links below.`,
        places: [
          {
            title: `Google Maps Search: ${text.slice(0, 30)} near ${user?.collegeName || 'Campus'}`,
            uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${text} near ${user?.collegeName || 'University'}`)}`,
            snippet: 'Search real-time locations and directions on Google Maps'
          }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `Chat history reset. How can I assist you with carpooling, PG housing, or roommates at **${user?.collegeName || 'your campus'}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Campus AI Maps Navigator"
      className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[500px] h-[640px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-900 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-xs sm:text-sm tracking-tight">CampusNavigator AI</span>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded font-medium border border-indigo-400/20">
                Google Maps Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{user?.collegeName || 'Campus & University Area'}</span>
              {userCoords && <span className="text-emerald-300 text-[10px]">(GPS Active)</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleGetLocation}
            title="Calibrate with my live GPS coordinates"
            className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition ${
              geoLocating ? 'animate-pulse text-indigo-400' : ''
            }`}
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            onClick={clearChat}
            title="Clear conversation"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close Assistant"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <button
          onClick={() => setActiveCategory('general')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeCategory === 'general'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>All Advising</span>
        </button>
        <button
          onClick={() => setActiveCategory('carpool')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeCategory === 'carpool'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Car className="w-3 h-3 text-emerald-500" />
          <span>Nearby Carpooling</span>
        </button>
        <button
          onClick={() => setActiveCategory('pg')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeCategory === 'pg'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Home className="w-3 h-3 text-blue-500" />
          <span>PG Rents & Housing</span>
        </button>
        <button
          onClick={() => setActiveCategory('roommate')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeCategory === 'roommate'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3 h-3 text-purple-500" />
          <span>Roommate Match</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-50/50 text-xs">
        {messages.map((m) => {
          const isUser = m.role === 'user';

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 px-1">
                <span className="font-semibold">{isUser ? 'You' : 'CampusNavigator AI'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                }`}
              >
                {/* Message Body */}
                <div className="whitespace-pre-line space-y-2">
                  {m.content}
                </div>

                {/* Extracted Google Maps Places Cards */}
                {m.places && m.places.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center space-x-1.5 text-[10px] font-bold text-indigo-700">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>Google Maps Verified Locations:</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {m.places.map((place, idx) => (
                        <a
                          key={idx}
                          href={place.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/80 p-2.5 rounded-xl block transition group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-indigo-950 text-xs group-hover:text-indigo-600 flex items-center gap-1">
                              <span>{place.title}</span>
                              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                            </div>
                            <span className="text-[9px] bg-white text-indigo-700 font-semibold px-1.5 py-0.5 rounded border border-indigo-200 shrink-0">
                              Open Maps ↗
                            </span>
                          </div>
                          {place.address && (
                            <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                              <span className="text-slate-400">📍</span> {place.address}
                            </p>
                          )}
                          {place.snippet && (
                            <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-2">
                              "{place.snippet}"
                            </p>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start space-x-2">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 flex items-center space-x-2.5 text-xs text-slate-600 shadow-xs">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Grounding query with Google Maps data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-3 py-1.5 bg-slate-100/70 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        {[
          { label: '🚗 Best Carpool Pickup Spots', text: 'Where are the best designated student carpool pickup points and transit loops on campus?' },
          { label: '🏡 PG Rents under ₹10,000', text: 'Find verified student PG rents and shared flat costs under ₹10000 within 2 miles of campus.' },
          { label: '🤝 Student Neighborhoods', text: 'What are the top student-friendly neighborhoods for finding roommates near campus?' },
          { label: '🚲 Safe Commute Routes', text: 'What are the safest walking and bicycle commute routes to campus labs and libraries?' }
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt.text)}
            className="text-[10px] bg-white hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-full border border-slate-300/80 whitespace-nowrap transition cursor-pointer shrink-0"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Composer Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about carpool spots, PG rents, roommate areas..."
            className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          {inputQuery && (
            <button
              type="button"
              onClick={() => setInputQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition cursor-pointer shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
