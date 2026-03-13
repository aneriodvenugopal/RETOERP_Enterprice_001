import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGeoLocation } from '../context/LocationContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Check, Loader2, Mic, Navigation, CheckCircle2, Building2, Search, X, Compass } from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Steps configuration
const STEPS = [
  { 
    id: 'property_type',
    question: "What type of property do you want to post?", 
    type: 'buttons',
    options: [
      { value: 'Plot', label: 'Plot' },
      { value: 'Land', label: 'Land' }
    ]
  },
  { 
    id: 'facing',
    question: "Which direction does it face?", 
    type: 'buttons',
    options: [
      { value: 'East', label: 'East' },
      { value: 'West', label: 'West' },
      { value: 'North', label: 'North' },
      { value: 'South', label: 'South' },
      { value: 'North-East', label: 'N-East' },
      { value: 'North-West', label: 'N-West' },
      { value: 'South-East', label: 'S-East' },
      { value: 'South-West', label: 'S-West' }
    ],
    showFor: ['Plot', 'Land']
  },
  { 
    id: 'is_corner',
    question: "Is it a corner property?", 
    type: 'buttons',
    options: [
      { value: 'Yes', label: 'Yes, Corner' },
      { value: 'No', label: 'No' }
    ],
    showFor: ['Plot', 'Land']
  },
  { 
    id: 'price',
    question: "What's the total price?", 
    type: 'number_with_unit',
    placeholder: "Enter price",
    units: ['Lakhs', 'Crores']
  },
  { 
    id: 'area',
    question: "What's the property size?", 
    type: 'number_with_unit',
    placeholder: "Enter size",
    units_land: ['Acres', 'Guntas', 'Cents'],
    units_plot: ['Sq.Yards', 'Sq.Ft']
  },
  { 
    id: 'negotiable',
    question: "Is the price negotiable?", 
    type: 'buttons',
    options: [
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No' }
    ]
  },
  { 
    id: 'location',
    question: "Where is the property located?", 
    type: 'location'
  }
];

// Map recenter helper
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 14); }, [center, map]);
  return null;
};

// Highlight matching text in search results
const HighlightText = ({ text, query }) => {
  if (!query) return <span>{text}</span>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <strong key={i} className="text-gray-900 font-bold">{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

// Google-style Location Search Component
const GoogleStyleLocationSearch = ({ onSelect, onClose, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchLocations(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const searchLocations = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}, India&limit=8&addressdetails=1&countrycodes=in`,
        { headers: { 'Accept': 'application/json', 'User-Agent': 'RealApex/1.0' } }
      );
      const data = await response.json();
      
      setResults(data.map(r => {
        const mainText = r.address?.village || r.address?.suburb || r.address?.town || 
                        r.address?.city || r.name || r.display_name.split(',')[0];
        const secondaryText = [
          r.address?.state_district, 
          r.address?.state
        ].filter(Boolean).join(', ');
        
        return {
          id: r.place_id,
          mainText,
          secondaryText,
          fullAddress: r.display_name,
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
          city: r.address?.city || r.address?.town || r.address?.village || '',
          state: r.address?.state || '',
          postal_code: r.address?.postcode || ''
        };
      }));
    } catch (err) {
      console.error('Search error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-[2000] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button 
          onClick={onClose} 
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search village, area, city..."
            className="flex-1 bg-transparent border-none outline-none text-lg"
          />
          {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin ml-2" />}
          {query && !loading && (
            <button onClick={() => setQuery('')} className="ml-2">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div>
            {results.map((result, idx) => (
              <button
                key={result.id}
                onClick={() => onSelect(result)}
                className={`w-full px-4 py-4 flex items-start gap-4 text-left hover:bg-blue-50 active:bg-blue-100 ${
                  idx !== results.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg text-gray-600">
                    <HighlightText text={result.mainText} query={query} />
                  </p>
                  <p className="text-base text-gray-400 mt-0.5">{result.secondaryText}</p>
                </div>
              </button>
            ))}
          </div>
        ) : query.length >= 2 && !loading ? (
          <div className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-lg text-gray-500">No locations found</p>
            <p className="text-base text-gray-400 mt-1">Try different spelling</p>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-base font-semibold text-gray-600 mb-4">Popular Areas</p>
            <div className="flex flex-wrap gap-3">
              {['Hyderabad', 'Vijayawada', 'Guntur', 'Tirupati', 'Warangal', 'Bangalore', 'Chennai'].map(city => (
                <button
                  key={city}
                  onClick={() => setQuery(city)}
                  className="px-5 py-3 bg-gray-100 rounded-full text-base font-medium text-gray-700"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Location Picker with Map
const LocationPicker = ({ onSelect, initialPosition }) => {
  const [pos, setPos] = useState(initialPosition);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const MapClick = () => { 
    useMapEvents({ click: (e) => setPos([e.latlng.lat, e.latlng.lng]) }); 
    return null; 
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        });
      });
      setPos([position.coords.latitude, position.coords.longitude]);
      toast.success('Location updated!');
    } catch (err) {
      toast.error('Could not get location');
    }
    setGettingLocation(false);
  };

  const handleSearchSelect = (result) => {
    setPos([result.lat, result.lon]);
    setShowSearch(false);
    toast.success(`Set to ${result.mainText}`);
  };

  const confirm = async () => {
    if (!pos || !pos[0] || !pos[1]) {
      toast.error('Please select a location');
      return;
    }
    setLoading(true);
    
    let locationData = {
      latitude: pos[0],
      longitude: pos[1],
      address: `${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}`,
      city: '',
      state: '',
      postal_code: ''
    };
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}&accept-language=en`);
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) {
          locationData = {
            latitude: pos[0],
            longitude: pos[1],
            address: data.display_name,
            city: data.address?.city || data.address?.town || data.address?.village || '',
            state: data.address?.state || '',
            postal_code: data.address?.postcode || ''
          };
        }
      }
    } catch (err) { 
      console.log('Reverse geocode failed:', err);
    }
    
    setLoading(false);
    onSelect(locationData);
  };

  return (
    <>
      {showSearch && (
        <GoogleStyleLocationSearch 
          onSelect={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}

      <div className="space-y-4">
        {/* Search Button */}
        <button
          onClick={() => setShowSearch(true)}
          className="w-full py-4 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center gap-3 text-lg"
        >
          <Search className="w-5 h-5 text-gray-500" />
          <span className="text-gray-600">Search location...</span>
        </button>

        {/* Map */}
        <div className="relative h-64 rounded-2xl overflow-hidden border-2 border-gray-200">
          <MapContainer center={pos} zoom={14} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={pos} />
            <MapClick />
            <MapRecenter center={pos} />
          </MapContainer>
          
          {/* GPS Button */}
          <button
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="absolute top-3 right-3 bg-white rounded-full shadow-lg p-3 z-[1000]"
          >
            {gettingLocation ? (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5 text-blue-500" />
            )}
          </button>
        </div>

        {/* Confirm Button */}
        <button 
          onClick={confirm} 
          disabled={loading}
          className="w-full py-4 bg-blue-500 text-white font-bold rounded-2xl text-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" /> Confirm Location
            </>
          )}
        </button>
      </div>
    </>
  );
};

// Chat Message Bubble
const ChatBubble = ({ text, isUser, isTyping }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
  >
    <div className={`max-w-[85%] rounded-3xl px-5 py-3 ${
      isUser 
        ? 'bg-blue-500 text-white rounded-br-lg' 
        : 'bg-gray-100 text-gray-900 rounded-bl-lg'
    }`}>
      {isTyping ? (
        <div className="flex gap-1.5 py-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      ) : (
        <p className="text-base leading-relaxed">{text}</p>
      )}
    </div>
  </motion.div>
);

// Success Screen
const SuccessScreen = ({ data, onViewProperties, onPostAnother }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-gradient-to-b from-green-500 to-green-600 flex flex-col items-center justify-center p-6 z-50"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", damping: 15, delay: 0.2 }}
      className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg"
    >
      <CheckCircle2 className="w-14 h-14 text-green-500" />
    </motion.div>
    
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="text-2xl font-bold text-white mb-2"
    >
      Property Posted!
    </motion.h1>
    
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="text-green-100 text-center mb-8"
    >
      Your property is now visible to buyers
    </motion.p>
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl mb-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <Building2 className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{data.property_type}</p>
          <p className="text-sm text-gray-500">{data.location?.split(',')[0] || 'Location set'}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="p-2 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Price</p>
          <p className="font-bold text-gray-900">{data.price}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Size</p>
          <p className="font-bold text-gray-900">{data.area}</p>
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Facing</p>
          <p className="font-bold text-gray-900">{data.facing || '-'}</p>
        </div>
      </div>
    </motion.div>
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1 }}
      className="w-full max-w-sm space-y-3"
    >
      <button onClick={onViewProperties} className="w-full py-4 bg-white text-green-600 font-bold rounded-xl shadow-lg">
        View My Properties
      </button>
      <button onClick={onPostAnother} className="w-full py-4 border-2 border-white text-white font-bold rounded-xl">
        Post Another
      </button>
    </motion.div>
  </motion.div>
);

// Main Component
const QuickPropertyPost = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const { location: userLoc, requestLocation, permissionStatus } = useGeoLocation();
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({});
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // For number input
  const [inputValue, setInputValue] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  
  const endRef = useRef(null);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, typing]);

  useEffect(() => {
    if (permissionStatus === 'prompt') requestLocation();
  }, []);

  // Initial question
  useEffect(() => {
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => { 
        setTyping(false); 
        setMessages([{ text: STEPS[0].question, isUser: false }]); 
      }, 500);
    }, 200);
  }, []);

  const getNextStepIndex = (fromIndex, currentData) => {
    let next = fromIndex + 1;
    while (next < STEPS.length) {
      const step = STEPS[next];
      if (step.showFor) {
        if (step.showFor.includes(currentData.property_type)) {
          return next;
        }
        next++;
      } else {
        return next;
      }
    }
    return next;
  };

  const getCurrentStep = () => {
    const step = STEPS[currentStep];
    if (step.id === 'area' && data.property_type) {
      return {
        ...step,
        units: data.property_type === 'Land' ? step.units_land : step.units_plot
      };
    }
    return step;
  };

  const handleAnswer = (answer) => {
    const step = getCurrentStep();
    
    // Add user's answer to chat
    setMessages(prev => [...prev, { text: answer, isUser: true }]);
    
    // Store data
    const newData = { ...data, [step.id]: answer };
    setData(newData);
    
    // Find next step
    const nextIndex = getNextStepIndex(currentStep, newData);
    
    if (nextIndex >= STEPS.length) {
      setDone(true);
      return;
    }
    
    // Show next question
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => { 
        setTyping(false);
        setCurrentStep(nextIndex);
        setMessages(prev => [...prev, { text: STEPS[nextIndex].question, isUser: false }]);
        setInputValue('');
        setSelectedUnit('');
      }, 400);
    }, 200);
  };

  const handleLocationSelect = (loc) => {
    setMessages(prev => [...prev, { text: `📍 ${loc.address.split(',').slice(0, 2).join(',')}`, isUser: true }]);
    setData(prev => ({ 
      ...prev, 
      location: loc.address, 
      latitude: loc.latitude, 
      longitude: loc.longitude,
      city: loc.city,
      state: loc.state,
      postal_code: loc.postal_code
    }));
    setDone(true);
  };

  const handleNumberSubmit = () => {
    if (!inputValue) {
      toast.error('Please enter a value');
      return;
    }
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }
    handleAnswer(`${inputValue} ${selectedUnit}`);
  };

  const finalize = async () => {
    setLoading(true);
    try {
      const [price, priceUnit] = (data.price || '0 Lakhs').split(' ');
      const [area, ...areaUnitArr] = (data.area || '0 Sq.Ft').split(' ');
      
      await api().post('/properties', {
        property_type: data.property_type || 'Land',
        price: parseFloat(price) || 0,
        price_unit: priceUnit || 'Lakhs',
        area: parseFloat(area) || 0,
        area_unit: areaUnitArr.join(' ') || 'Sq.Ft',
        location: data.location || '',
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        negotiable: data.negotiable === 'Yes',
        facing: data.facing || '',
        is_corner: data.is_corner === 'Yes'
      });
      
      setShowSuccess(true);
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to post property'); 
    }
    setLoading(false);
  };

  const handlePostAnother = () => {
    setShowSuccess(false);
    setMessages([]);
    setCurrentStep(0);
    setData({});
    setDone(false);
    setInputValue('');
    setSelectedUnit('');
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => { 
        setTyping(false); 
        setMessages([{ text: STEPS[0].question, isUser: false }]); 
      }, 500);
    }, 200);
  };

  const step = getCurrentStep();
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const getInitialPosition = () => {
    if (userLoc?.latitude && userLoc?.longitude) {
      return [userLoc.latitude, userLoc.longitude];
    }
    return [17.385, 78.4867];
  };

  return (
    <>
      {showSuccess && (
        <SuccessScreen 
          data={data}
          onViewProperties={() => navigate('/agentapex/my-properties')}
          onPostAnother={handlePostAnother}
        />
      )}
      
      <div className="agentapex-page-container">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex-1">New Post</h1>
            <button 
              onClick={() => navigate('/agentapex/post/voice')}
              className="w-10 h-10 flex items-center justify-center bg-red-50 rounded-full"
            >
              <Mic className="w-5 h-5 text-red-500" />
            </button>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-44">
          <AnimatePresence>
            {messages.map((m, i) => (
              <ChatBubble key={i} text={m.text} isUser={m.isUser} />
            ))}
            {typing && <ChatBubble isTyping />}
          </AnimatePresence>
          
          {/* Location Picker */}
          {step.type === 'location' && !done && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-4"
            >
              <LocationPicker 
                initialPosition={getInitialPosition()} 
                onSelect={handleLocationSelect} 
              />
            </motion.div>
          )}
          
          {/* Done - Ready to Post */}
          {done && step.type !== 'location' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="mt-6 bg-green-50 rounded-2xl p-6 text-center"
            >
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">Ready to Post!</p>
              <p className="text-base text-gray-600 mb-6">
                {data.property_type} • ₹{data.price} • {data.area}
              </p>
              <button 
                onClick={finalize} 
                disabled={loading}
                className="w-full py-4 bg-green-500 text-white font-bold rounded-xl text-lg flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Property'}
              </button>
            </motion.div>
          )}
          
          <div ref={endRef} />
        </div>

        {/* Input Area - Fixed at bottom */}
        {!done && step.type !== 'location' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 p-4 pb-8 safe-bottom">
            
            {/* Button Options */}
            {step.type === 'buttons' && (
              <div className="flex flex-wrap gap-3">
                {step.options.map(opt => (
                  <motion.button 
                    key={opt.value} 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAnswer(opt.value)}
                    className="flex-1 min-w-[45%] py-4 bg-gray-100 hover:bg-blue-100 active:bg-blue-200 text-gray-900 rounded-2xl font-bold text-lg"
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            )}
            
            {/* Number with Unit Input */}
            {step.type === 'number_with_unit' && (
              <div className="space-y-4">
                {/* Unit Buttons */}
                <div className="flex flex-wrap gap-2">
                  {step.units.map(unit => (
                    <button
                      key={unit}
                      onClick={() => setSelectedUnit(unit)}
                      className={`px-5 py-3 rounded-full font-bold text-base transition-all ${
                        selectedUnit === unit 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
                
                {/* Input Field */}
                <div className="flex gap-3">
                  <input 
                    type="tel"
                    inputMode="decimal"
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    placeholder={step.placeholder}
                    className="flex-1 px-5 py-4 bg-gray-100 rounded-2xl text-xl font-bold border-2 border-transparent focus:border-blue-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleNumberSubmit()}
                  />
                  <button 
                    onClick={handleNumberSubmit}
                    disabled={!inputValue || !selectedUnit}
                    className="px-6 py-4 bg-blue-500 disabled:bg-gray-300 rounded-2xl"
                  >
                    <Check className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default QuickPropertyPost;
