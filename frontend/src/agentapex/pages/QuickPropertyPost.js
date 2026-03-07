import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGeoLocation } from '../context/LocationContext';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MapPin, Check, Loader2, Mic, Navigation, CheckCircle2, Building2, Search, X } from 'lucide-react';
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

const STEPS = [
  { step: 0, question: "What type of property do you want to post?", field: "property_type", options: ["Land", "Plot"] },
  { step: 1, question: "What's the total price?", field: "price", type: "number", suffix: ["Lakhs", "Crore"] },
  { step: 2, question: "What's the property size?", field: "area", type: "number", suffix_land: ["Acres", "Guntas", "Hectare"], suffix_plot: ["Sq.Ft", "Sq.Yards"] },
  { step: 3, question: "Is the price negotiable?", field: "negotiable", options: ["Yes", "No"] },
  { step: 4, question: "Where is the property located?", field: "location", type: "map" }
];

// Map recenter helper
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 14); }, [center, map]);
  return null;
};

const LocationPicker = ({ onSelect, initialPosition }) => {
  const [pos, setPos] = useState(initialPosition);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Search locations
  useEffect(() => {
    if (debouncedSearch.length >= 3) {
      searchLocations(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const searchLocations = async (query) => {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await response.json();
      setSearchResults(data.map(r => ({
        id: r.place_id,
        name: r.display_name,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon)
      })));
    } catch (err) {
      console.error('Search error:', err);
    }
    setSearchLoading(false);
  };

  const selectSearchResult = (result) => {
    setPos([result.lat, result.lon]);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    toast.success(`Location set to ${result.name.split(',')[0]}`);
  };
  
  const MapClick = () => { 
    useMapEvents({ click: (e) => setPos([e.latlng.lat, e.latlng.lng]) }); 
    return null; 
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    setLocationError('');
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('Location not supported');
      toast.error('Location not supported on this device');
      setGettingLocation(false);
      return;
    }
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject, 
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
          }
        );
      });
      const newPos = [position.coords.latitude, position.coords.longitude];
      setPos(newPos);
      toast.success('Location updated!');
    } catch (err) {
      console.log('Geolocation error:', err.code, err.message);
      if (err.code === 1) {
        setLocationError('Permission denied');
        toast.error('Please enable location in Settings');
      } else if (err.code === 2) {
        setLocationError('Location unavailable');
        toast.error('Location unavailable. Please try again.');
      } else if (err.code === 3) {
        setLocationError('Timeout');
        toast.error('Location request timed out');
      }
    }
    setGettingLocation(false);
  };

  const confirm = async () => {
    if (!pos || !pos[0] || !pos[1]) {
      toast.error('Please select a location on the map');
      return;
    }
    setLoading(true);
    
    let locationData = {
      latitude: pos[0],
      longitude: pos[1],
      address: `Location: ${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}`,
      city: '',
      state: '',
      postal_code: ''
    };
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}&accept-language=en`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          locationData = {
            latitude: pos[0],
            longitude: pos[1],
            address: data.display_name,
            city: data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || '',
            state: data.address?.state || '',
            postal_code: data.address?.postcode || ''
          };
        }
      }
    } catch (err) { 
      console.log('Reverse geocode failed, using coordinates:', err);
    }
    
    // Always call onSelect with location data
    setLoading(false);
    onSelect(locationData);
  };

  return (
    <>
      {/* Search Modal for Location */}
      {showSearch && (
        <div className="fixed inset-0 bg-white z-[2000] flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="w-10 h-10 flex items-center justify-center">
                <X className="w-6 h-6" />
              </button>
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, area, landmark..."
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  autoFocus
                />
                {searchLoading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="divide-y">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => selectSearchResult(result)}
                    className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-gray-50"
                  >
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{result.name.split(',')[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{result.name.split(',').slice(1, 3).join(',')}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 3 && !searchLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No locations found</p>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-4">Popular cities</p>
                <div className="flex flex-wrap gap-2">
                  {['Hyderabad', 'Bangalore', 'Mumbai', 'Chennai', 'Pune', 'Delhi'].map(city => (
                    <button
                      key={city}
                      onClick={() => setSearchQuery(city)}
                      className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative h-72 rounded-2xl overflow-hidden border border-gray-200">
        <MapContainer 
          center={pos} 
          zoom={14} 
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={pos} />
          <MapClick />
          <MapRecenter center={pos} />
        </MapContainer>
        
        {/* Search button - Left side */}
        <button
          onClick={() => setShowSearch(true)}
          data-testid="search-location-btn"
          className="absolute top-3 left-3 bg-white rounded-full shadow-lg flex items-center justify-center z-[1000] px-3 py-2 gap-2"
        >
          <Search className="w-5 h-5 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">Search</span>
        </button>
        
        {/* Get current location button - Right side */}
        <button
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          data-testid="get-location-btn"
          className="absolute top-3 right-3 bg-white rounded-full shadow-lg flex items-center justify-center z-[1000] px-3 py-2 gap-2"
        >
          {gettingLocation ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            <>
              <Navigation className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">GPS</span>
            </>
          )}
        </button>
        
        {/* Location error message */}
        {locationError && (
          <div className="absolute top-14 right-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 z-[1000]">
            <p className="text-xs text-red-600">{locationError}</p>
          </div>
        )}
      </div>
      
      {/* Confirm Location Button - OUTSIDE MAP */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 text-center mb-3">Tap map, Search, or use GPS to select location</p>
        <button 
          onClick={confirm} 
          disabled={loading}
          data-testid="confirm-location-btn" 
          className="w-full py-4 bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <MapPin className="w-5 h-5" /> Confirm Location
            </>
          )}
        </button>
      </div>
    </>
  );
};

// Chat Bubble
const Bubble = ({ text, isUser, isTyping }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
  >
    <div className={`max-w-[80%] rounded-3xl px-4 py-3 ${
      isUser 
        ? 'bg-blue-500 text-white rounded-br-lg' 
        : 'bg-gray-100 text-gray-900 rounded-bl-lg'
    }`}>
      {isTyping ? (
        <div className="flex gap-1 py-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      ) : (
        <p className="text-sm break-words">{text}</p>
      )}
    </div>
  </motion.div>
);

// PhonePe-style Success Screen
const SuccessScreen = ({ data, onViewProperties, onPostAnother }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-gradient-to-b from-green-500 to-green-600 flex flex-col items-center justify-center p-6 z-50"
  >
    {/* Success Animation */}
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <CheckCircle2 className="w-14 h-14 text-green-500" />
      </motion.div>
    </motion.div>
    
    {/* Success Text */}
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="text-2xl font-bold text-white mb-2"
    >
      Property Posted!
    </motion.h1>
    
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="text-green-100 text-center mb-8"
    >
      Your property is now live and visible to buyers
    </motion.p>
    
    {/* Property Summary Card */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl mb-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <Building2 className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{data.property_type || 'Property'}</p>
          <p className="text-sm text-gray-500">{data.location || 'Location set'}</p>
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-gray-500">Price</p>
          <p className="font-semibold text-gray-900">{data.price || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">Size</p>
          <p className="font-semibold text-gray-900">{data.area || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-500">Negotiable</p>
          <p className="font-semibold text-gray-900">{data.negotiable || 'No'}</p>
        </div>
      </div>
    </motion.div>
    
    {/* Action Buttons */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className="w-full max-w-sm space-y-3"
    >
      <button
        onClick={onViewProperties}
        className="w-full py-4 bg-white text-green-600 font-semibold rounded-xl shadow-lg"
      >
        View My Properties
      </button>
      <button
        onClick={onPostAnother}
        className="w-full py-4 bg-green-600 border-2 border-white text-white font-semibold rounded-xl"
      >
        Post Another Property
      </button>
    </motion.div>
  </motion.div>
);

const QuickPropertyPost = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const { location: userLoc, requestLocation, permissionStatus } = useGeoLocation();
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [suffix, setSuffix] = useState('');
  const [data, setData] = useState({});
  const [showMap, setShowMap] = useState(false);
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, typing]);

  // Request location on mount
  useEffect(() => {
    if (permissionStatus === 'prompt') {
      requestLocation();
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => { 
        setTyping(false); 
        setMessages([{ text: STEPS[0].question, isUser: false }]); 
      }, 600);
    }, 300);
  }, []);

  const getStep = () => {
    const s = STEPS[step];
    if (step === 2 && data.property_type) {
      return { ...s, suffix: data.property_type === 'Land' ? s.suffix_land : s.suffix_plot };
    }
    return s;
  };

  const send = (answer) => {
    const s = getStep();
    setMessages(prev => [...prev, { text: answer, isUser: true }]);
    const newData = { ...data, [s.field]: answer };
    setData(newData);
    const next = step + 1;
    
    if (next >= STEPS.length) { 
      setDone(true); 
      return; 
    }
    
    if (STEPS[next].type === 'map') {
      setTimeout(() => {
        setTyping(true);
        setTimeout(() => { 
          setTyping(false); 
          setMessages(prev => [...prev, { text: STEPS[next].question, isUser: false }]); 
          setShowMap(true); 
          setStep(next); 
        }, 600);
      }, 400);
    } else {
      setTimeout(() => {
        setTyping(true);
        setTimeout(() => { 
          setTyping(false); 
          setMessages(prev => [...prev, { text: STEPS[next].question, isUser: false }]); 
          setStep(next); 
        }, 600);
      }, 400);
    }
  };

  const onLocation = (loc) => {
    setShowMap(false);
    setMessages(prev => [...prev, { text: `📍 ${loc.address}`, isUser: true }]);
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
        negotiable: data.negotiable === 'Yes'
      });
      // Show PhonePe-style success screen
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
    setStep(0);
    setData({});
    setDone(false);
    setInput('');
    setSuffix('');
    // Re-trigger initial question
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => { 
        setTyping(false); 
        setMessages([{ text: STEPS[0].question, isUser: false }]); 
      }, 600);
    }, 300);
  };

  const s = getStep();

  // Get initial map position from user location
  const getInitialPosition = () => {
    if (userLoc?.latitude && userLoc?.longitude) {
      return [userLoc.latitude, userLoc.longitude];
    }
    return [17.385, 78.4867]; // Fallback to Hyderabad
  };

  return (
    <>
      {/* PhonePe-style Success Screen */}
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
            <button onClick={() => navigate(-1)} data-testid="back-btn" className="w-10 h-10 flex items-center justify-center shrink-0">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900">New Post</h1>
            </div>
            <button 
              onClick={() => navigate('/agentapex/post/voice')}
              data-testid="voice-post-btn"
              className="w-10 h-10 flex items-center justify-center bg-red-50 rounded-full shrink-0"
            >
              <Mic className="w-5 h-5 text-red-500" />
            </button>
          </div>
          {/* Progress */}
          <div className="mt-3 h-1 bg-gray-100 rounded-full">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300" 
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} 
            />
          </div>
        </header>

      {/* Chat Area - Add padding top for header */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-2 pb-32">
        <AnimatePresence>
          {messages.map((m, i) => (
            <Bubble key={i} text={m.text} isUser={m.isUser} />
          ))}
          {typing && <Bubble isTyping />}
        </AnimatePresence>
        
        {showMap && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 space-y-4"
          >
            <LocationPicker 
              initialPosition={getInitialPosition()} 
              onSelect={onLocation} 
            />
          </motion.div>
        )}
        
        {done && !showMap && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="mt-6 bg-gray-50 rounded-2xl p-6 text-center"
          >
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-white" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">Ready to Post!</p>
            <p className="text-sm text-gray-500 mb-6">
              {data.property_type} • ₹{data.price} • {data.area}
            </p>
            <button 
              onClick={finalize} 
              disabled={loading} 
              data-testid="finalize-btn" 
              className="w-full py-3.5 bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Post Property'
              )}
            </button>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Area - Fixed responsive width */}
      {!done && !showMap && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 safe-bottom" style={{ maxWidth: '100vw' }}>
          {s.options ? (
            <div className="flex gap-2 max-w-full">
              {s.options.map(o => (
                <button 
                  key={o} 
                  onClick={() => send(o)} 
                  data-testid={`option-${o.toLowerCase()}`} 
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-200 text-gray-900 rounded-xl font-semibold transition-colors text-sm"
                >
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 items-center max-w-full">
              <div className="flex-1 min-w-0 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
                <input 
                  type={s.type === 'number' ? 'tel' : 'text'}
                  inputMode={s.type === 'number' ? 'decimal' : 'text'}
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="Type a message..." 
                  data-testid="chat-input" 
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && input) {
                      if (s.suffix && !suffix) {
                        toast.error('Please select a unit from dropdown');
                        return;
                      }
                      send(suffix ? `${input} ${suffix}` : input);
                      setInput('');
                      setSuffix('');
                    }
                  }} 
                />
                {s.suffix && (
                  <select 
                    value={suffix} 
                    onChange={(e) => setSuffix(e.target.value)} 
                    data-testid="suffix-select" 
                    className="bg-transparent border-none outline-none text-sm text-gray-500 shrink-0 w-16"
                  >
                    <option value="">Unit</option>
                    {s.suffix.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                )}
              </div>
              <button 
                onClick={() => { 
                  if (input) {
                    // Check if suffix is required and not selected
                    if (s.suffix && !suffix) {
                      toast.error('Please select a unit from dropdown');
                      return;
                    }
                    send(suffix ? `${input} ${suffix}` : input); 
                    setInput(''); 
                    setSuffix(''); 
                  } 
                }} 
                disabled={!input} 
                data-testid="send-btn" 
                className="w-10 h-10 bg-blue-500 disabled:bg-gray-200 rounded-full flex items-center justify-center shrink-0"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
};

export default QuickPropertyPost;
