import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGeoLocation } from '../context/LocationContext';
import { HelpButton } from '../components/DemoGuide';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Check, Loader2, Mic, Navigation, CheckCircle2, Building2, Search, X } from 'lucide-react';
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
    question: "What type of property?", 
    type: 'buttons',
    options: [
      { value: 'Plot', label: 'Plot' },
      { value: 'Land', label: 'Land' }
    ]
  },
  { 
    id: 'facing',
    question: "Which direction facing?", 
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
      { value: 'Yes', label: 'Yes' },
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
    question: "Is price negotiable?", 
    type: 'buttons',
    options: [
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No' }
    ]
  },
  { 
    id: 'location',
    question: "Where is property located?", 
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

// Google-style Location Search Component with Google Places Autocomplete
const GoogleStyleLocationSearch = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    inputRef.current?.focus();
    
    // Initialize Google Places services
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      // Create a hidden div for PlacesService
      const mapDiv = document.createElement('div');
      mapDiv.style.display = 'none';
      document.body.appendChild(mapDiv);
      const map = new window.google.maps.Map(mapDiv);
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.length >= 2 && autocompleteServiceRef.current) {
      searchLocations(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const searchLocations = async (searchQuery) => {
    if (!autocompleteServiceRef.current) {
      console.error('Google Places not initialized');
      return;
    }
    
    setLoading(true);
    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: 'in' },
          types: ['geocode', 'establishment']
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setResults(predictions.map(p => ({
              id: p.place_id,
              place_id: p.place_id,
              mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
              secondaryText: p.structured_formatting?.secondary_text || p.description.split(',').slice(1).join(','),
              fullAddress: p.description
            })));
          } else {
            setResults([]);
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Search error:', err);
      setLoading(false);
    }
  };

  const handleSelectPlace = async (result) => {
    if (!placesServiceRef.current) {
      // Fallback if PlacesService not available
      onSelect({
        ...result,
        lat: 17.385044,
        lon: 78.486671,
        city: '',
        state: ''
      });
      return;
    }

    setLoading(true);
    placesServiceRef.current.getDetails(
      {
        placeId: result.place_id,
        fields: ['geometry', 'formatted_address', 'address_components', 'name']
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          
          // Extract city and state from address components
          let city = '', state = '', postal_code = '';
          place.address_components?.forEach(comp => {
            if (comp.types.includes('locality')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
            if (comp.types.includes('postal_code')) postal_code = comp.long_name;
          });

          onSelect({
            id: result.place_id,
            place_id: result.place_id,
            mainText: result.mainText,
            secondaryText: result.secondaryText,
            fullAddress: place.formatted_address,
            lat: lat,
            lon: lng,
            city: city,
            state: state,
            postal_code: postal_code
          });
        } else {
          toast.error('Could not get place details');
        }
        setLoading(false);
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-[2000] flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-gray-100">
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
      
      <div className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div>
            {results.map((result, idx) => (
              <button
                key={result.id}
                onClick={() => handleSelectPlace(result)}
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

// Location Picker with Map - Inline in chat
const LocationPickerInline = ({ onSelect, initialPosition, onSearchClick }) => {
  const [pos, setPos] = useState(initialPosition);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const MapClick = () => { 
    useMapEvents({ click: (e) => setPos([e.latlng.lat, e.latlng.lng]) }); 
    return null; 
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 20000, maximumAge: 0
        });
      });
      setPos([position.coords.latitude, position.coords.longitude]);
      toast.success('Location updated!');
    } catch (err) {
      toast.error('Could not get location');
    }
    setGettingLocation(false);
  };

  const confirm = async () => {
    if (!pos || !pos[0] || !pos[1]) {
      toast.error('Please select a location');
      return;
    }
    setLoading(true);
    
    let locationData = {
      latitude: pos[0], longitude: pos[1],
      address: `${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}`,
      city: '', state: '', postal_code: ''
    };
    
    try {
      // Use Google Geocoding API for reverse geocoding
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        await new Promise((resolve) => {
          geocoder.geocode({ location: { lat: pos[0], lng: pos[1] } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              let city = '', state = '', postal_code = '';
              results[0].address_components?.forEach(comp => {
                if (comp.types.includes('locality')) city = comp.long_name;
                if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                if (comp.types.includes('postal_code')) postal_code = comp.long_name;
              });
              locationData = {
                latitude: pos[0], longitude: pos[1],
                address: results[0].formatted_address,
                city, state, postal_code
              };
            }
            resolve();
          });
        });
      } else {
        // Fallback to Nominatim
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}&accept-language=en`);
        if (res.ok) {
          const data = await res.json();
          if (data?.display_name) {
            locationData = {
              latitude: pos[0], longitude: pos[1],
              address: data.display_name,
              city: data.address?.city || data.address?.town || data.address?.village || '',
              state: data.address?.state || '',
              postal_code: data.address?.postcode || ''
            };
          }
        }
      }
    } catch (err) { console.log('Reverse geocode failed:', err); }
    
    setLoading(false);
    onSelect(locationData);
  };

  const updatePosition = (newPos) => {
    setPos(newPos);
  };

  return (
    <div className="space-y-3 mt-2">
      {/* Search Button */}
      <button
        onClick={onSearchClick}
        className="w-full py-3 bg-gray-100 rounded-xl flex items-center justify-center gap-2 text-base"
      >
        <Search className="w-5 h-5 text-gray-500" />
        <span className="text-gray-600">Search location...</span>
      </button>

      {/* Map */}
      <div className="relative h-48 rounded-xl overflow-hidden border border-gray-200">
        <MapContainer center={pos} zoom={14} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={pos} />
          <MapClick />
          <MapRecenter center={pos} />
        </MapContainer>
        
        <button
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="absolute top-2 right-2 bg-white rounded-full shadow p-2 z-[1000]"
        >
          {gettingLocation ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 text-blue-500" />
          )}
        </button>
      </div>

      {/* Confirm Button - Clear and prominent */}
      <button 
        onClick={confirm} 
        disabled={loading}
        className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <><MapPin className="w-5 h-5" /> Confirm This Location</>
        )}
      </button>
    </div>
  );
};

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
    
    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="text-2xl font-bold text-white mb-2">Property Posted!</motion.h1>
    
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
      className="text-green-100 text-center mb-8">Your property is now visible to buyers</motion.p>
    
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
      className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl mb-8">
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
    
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
      className="w-full max-w-sm space-y-3">
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
  const [chatItems, setChatItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({});
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  
  // For number input
  const [inputValue, setInputValue] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [waitingForInput, setWaitingForInput] = useState(false);
  
  const endRef = useRef(null);

  useEffect(() => { 
    endRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [chatItems, typing, waitingForInput]);

  useEffect(() => {
    if (permissionStatus === 'prompt') requestLocation();
  }, []);

  // Initial question - with guard to prevent double render
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => { 
        setTyping(false);
        addQuestion(0);
      }, 400);
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

  const getStepConfig = (stepIndex) => {
    const step = STEPS[stepIndex];
    if (step?.id === 'area' && data.property_type) {
      return { ...step, units: data.property_type === 'Land' ? step.units_land : step.units_plot };
    }
    return step;
  };

  const addQuestion = (stepIndex) => {
    const step = STEPS[stepIndex];
    setChatItems(prev => [...prev, { type: 'question', text: step.question, stepIndex }]);
    setCurrentStep(stepIndex);
    
    if (step.type === 'number_with_unit') {
      setWaitingForInput(true);
      setInputValue('');
      setSelectedUnit('');
    }
  };

  const addAnswer = (answer) => {
    setChatItems(prev => [...prev, { type: 'answer', text: answer }]);
  };

  const handleButtonClick = (value) => {
    const step = getStepConfig(currentStep);
    addAnswer(value);
    
    const newData = { ...data, [step.id]: value };
    setData(newData);
    
    const nextIndex = getNextStepIndex(currentStep, newData);
    
    if (nextIndex >= STEPS.length) {
      setDone(true);
      return;
    }
    
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => { 
        setTyping(false);
        addQuestion(nextIndex);
      }, 300);
    }, 150);
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
    
    setWaitingForInput(false);
    const answer = `${inputValue} ${selectedUnit}`;
    handleButtonClick(answer);
  };

  const handleLocationSelect = (loc) => {
    const shortAddress = loc.address.split(',').slice(0, 2).join(',');
    addAnswer(`📍 ${shortAddress}`);
    
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

  const handleSearchSelect = (result) => {
    setShowSearch(false);
    setMapPosition([result.lat, result.lon]);
    toast.success(`Set to ${result.mainText}`);
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
    setChatItems([]);
    setCurrentStep(0);
    setData({});
    setDone(false);
    setInputValue('');
    setSelectedUnit('');
    setWaitingForInput(false);
    setMapPosition(null);
    
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => { 
        setTyping(false);
        addQuestion(0);
      }, 400);
    }, 200);
  };

  const step = getStepConfig(currentStep);
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const getInitialPosition = () => {
    if (mapPosition) return mapPosition;
    if (userLoc?.latitude && userLoc?.longitude) return [userLoc.latitude, userLoc.longitude];
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
      
      {showSearch && (
        <GoogleStyleLocationSearch 
          onSelect={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}
      
      <div className="agentapex-page-container">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex-1">Post Property</h1>
            <HelpButton screen="post" />
            <button onClick={() => navigate('/agentapex/post/voice')}
              className="w-10 h-10 flex items-center justify-center bg-red-50 rounded-full">
              <Mic className="w-5 h-5 text-red-500" />
            </button>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </header>

        {/* Chat Area - Questions and Answers inline */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
          <AnimatePresence>
            {chatItems.map((item, i) => {
              if (item.type === 'question') {
                const stepConfig = getStepConfig(item.stepIndex);
                const isCurrentStep = item.stepIndex === currentStep && !done;
                const showButtons = isCurrentStep && stepConfig.type === 'buttons';
                const showNumberInput = isCurrentStep && stepConfig.type === 'number_with_unit' && waitingForInput;
                const showLocation = isCurrentStep && stepConfig.type === 'location';
                
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                    {/* Question Bubble */}
                    <div className="flex justify-start mb-2">
                      <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                        <p className="text-base">{item.text}</p>
                      </div>
                    </div>
                    
                    {/* Inline Buttons - immediately after question - BETTER UI */}
                    {showButtons && (
                      <div className="flex flex-wrap gap-3 ml-2 mt-1">
                        {stepConfig.options.map(opt => (
                          <motion.button 
                            key={opt.value} 
                            whileTap={{ scale: 0.92 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleButtonClick(opt.value)}
                            className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-500/30 active:shadow-md transition-all"
                          >
                            {opt.label}
                          </motion.button>
                        ))}
                      </div>
                    )}
                    
                    {/* Inline Number Input */}
                    {showNumberInput && (
                      <div className="ml-2 mt-2 space-y-3">
                        {/* Unit Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {stepConfig.units.map(unit => (
                            <button
                              key={unit}
                              onClick={() => setSelectedUnit(unit)}
                              className={`px-4 py-2 rounded-full font-semibold text-sm ${
                                selectedUnit === unit 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                        
                        {/* Input + Submit */}
                        <div className="flex gap-2">
                          <input 
                            type="tel"
                            inputMode="decimal"
                            value={inputValue} 
                            onChange={(e) => setInputValue(e.target.value)} 
                            placeholder={stepConfig.placeholder}
                            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-lg font-semibold focus:border-blue-500 outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleNumberSubmit()}
                          />
                          <button 
                            onClick={handleNumberSubmit}
                            disabled={!inputValue || !selectedUnit}
                            className="px-5 py-3 bg-blue-500 disabled:bg-gray-300 rounded-xl"
                          >
                            <Check className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Location Picker Inline */}
                    {showLocation && (
                      <div className="ml-2">
                        <LocationPickerInline 
                          initialPosition={getInitialPosition()} 
                          onSelect={handleLocationSelect}
                          onSearchClick={() => setShowSearch(true)}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              } else {
                // Answer bubble
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                    className="flex justify-end mb-4">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[85%]">
                      <p className="text-base">{item.text}</p>
                    </div>
                  </motion.div>
                );
              }
            })}
            
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Final Post Property Button - Very Clear */}
          {done && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="mt-6 bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900 mb-2">All Details Complete!</p>
              <p className="text-base text-gray-600 mb-1">
                <strong>{data.property_type}</strong> • ₹{data.price} • {data.area}
              </p>
              {data.facing && <p className="text-sm text-gray-500 mb-4">Facing: {data.facing} {data.is_corner === 'Yes' ? '• Corner' : ''}</p>}
              
              <button 
                onClick={finalize} 
                disabled={loading}
                className="w-full py-5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-xl flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <><CheckCircle2 className="w-6 h-6" /> POST PROPERTY</>
                )}
              </button>
            </motion.div>
          )}
          
          <div ref={endRef} />
        </div>
      </div>
    </>
  );
};

export default QuickPropertyPost;
