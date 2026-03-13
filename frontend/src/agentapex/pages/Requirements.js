import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, ClipboardList, MapPin, Search, X, Loader2, Check, Home, Building2, Trees, Store, Compass } from 'lucide-react';
import { toast } from 'sonner';

const TYPES = [
  { id: 'Land', icon: Trees, label: 'Land' },
  { id: 'Plot', icon: MapPin, label: 'Plot' },
  { id: 'Apartment', icon: Building2, label: 'Flat' },
  { id: 'House', icon: Home, label: 'House' },
  { id: 'Commercial', icon: Store, label: 'Shop' }
];

const FACINGS = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];

const AREA_UNITS = ['Sq.Yards', 'Sq.Ft', 'Acres', 'Guntas', 'Cents'];

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const Requirements = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    property_type: 'Land', 
    budget_min: '', 
    budget_max: '', 
    budget_unit: 'Lakhs', 
    location_preference: '', 
    description: '',
    latitude: null,
    longitude: null,
    area_min: '',
    area_max: '',
    area_unit: 'Sq.Yards',
    // New fields for Plot
    facing: '',
    is_corner_plot: false
  });
  
  // Location search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Google Maps API Key from env
  const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

  useEffect(() => { fetchRequirements(); }, []);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchLocations(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const fetchRequirements = async () => {
    try { 
      const res = await api().get('/requirements'); 
      setRequirements(res.data); 
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const searchLocations = async (query) => {
    setSearchLoading(true);
    try {
      // Try Google Places Autocomplete first
      if (GOOGLE_MAPS_KEY && window.google?.maps?.places) {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions({
          input: query,
          componentRestrictions: { country: 'in' },
          types: ['geocode', 'establishment']
        }, (predictions, status) => {
          if (status === 'OK' && predictions) {
            setSearchResults(predictions.map(p => ({
              id: p.place_id,
              name: p.description,
              mainText: p.structured_formatting.main_text,
              secondaryText: p.structured_formatting.secondary_text,
              placeId: p.place_id
            })));
          }
          setSearchLoading(false);
        });
      } else {
        // Fallback to Nominatim
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, India&limit=6&addressdetails=1`,
          { headers: { 'Accept': 'application/json' } }
        );
        const data = await response.json();
        setSearchResults(data.map(r => ({
          id: r.place_id,
          name: r.display_name,
          mainText: r.address?.village || r.address?.town || r.address?.city || r.name,
          secondaryText: [r.address?.state_district, r.address?.state].filter(Boolean).join(', '),
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon)
        })));
        setSearchLoading(false);
      }
      setShowSearchResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setSearchLoading(false);
    }
  };

  const selectLocation = async (result) => {
    try {
      let lat = result.lat;
      let lon = result.lon;
      
      // If using Google Places, get coordinates from place_id
      if (result.placeId && GOOGLE_MAPS_KEY && window.google?.maps?.places) {
        const geocoder = new window.google.maps.Geocoder();
        const response = await new Promise((resolve, reject) => {
          geocoder.geocode({ placeId: result.placeId }, (results, status) => {
            if (status === 'OK') resolve(results[0]);
            else reject(status);
          });
        });
        lat = response.geometry.location.lat();
        lon = response.geometry.location.lng();
      }
      
      setForm({
        ...form,
        location_preference: result.mainText || result.name.split(',')[0],
        latitude: lat,
        longitude: lon
      });
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      toast.success('Location selected!');
    } catch (err) {
      console.error('Location select error:', err);
      // Fallback - just use the name
      setForm({
        ...form,
        location_preference: result.mainText || result.name.split(',')[0],
        latitude: result.lat || null,
        longitude: result.lon || null
      });
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.location_preference) {
      toast.error('Please select a location');
      return;
    }
    try {
      const payload = {
        ...form,
        budget_min: parseFloat(form.budget_min) || 0,
        budget_max: parseFloat(form.budget_max) || 0,
        area_min: parseFloat(form.area_min) || null,
        area_max: parseFloat(form.area_max) || null
      };
      const res = await api().post('/requirements', payload);
      setRequirements(prev => [res.data, ...prev]);
      setShowModal(false);
      setForm({ 
        property_type: 'Land', 
        budget_min: '', 
        budget_max: '', 
        budget_unit: 'Lakhs', 
        location_preference: '', 
        description: '',
        latitude: null,
        longitude: null,
        area_min: '',
        area_max: '',
        area_unit: 'Sq.Yards',
        facing: '',
        is_corner_plot: false
      });
      toast.success('Requirement posted successfully!');
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to post requirement');
    }
  };

  // Check if property type needs facing/corner options
  const showPlotOptions = ['Plot', 'Land'].includes(form.property_type);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} data-testid="back-btn" className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Requirements</h1>
              <p className="text-sm text-gray-500">What are you looking for?</p>
            </div>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            data-testid="add-requirement-btn" 
            className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      {/* Requirements List */}
      <div className="p-4 space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />)
        ) : requirements.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="w-10 h-10 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">No Requirements Yet</p>
            <p className="text-base text-gray-500 mt-2">Tell us what property you need</p>
            <button 
              onClick={() => setShowModal(true)} 
              className="mt-8 px-10 py-4 bg-blue-500 text-white text-lg font-bold rounded-2xl shadow-lg"
            >
              + Post Requirement
            </button>
          </div>
        ) : (
          requirements.map((r, i) => (
            <motion.div 
              key={r.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.03 }} 
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm px-4 py-1.5 rounded-full bg-blue-100 text-blue-600 font-bold">
                  {r.property_type}
                </span>
                <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${
                  r.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {r.status === 'active' ? 'Active' : r.status}
                </span>
              </div>
              <p className="text-2xl font-black text-gray-900">
                ₹{r.budget_min} - ₹{r.budget_max} {r.budget_unit}
              </p>
              {r.area_min && r.area_max && (
                <p className="text-base text-gray-600 mt-1 font-medium">
                  {r.area_min} - {r.area_max} {r.area_unit}
                </p>
              )}
              <p className="text-base text-gray-500 flex items-center gap-2 mt-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                {r.location_preference}
              </p>
              {r.facing && (
                <p className="text-sm text-gray-500 mt-1">Facing: {r.facing}</p>
              )}
              {r.is_corner_plot && (
                <span className="inline-block text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg mt-2 font-medium">
                  Corner Plot Preferred
                </span>
              )}
              {r.latitude && r.longitude && (
                <p className="text-sm text-green-600 mt-2 font-medium">📍 Visible on Map</p>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Add Requirement Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-h-[95vh] overflow-y-auto bg-white rounded-t-3xl"
            >
              <div className="p-5 pb-10">
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
                
                <h2 className="text-2xl font-black text-gray-900 mb-8">Post Requirement</h2>
                
                <form onSubmit={handleAdd} className="space-y-6">
                  
                  {/* Property Type - Big Buttons */}
                  <div>
                    <p className="text-lg font-bold text-gray-800 mb-4">Property Type</p>
                    <div className="grid grid-cols-5 gap-2">
                      {TYPES.map(t => {
                        const Icon = t.icon;
                        return (
                          <button 
                            key={t.id} 
                            type="button" 
                            onClick={() => setForm({ ...form, property_type: t.id, facing: '', is_corner_plot: false })} 
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                              form.property_type === t.id 
                                ? 'bg-blue-500 text-white shadow-lg scale-105' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <Icon className="w-6 h-6 mb-1" />
                            <span className="text-sm font-bold">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Facing Options - Only for Plot/Land */}
                  {showPlotOptions && (
                    <div>
                      <p className="text-lg font-bold text-gray-800 mb-4">
                        <Compass className="w-5 h-5 inline mr-2" />
                        Preferred Facing
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {FACINGS.map(f => (
                          <button 
                            key={f} 
                            type="button" 
                            onClick={() => setForm({ ...form, facing: form.facing === f ? '' : f })} 
                            className={`py-3 px-2 rounded-xl text-sm font-bold transition-all ${
                              form.facing === f 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Corner Plot Option - Only for Plot/Land */}
                  {showPlotOptions && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, is_corner_plot: !form.is_corner_plot })}
                      className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${
                        form.is_corner_plot 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                        form.is_corner_plot ? 'bg-white border-white' : 'border-gray-400'
                      }`}>
                        {form.is_corner_plot && <Check className="w-4 h-4 text-amber-500" />}
                      </div>
                      <span className="text-lg font-bold">Corner Plot Preferred</span>
                    </button>
                  )}
                  
                  {/* Budget Section */}
                  <div>
                    <p className="text-lg font-bold text-gray-800 mb-4">Budget Range</p>
                    
                    {/* Budget Unit Buttons - FIRST */}
                    <div className="flex gap-3 mb-4">
                      {['Lakhs', 'Crores'].map(u => (
                        <button 
                          key={u} 
                          type="button" 
                          onClick={() => setForm({ ...form, budget_unit: u })} 
                          className={`flex-1 py-4 rounded-2xl text-lg font-black transition-all ${
                            form.budget_unit === u 
                              ? 'bg-amber-500 text-white shadow-lg' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                    
                    {/* Budget Inputs - Full Width */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-base font-medium text-gray-600 mb-2 block">Minimum (in {form.budget_unit})</label>
                        <input 
                          type="number" 
                          inputMode="numeric"
                          value={form.budget_min} 
                          onChange={(e) => setForm({ ...form, budget_min: e.target.value })} 
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-xl font-bold focus:border-blue-500 focus:outline-none" 
                          placeholder="e.g. 20"
                          required 
                        />
                      </div>
                      <div>
                        <label className="text-base font-medium text-gray-600 mb-2 block">Maximum (in {form.budget_unit})</label>
                        <input 
                          type="number"
                          inputMode="numeric" 
                          value={form.budget_max} 
                          onChange={(e) => setForm({ ...form, budget_max: e.target.value })} 
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-xl font-bold focus:border-blue-500 focus:outline-none" 
                          placeholder="e.g. 50"
                          required 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Area Section */}
                  <div>
                    <p className="text-lg font-bold text-gray-800 mb-4">Area Size</p>
                    
                    {/* Area Unit Buttons - FIRST */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {AREA_UNITS.map(u => (
                        <button 
                          key={u} 
                          type="button" 
                          onClick={() => setForm({ ...form, area_unit: u })} 
                          className={`px-4 py-3 rounded-xl text-base font-bold transition-all ${
                            form.area_unit === u 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                    
                    {/* Area Inputs - Full Width */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-base font-medium text-gray-600 mb-2 block">Minimum ({form.area_unit})</label>
                        <input 
                          type="number"
                          inputMode="numeric" 
                          value={form.area_min} 
                          onChange={(e) => setForm({ ...form, area_min: e.target.value })} 
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-xl font-bold focus:border-blue-500 focus:outline-none" 
                          placeholder="e.g. 100"
                        />
                      </div>
                      <div>
                        <label className="text-base font-medium text-gray-600 mb-2 block">Maximum ({form.area_unit})</label>
                        <input 
                          type="number"
                          inputMode="numeric" 
                          value={form.area_max} 
                          onChange={(e) => setForm({ ...form, area_max: e.target.value })} 
                          className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-xl font-bold focus:border-blue-500 focus:outline-none" 
                          placeholder="e.g. 500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Location with Google-like Search */}
                  <div>
                    <p className="text-lg font-bold text-gray-800 mb-4">
                      <MapPin className="w-5 h-5 inline mr-2 text-blue-500" />
                      Location *
                    </p>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                      <input 
                        ref={searchInputRef}
                        type="text" 
                        value={searchQuery || form.location_preference}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (!e.target.value) {
                            setForm({ ...form, location_preference: '', latitude: null, longitude: null });
                          }
                        }}
                        onFocus={() => setShowSearchResults(true)}
                        placeholder="Search village, area, city..."
                        className="w-full pl-14 pr-12 py-4 border-2 border-gray-200 rounded-2xl text-lg focus:border-blue-500 focus:outline-none"
                      />
                      {searchLoading && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-spin" />
                      )}
                      {form.location_preference && !searchLoading && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm({ ...form, location_preference: '', latitude: null, longitude: null });
                            setSearchQuery('');
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                          <X className="w-6 h-6 text-gray-400" />
                        </button>
                      )}
                    </div>
                    
                    {/* Search Results - Google Style */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="mt-2 bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-xl">
                        {searchResults.map((result, idx) => (
                          <button
                            key={result.id}
                            type="button"
                            onClick={() => selectLocation(result)}
                            className={`w-full px-4 py-4 text-left hover:bg-blue-50 flex items-start gap-4 ${
                              idx !== searchResults.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                          >
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-bold text-gray-900 truncate">{result.mainText}</p>
                              <p className="text-sm text-gray-500 truncate">{result.secondaryText || result.name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {form.latitude && form.longitude && (
                      <div className="mt-3 p-3 bg-green-50 rounded-xl flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <p className="text-base text-green-700 font-medium">Location selected - will show on map</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div>
                    <p className="text-lg font-bold text-gray-800 mb-4">Additional Details (Optional)</p>
                    <textarea 
                      value={form.description} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })} 
                      rows={3} 
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-lg resize-none focus:border-blue-500 focus:outline-none"
                      placeholder="Any specific requirements like road width, near temple, etc..."
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)} 
                      className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl text-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-4 bg-blue-500 text-white rounded-2xl text-lg font-bold shadow-lg"
                    >
                      Post Requirement
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Requirements;
