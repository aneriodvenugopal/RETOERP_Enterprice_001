import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  ArrowLeft, Plus, MapPin, Bell, BellOff, Trash2, 
  ChevronRight, Navigation, Search, X, Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RADIUS_OPTIONS = [2, 5, 10, 20];
const PROPERTY_TYPES = ['Land', 'Plot', 'House', 'Apartment', 'Commercial'];

// Custom hook for debounce
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

// Map click handler component
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
};

const InterestAreas = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  
  // Add form state
  const [newArea, setNewArea] = useState({
    name: '',
    latitude: null,
    longitude: null,
    radius_km: 5,
    property_types: ['Land', 'Plot'],
    min_price: null,
    max_price: null,
    notifications_enabled: true
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => { fetchAreas(); }, []);

  useEffect(() => {
    if (debouncedSearch.length >= 3) {
      searchLocations(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const fetchAreas = async () => {
    try {
      const res = await api().get('/interest-areas');
      setAreas(res.data);
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
    } catch (err) { console.error('Search error:', err); }
    setSearchLoading(false);
  };

  const selectSearchResult = (result) => {
    setNewArea({
      ...newArea,
      name: result.name.split(',')[0],
      latitude: result.lat,
      longitude: result.lon
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleMapClick = useCallback((location) => {
    setNewArea(prev => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng
    }));
  }, []);

  const handleAddArea = async () => {
    if (!newArea.name || !newArea.latitude || !newArea.longitude) {
      toast.error('Please select a location');
      return;
    }
    
    try {
      const res = await api().post('/interest-areas', newArea);
      setAreas(prev => [res.data, ...prev]);
      setShowAdd(false);
      setNewArea({
        name: '',
        latitude: null,
        longitude: null,
        radius_km: 5,
        property_types: ['Land', 'Plot'],
        min_price: null,
        max_price: null,
        notifications_enabled: true
      });
      toast.success('Interest area saved!');
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.detail || 'Failed to save');
    }
  };

  const toggleNotifications = async (areaId, enabled) => {
    try {
      await api().put(`/interest-areas/${areaId}?notifications_enabled=${!enabled}`);
      setAreas(prev => prev.map(a => 
        a.id === areaId ? { ...a, notifications_enabled: !enabled } : a
      ));
      toast.success(enabled ? 'Notifications disabled' : 'Notifications enabled');
    } catch (e) { toast.error('Failed to update'); }
  };

  const deleteArea = async (areaId) => {
    if (!window.confirm('Delete this interest area?')) return;
    try {
      await api().delete(`/interest-areas/${areaId}`);
      setAreas(prev => prev.filter(a => a.id !== areaId));
      toast.success('Deleted!');
    } catch (e) { toast.error('Failed to delete'); }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} data-testid="back-btn" className="w-10 h-10 flex items-center justify-center">
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Interest Areas</h1>
              <p className="text-xs text-gray-500">Get alerts for new properties</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            data-testid="add-area-btn"
            className="w-10 h-10 flex items-center justify-center"
          >
            <Plus className="w-6 h-6 text-blue-500" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl skeleton" />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-gray-900 font-semibold">No interest areas yet</p>
            <p className="text-gray-500 text-sm mt-1">Save locations to get property alerts</p>
            <button 
              onClick={() => setShowAdd(true)}
              className="mt-6 px-8 py-3 bg-blue-500 text-white font-semibold rounded-xl"
            >
              Add Location
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {areas.map((area, i) => (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 truncate">{area.name}</p>
                        <button
                          onClick={() => toggleNotifications(area.id, area.notifications_enabled)}
                          className={`p-2 rounded-lg ${area.notifications_enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {area.notifications_enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {area.radius_km} km radius • {area.property_types.join(', ')}
                      </p>
                      {(area.min_price || area.max_price) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Price: ₹{area.min_price || 0}L - ₹{area.max_price || '∞'}L
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/agentapex/search?lat=${area.latitude}&lng=${area.longitude}&radius=${area.radius_km}`)}
                      className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 flex items-center justify-center gap-1.5"
                    >
                      <Search className="w-4 h-4" /> View Properties
                    </button>
                    <button
                      onClick={() => deleteArea(area.id)}
                      className="p-2.5 bg-red-50 text-red-500 rounded-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Interest Area Sheet */}
      <Drawer.Root open={showAdd} onOpenChange={setShowAdd}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[1001]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[1002] outline-none max-h-[95vh] overflow-y-auto">
            <div className="p-4 pb-8">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Add Interest Area</h2>
              <p className="text-sm text-gray-500 mb-6">Get notified when new properties are added here</p>
              
              {/* Location Search */}
              <div className="mb-4">
                <label className="text-sm text-gray-500 mb-1.5 block">Search Location</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for area, city..."
                    className="w-full pl-10"
                  />
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                    {searchResults.map(result => (
                      <button
                        key={result.id}
                        onClick={() => selectSearchResult(result)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{result.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Map */}
              <div className="h-48 rounded-xl overflow-hidden mb-4 border border-gray-200">
                <MapContainer
                  center={newArea.latitude ? [newArea.latitude, newArea.longitude] : [17.385, 78.4867]}
                  zoom={12}
                  className="h-full w-full"
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapClickHandler onLocationSelect={handleMapClick} />
                  {newArea.latitude && (
                    <>
                      <Marker position={[newArea.latitude, newArea.longitude]} />
                      <Circle
                        center={[newArea.latitude, newArea.longitude]}
                        radius={newArea.radius_km * 1000}
                        pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1 }}
                      />
                    </>
                  )}
                </MapContainer>
              </div>
              
              {newArea.latitude && (
                <p className="text-sm text-green-600 mb-4 flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Location selected: {newArea.name || 'Custom location'}
                </p>
              )}
              
              {/* Area Name */}
              <div className="mb-4">
                <label className="text-sm text-gray-500 mb-1.5 block">Area Name *</label>
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  placeholder="e.g., Banjara Hills, Madhapur"
                  className="w-full"
                />
              </div>
              
              {/* Radius */}
              <div className="mb-4">
                <label className="text-sm text-gray-500 mb-2 block">Search Radius</label>
                <div className="flex gap-2">
                  {RADIUS_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setNewArea({ ...newArea, radius_km: r })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        newArea.radius_km === r 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Property Types */}
              <div className="mb-4">
                <label className="text-sm text-gray-500 mb-2 block">Property Types</label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        const types = newArea.property_types.includes(type)
                          ? newArea.property_types.filter(t => t !== type)
                          : [...newArea.property_types, type];
                        setNewArea({ ...newArea, property_types: types });
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        newArea.property_types.includes(type)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Price Range */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-500 mb-1.5 block">Min Price (Lakhs)</label>
                  <input
                    type="number"
                    value={newArea.min_price || ''}
                    onChange={(e) => setNewArea({ ...newArea, min_price: e.target.value ? Number(e.target.value) : null })}
                    placeholder="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 mb-1.5 block">Max Price (Lakhs)</label>
                  <input
                    type="number"
                    value={newArea.max_price || ''}
                    onChange={(e) => setNewArea({ ...newArea, max_price: e.target.value ? Number(e.target.value) : null })}
                    placeholder="No limit"
                    className="w-full"
                  />
                </div>
              </div>
              
              <button
                onClick={handleAddArea}
                className="w-full py-3.5 bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Bell className="w-5 h-5" />
                Save & Enable Alerts
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default InterestAreas;
