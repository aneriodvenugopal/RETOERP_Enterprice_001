import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, ClipboardList, MapPin, Search, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TYPES = ['Land', 'Plot', 'Apartment', 'House', 'Commercial'];

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
    area_unit: 'Sq.Yards'
  });
  
  // Location search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => { fetchRequirements(); }, []);

  useEffect(() => {
    if (debouncedSearch.length >= 3) {
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

  const selectLocation = (result) => {
    setForm({
      ...form,
      location_preference: result.name.split(',').slice(0, 2).join(', '),
      latitude: result.lat,
      longitude: result.lon
    });
    setSearchQuery('');
    setSearchResults([]);
    toast.success('Location selected');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      toast.error('Please select a location from suggestions');
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
        area_unit: 'Sq.Yards'
      });
      toast.success('Requirement posted! It will show on map.');
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to post');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} data-testid="back-btn" className="w-10 h-10 flex items-center justify-center">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Requirements</h1>
              <p className="text-xs text-gray-500">Post what you're looking for</p>
            </div>
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            data-testid="add-requirement-btn" 
            className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 skeleton" />)
        ) : requirements.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-gray-900 font-semibold">No requirements yet</p>
            <p className="text-gray-500 text-sm mt-1">Post what you're looking for</p>
            <button 
              onClick={() => setShowModal(true)} 
              className="mt-6 px-8 py-3 bg-blue-500 text-white font-semibold rounded-xl"
            >
              Post Requirement
            </button>
          </div>
        ) : (
          requirements.map((r, i) => (
            <motion.div 
              key={r.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.03 }} 
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">
                  {r.property_type}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  r.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {r.status}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                ₹{r.budget_min} - ₹{r.budget_max} {r.budget_unit}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {r.location_preference}
              </p>
              {r.latitude && r.longitude && (
                <p className="text-xs text-green-500 mt-1">📍 Will show on map</p>
              )}
              {r.description && (
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">{r.description}</p>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Add Requirement Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              className="w-full max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl"
            >
              <div className="p-4 pb-8">
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-6">Post Requirement</h2>
                
                <form onSubmit={handleAdd} className="space-y-4">
                  {/* Property Type */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Property Type</p>
                    <div className="flex flex-wrap gap-2">
                      {TYPES.map(t => (
                        <button 
                          key={t} 
                          type="button" 
                          onClick={() => setForm({ ...form, property_type: t })} 
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            form.property_type === t 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Budget */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Min Budget</p>
                      <input 
                        type="number" 
                        value={form.budget_min} 
                        onChange={(e) => setForm({ ...form, budget_min: e.target.value })} 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl" 
                        placeholder="Min"
                        required 
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Max Budget</p>
                      <input 
                        type="number" 
                        value={form.budget_max} 
                        onChange={(e) => setForm({ ...form, budget_max: e.target.value })} 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl" 
                        placeholder="Max"
                        required 
                      />
                    </div>
                  </div>
                  
                  {/* Budget Unit */}
                  <div className="flex gap-2">
                    {['Lakhs', 'Crore'].map(u => (
                      <button 
                        key={u} 
                        type="button" 
                        onClick={() => setForm({ ...form, budget_unit: u })} 
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                          form.budget_unit === u 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                  
                  {/* Area */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Min Area</p>
                      <input 
                        type="number" 
                        value={form.area_min} 
                        onChange={(e) => setForm({ ...form, area_min: e.target.value })} 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl" 
                        placeholder="Min"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Max Area</p>
                      <input 
                        type="number" 
                        value={form.area_max} 
                        onChange={(e) => setForm({ ...form, area_max: e.target.value })} 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl" 
                        placeholder="Max"
                      />
                    </div>
                  </div>
                  
                  {/* Area Unit */}
                  <div className="flex gap-2">
                    {['Sq.Yards', 'Sq.Ft', 'Acres', 'Guntas'].map(u => (
                      <button 
                        key={u} 
                        type="button" 
                        onClick={() => setForm({ ...form, area_unit: u })} 
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          form.area_unit === u 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                  
                  {/* Location with Search */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Location *</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        value={searchQuery || form.location_preference}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (!e.target.value) {
                            setForm({ ...form, location_preference: '', latitude: null, longitude: null });
                          }
                        }}
                        placeholder="Search area, city..."
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl"
                      />
                      {searchLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                      )}
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map(result => (
                          <button
                            key={result.id}
                            type="button"
                            onClick={() => selectLocation(result)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                          >
                            <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{result.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {form.latitude && form.longitude && (
                      <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location selected - will show on map
                      </p>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Details (Optional)</p>
                    <textarea 
                      value={form.description} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })} 
                      rows={3} 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none"
                      placeholder="Any specific requirements..."
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)} 
                      className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3.5 bg-blue-500 text-white rounded-xl font-semibold"
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
