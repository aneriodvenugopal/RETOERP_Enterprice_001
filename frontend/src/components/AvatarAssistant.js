import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Volume2, VolumeX, Search, Home, MapPin, Users, CreditCard, TrendingUp, Mail, Building, HardHat } from 'lucide-react';

const AvatarAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [language, setLanguage] = useState('english'); // english, telugu, hindi
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Feature explanations in multiple languages
  const features = {
    welcome: {
      english: "Hello! I'm your RETOERP guide! Search for any feature or ask me anything.",
      telugu: "నమస్కారం! నేను మీ RETOERP గైడ్! ఏదైనా ఫీచర్ కోసం సెర్చ్ చేయండి లేదా నన్ను అడగండి.",
      hindi: "नमस्ते! मैं आपकी RETOERP गाइड हूँ! किसी भी फीचर को खोजें या मुझसे पूछें।"
    },
    login: {
      english: "Login page lets you access your RETOERP dashboard. Use your mobile number to receive OTP and login securely.",
      telugu: "లాగిన్ పేజీ మీ RETOERP డాష్‌బోర్డ్‌ను యాక్సెస్ చేయడానికి అనుమతిస్తుంది. OTP పొందడానికి మీ మొబైల్ నంబర్‌ను ఉపయోగించండి మరియు సురక్షితంగా లాగిన్ అవ్వండి.",
      hindi: "लॉगिन पेज आपको अपने RETOERP डैशबोर्ड तक पहुंचने देता है। OTP प्राप्त करने के लिए अपने मोबाइल नंबर का उपयोग करें।",
      link: "/login"
    },
    crm: {
      english: "Smart CRM tracks every lead automatically with 0% lead leakage. Automated follow-ups ensure no opportunity is missed.",
      telugu: "స్మార్ట్ CRM ప్రతి లీడ్‌ను స్వయంచాలకంగా ట్రాక్ చేస్తుంది, 0% లీడ్ లీకేజ్‌తో. స్వయంచాలిత ఫాలో-అప్‌లు అవకాశాలు తప్పిపోవు.",
      hindi: "स्मार्ट CRM हर लीड को स्वचालित रूप से ट्रैक करता है। 0% लीड लीकेज के साथ।",
      link: "/solutions/crm"
    },
    property: {
      english: "Visual Property Layouts show interactive maps with real-time availability. Customers can see plots and book directly - 3X higher conversions!",
      telugu: "విజువల్ ప్రాపర్టీ లేఅవుట్స్ రియల్-టైమ్ లభ్యతతో ఇంటరాక్టివ్ మ్యాప్‌లను చూపిస్తాయి. కస్టమర్‌లు ప్లాట్‌లను చూసి నేరుగా బుక్ చేయవచ్చు - 3X ఎక్కువ మార్పిడులు!",
      hindi: "विज़ुअल प्रॉपर्टी लेआउट रियल-टाइम उपलब्धता के साथ इंटरैक्टिव मैप दिखाते हैं।",
      link: "/solutions/property-layouts"
    },
    advisory: {
      english: "FREE 24x7 Expert Advisory provides guidance on budget, location, numerology and investment - in multiple languages!",
      telugu: "ఉచిత 24x7 ఎక్స్‌పర్ట్ అడ్వైజరీ బడ్జెట్, స్థానం, న్యూమరాలజీ మరియు ఇన్వెస్ట్‌మెంట్‌పై మార్గదర్శకత్వం అందిస్తుంది - బహుళ భాషలలో!",
      hindi: "मुफ्त 24x7 विशेषज्ञ सलाह बजट, स्थान और निवेश पर मार्गदर्शन प्रदान करती है।",
      link: "/advisory"
    },
    workforce: {
      english: "Workforce Map helps find skilled construction workers - carpenters, electricians, masons nearby with direct contact.",
      telugu: "వర్క్‌ఫోర్స్ మ్యాప్ నైపుణ్యం కలిగిన నిర్మాణ కార్మికులను కనుగొనడంలో సహాయపడుతుంది - వడ్రంగులు, ఎలక్ట్రీషియన్లు, మేస్త్రీలు.",
      hindi: "वर्कफोर्स मैप कुशल निर्माण श्रमिकों को खोजने में मदद करता है।",
      link: "/workforce-map"
    },
    dashboard: {
      english: "Dashboard shows your business overview - leads, bookings, revenue, and team performance in one place.",
      telugu: "డాష్‌బోర్డ్ మీ వ్యాపార అవలోకనాన్ని చూపిస్తుంది - లీడ్స్, బుకింగ్‌లు, ఆదాయం మరియు టీమ్ పనితీరు ఒకే చోట.",
      hindi: "डैशबोर्ड आपके व्यवसाय का अवलोकन दिखाता है - लीड्स, बुकिंग, राजस्व।",
      link: "/dashboard"
    },
    contact: {
      english: "Contact us anytime! Phone: +91 9948303060, Email: admin@retoerp.com. We're here to help!",
      telugu: "ఎప్పుడైనా మమ్మల్ని సంప్రదించండి! ఫోన్: +91 9948303060, ఇమెయిల్: admin@retoerp.com. మేము సహాయం చేయడానికి ఇక్కడ ఉన్నాము!",
      hindi: "किसी भी समय संपर्क करें! फोन: +91 9948303060, ईमेल: admin@retoerp.com।",
      link: "/contact"
    }
  };

  // Search index for smart search
  const searchIndex = [
    { keywords: ['login', 'signin', 'enter', 'access'], feature: 'login', icon: <Home className="w-4 h-4" /> },
    { keywords: ['crm', 'leads', 'customers', 'follow'], feature: 'crm', icon: <Users className="w-4 h-4" /> },
    { keywords: ['property', 'layout', 'map', 'plots', 'visual'], feature: 'property', icon: <MapPin className="w-4 h-4" /> },
    { keywords: ['advisory', 'expert', 'guidance', 'advice', 'consult'], feature: 'advisory', icon: <MessageCircle className="w-4 h-4" /> },
    { keywords: ['workforce', 'workers', 'labour', 'carpenter', 'mason'], feature: 'workforce', icon: <HardHat className="w-4 h-4" /> },
    { keywords: ['dashboard', 'overview', 'stats', 'analytics'], feature: 'dashboard', icon: <TrendingUp className="w-4 h-4" /> },
    { keywords: ['contact', 'phone', 'email', 'support', 'help'], feature: 'contact', icon: <Mail className="w-4 h-4" /> }
  ];

  // Smart search function
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results = searchIndex.filter(item =>
      item.keywords.some(keyword => keyword.includes(query.toLowerCase()))
    );
    setSearchResults(results);
  };

  // Speak text using Web Speech API with natural human-like delivery
  const speak = (text) => {
    if (!speechEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    
    // Add natural pauses for better human-like speech
    const naturalText = text
      .replace(/\./g, '...') // Longer pause after sentences
      .replace(/,/g, '..') // Short pause after commas
      .replace(/\?/g, '...?') // Pause before question mark
      .replace(/!/g, '...!'); // Pause before exclamation
    
    const utterance = new SpeechSynthesisUtterance(naturalText);
    
    // More human-like settings
    utterance.rate = 0.8; // Even slower for natural conversational pace
    utterance.pitch = 1.15; // Moderate sweetness, not too high
    utterance.volume = 0.85; // Softer, more intimate volume

    const voices = window.speechSynthesis.getVoices();
    
    // Select voice based on language
    let selectedVoice = null;
    
    if (language === 'telugu') {
      // For Telugu, try Telugu voices first, then Indian English
      selectedVoice = voices.find(voice => 
        voice.lang.includes('te-IN') || // Telugu
        voice.lang.includes('te') ||
        voice.name.includes('Telugu')
      );
      
      // If no Telugu voice, use Indian English (sounds better for Telugu transliteration)
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          (voice.lang.includes('en-IN') && voice.name.toLowerCase().includes('female')) ||
          (voice.lang.includes('hi-IN') && voice.name.toLowerCase().includes('female'))
        );
      }
    } else if (language === 'hindi') {
      // For Hindi, try Hindi voices
      selectedVoice = voices.find(voice => 
        voice.lang.includes('hi-IN') ||
        voice.name.includes('हिन्दी') ||
        voice.name.includes('Hindi') ||
        voice.name.includes('Heera') ||
        voice.name.includes('Kalpana')
      );
    } else {
      // For English, try Indian English female voices
      selectedVoice = voices.find(voice => 
        (voice.lang.includes('en-IN') && voice.name.toLowerCase().includes('female'))
      );
    }
    
    // Fallback to best quality voices
    if (!selectedVoice) {
      selectedVoice = voices.find(voice =>
        voice.name.includes('Samantha') || // iOS - Most natural!
        voice.name.includes('Google हिन्दी') ||
        voice.name.includes('Rishi') || // Indian male but natural
        voice.name.includes('Veena') || // Indian female
        voice.name.includes('Google UK English Female') ||
        voice.name.includes('Serena')
      );
    }
    
    // Last resort - any female voice
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman')
      );
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`🎤 Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
    }

    // Add natural speech events for more human feel
    let wordIndex = 0;
    const words = text.split(' ');
    
    utterance.onboundary = (event) => {
      // Add slight pitch variation for each word (more expressive)
      if (wordIndex < words.length) {
        // Vary pitch naturally (between 1.1 and 1.2)
        const pitchVariation = 1.1 + (Math.random() * 0.1);
        wordIndex++;
      }
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      console.log('🔊 Speaking:', text.substring(0, 50) + '...');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      wordIndex = 0;
    };
    
    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const showFeature = (featureKey) => {
    const message = features[featureKey][language];
    setCurrentMessage(message);
    if (speechEnabled) speak(message);
  };

  const handleFeatureClick = (featureKey) => {
    showFeature(featureKey);
    const link = features[featureKey].link;
    if (link) {
      setTimeout(() => {
        window.location.href = link;
      }, 3000); // Go to page after 3 seconds
    }
  };

  useEffect(() => {
    if (isOpen && !currentMessage) {
      showFeature('welcome');
    }
  }, [isOpen, language]);

  useEffect(() => {
    if (window.speechSynthesis) {
      // Load voices with detailed logging
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        
        console.log('=== ALL AVAILABLE VOICES ===');
        console.log('Total voices:', voices.length);
        
        // Group by language
        const teluguVoices = voices.filter(v => v.lang.includes('te'));
        const hindiVoices = voices.filter(v => v.lang.includes('hi'));
        const indianEnglish = voices.filter(v => v.lang.includes('en-IN'));
        const femaleVoices = voices.filter(v => 
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('woman') ||
          v.name.includes('Samantha') ||
          v.name.includes('Serena')
        );
        
        if (teluguVoices.length > 0) {
          console.log('\n🇮🇳 Telugu Voices:');
          teluguVoices.forEach(v => console.log(`  - ${v.name} (${v.lang})`));
        } else {
          console.log('\n❌ No Telugu voices available');
        }
        
        if (hindiVoices.length > 0) {
          console.log('\n🇮🇳 Hindi Voices:');
          hindiVoices.forEach(v => console.log(`  - ${v.name} (${v.lang})`));
        } else {
          console.log('\n❌ No Hindi voices available');
        }
        
        if (indianEnglish.length > 0) {
          console.log('\n🇮🇳 Indian English Voices:');
          indianEnglish.forEach(v => console.log(`  - ${v.name} (${v.lang})`));
        }
        
        if (femaleVoices.length > 0) {
          console.log('\n👩 Female Voices (Best for natural sound):');
          femaleVoices.slice(0, 5).forEach(v => console.log(`  - ${v.name} (${v.lang})`));
        }
        
        console.log('\n💡 Tip: For best Telugu/Hindi experience:');
        console.log('   - Chrome: Install Google TTS extension');
        console.log('   - Windows: Add Hindi language pack');
        console.log('   - Android: Google Text-to-Speech app');
        console.log('================================\n');
      };
      
      // Load immediately
      loadVoices();
      
      // Chrome needs this event
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Force reload after 1 second (Chrome workaround)
      setTimeout(loadVoices, 1000);
    }
  }, []);

  return (
    <>
      {/* Floating Avatar Icon - Smaller and Professional */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-40 cursor-pointer group"
          title="Need help? Click me!"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-50"></div>
            <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Expanded Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-sm">RETOERP Assistant</h3>
                  <p className="text-xs text-white/80">
                    {isSpeaking ? '🔊 Speaking...' : 'Ask me anything'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setSpeechEnabled(!speechEnabled);
                    if (speechEnabled) stopSpeaking();
                  }}
                  className="p-1.5 hover:bg-white/20 rounded transition"
                >
                  {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    stopSpeaking();
                    setCurrentMessage('');
                  }}
                  className="p-1.5 hover:bg-white/20 rounded transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex gap-1 mt-2">
              {['english', 'telugu', 'hindi'].map(lang => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    stopSpeaking();
                  }}
                  className={`px-2 py-1 text-xs rounded transition ${
                    language === lang 
                      ? 'bg-white text-purple-600 font-semibold' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {lang === 'english' ? 'English' : lang === 'telugu' ? 'తెలుగు' : 'हिंदी'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={language === 'telugu' ? 'సెర్చ్ చేయండి...' : language === 'hindi' ? 'खोजें...' : 'Search features...'}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFeatureClick(result.feature)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-purple-50 rounded text-left text-sm"
                  >
                    {result.icon}
                    <span className="font-medium">{result.feature.charAt(0).toUpperCase() + result.feature.slice(1)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Area */}
          {currentMessage && (
            <div className="p-3 max-h-40 overflow-y-auto bg-gray-50">
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 relative text-sm">
                {isSpeaking && (
                  <div className="absolute -left-1 top-3 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                )}
                <p className="text-gray-700 leading-relaxed">{currentMessage}</p>
              </div>
            </div>
          )}

          {/* Quick Actions - Only if no search */}
          {!searchQuery && (
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-2 font-medium">
                {language === 'telugu' ? 'త్వరిత చర్యలు' : language === 'hindi' ? 'त्वरित कार्य' : 'Quick Actions'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleFeatureClick('login')} className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-medium transition flex items-center gap-1">
                  <Home className="w-3 h-3" /> Login
                </button>
                <button onClick={() => handleFeatureClick('advisory')} className="px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs font-medium transition flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> Advisory
                </button>
                <button onClick={() => handleFeatureClick('property')} className="px-2 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs font-medium transition flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Property
                </button>
                <button onClick={() => handleFeatureClick('workforce')} className="px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded text-xs font-medium transition flex items-center gap-1">
                  <HardHat className="w-3 h-3" /> Workers
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AvatarAssistant;
