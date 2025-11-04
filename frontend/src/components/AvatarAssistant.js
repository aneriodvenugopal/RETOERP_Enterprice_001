import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Volume2, VolumeX } from 'lucide-react';

const AvatarAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Feature explanations
  const features = {
    welcome: "Hello! I'm your RETOERP guide! Click on me anytime to learn about our features. What would you like to know?",
    crm: "Our Smart CRM tracks every lead automatically - no more lost opportunities! It sends automatic follow-ups and ensures 0% lead leakage.",
    propertyLayouts: "Visual Property Layouts let customers see interactive maps with real-time availability. They can click on plots and book directly - increasing conversions by 3X!",
    advisory: "FREE 24x7 Expert Advisory provides professional guidance on budget, location, numerology, and investment - available in multiple languages!",
    payments: "Multi-gateway payments support Razorpay and Stripe. Accept payments online, generate receipts automatically, and track everything in one place!",
    analytics: "Smart Analytics Dashboard shows you real-time insights - conversion rates, revenue trends, agent performance, and more. Make data-driven decisions!",
    communication: "Automated SMS, Email & WhatsApp campaigns save time and money. Send bulk messages, schedule campaigns, and track delivery - all automated!",
    resale: "Resale Marketplace generates 15-25% additional revenue by listing resale properties. Buyers and sellers connect directly on your platform!",
    workforceMap: "Construction Workforce Map helps you find skilled workers nearby - carpenters, electricians, masons, and more. All contacts in one place!"
  };

  // Speak text using Web Speech API
  const speak = (text) => {
    if (!speechEnabled || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set voice (prefer female voice if available)
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Google UK English Female') ||
      voice.name.includes('Microsoft Zira')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Show feature explanation
  const showFeature = (featureKey) => {
    const message = features[featureKey];
    setCurrentMessage(message);
    if (speechEnabled) {
      speak(message);
    }
  };

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && !currentMessage) {
      showFeature('welcome');
    }
  }, [isOpen]);

  // Load voices on mount
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  return (
    <>
      {/* Floating Avatar Icon */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 cursor-pointer group"
          title="Click me for help!"
        >
          {/* Avatar Circle with Animation */}
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            
            {/* Avatar */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              {/* Avatar Face */}
              <div className="text-white text-3xl">👩‍💼</div>
            </div>
            
            {/* Speech bubble hint */}
            <div className="absolute -top-12 right-0 bg-white px-3 py-1 rounded-lg shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              Need help? Click me!
              <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white"></div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">
                  👩‍💼
                </div>
                <div>
                  <h3 className="font-bold">RETOERP Assistant</h3>
                  <p className="text-xs text-white/80">
                    {isSpeaking ? '🔊 Speaking...' : 'Here to help 24/7'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSpeechEnabled(!speechEnabled);
                    if (speechEnabled) stopSpeaking();
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                  title={speechEnabled ? 'Mute voice' : 'Enable voice'}
                >
                  {speechEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    stopSpeaking();
                    setCurrentMessage('');
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Message Area */}
          <div className="p-4 max-h-64 overflow-y-auto bg-gray-50">
            {currentMessage && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative">
                {/* Animated mouth indicator */}
                {isSpeaking && (
                  <div className="absolute -left-2 top-4 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                )}
                <p className="text-gray-700 leading-relaxed">{currentMessage}</p>
              </div>
            )}
          </div>

          {/* Feature Buttons */}
          <div className="p-4 bg-white border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3 font-medium">What would you like to learn about?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => showFeature('crm')}
                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition"
              >
                📊 Smart CRM
              </button>
              <button
                onClick={() => showFeature('propertyLayouts')}
                className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition"
              >
                🗺️ Property Maps
              </button>
              <button
                onClick={() => showFeature('advisory')}
                className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition"
              >
                💡 Expert Advisory
              </button>
              <button
                onClick={() => showFeature('payments')}
                className="px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium transition"
              >
                💳 Payments
              </button>
              <button
                onClick={() => showFeature('analytics')}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition"
              >
                📈 Analytics
              </button>
              <button
                onClick={() => showFeature('communication')}
                className="px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg text-sm font-medium transition"
              >
                📧 Communication
              </button>
              <button
                onClick={() => showFeature('resale')}
                className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-medium transition"
              >
                🏘️ Resale Market
              </button>
              <button
                onClick={() => showFeature('workforceMap')}
                className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-sm font-medium transition"
              >
                👷 Workforce Map
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarAssistant;
