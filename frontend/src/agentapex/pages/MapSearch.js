import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGeoLocation } from '../context/LocationContext';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import { ArrowLeft, SlidersHorizontal, MapPin, Grid3X3, X, Heart, Search, Loader2, Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';

// Debounce hook for search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Property markers - larger and more visible
// Property markers with type icons
const createSaleMarker = (price, priceUnit, propertyType) => {
  const icon = propertyType === 'Land' ? '🌾' : propertyType === 'Plot' ? '📐' : '🏠';
  return L.divIcon({
    className: 'sale-marker',
    html: `<div style="
      display:flex;
      align-items:center;
      justify-content:center;
      gap:4px;
      min-width:70px;
      height:32px;
      padding:0 10px;
      background:linear-gradient(135deg, #FF9500, #FF6B00);
      border:2px solid white;
      border-radius:16px;
      box-shadow:0 3px 10px rgba(0,0,0,0.25);
      font-size:12px;
      font-weight:700;
      color:white;
      white-space:nowrap;
    "><span style="font-size:14px">${icon}</span>₹${price}${priceUnit === 'Crore' ? 'Cr' : 'L'}</div>`,
    iconSize: [70, 32], iconAnchor: [35, 16], popupAnchor: [0, -16]
  });
};

const createBuyMarker = (propertyType) => {
  const icon = propertyType === 'Land' ? '🌾' : propertyType === 'Plot' ? '📐' : '🔍';
  return L.divIcon({
    className: 'buy-marker',
    html: `<div style="
      display:flex;
      align-items:center;
      justify-content:center;
      gap:4px;
      min-width:80px;
      height:36px;
      padding:0 12px;
      background:linear-gradient(135deg, #0095F6, #0066CC);
      border:3px solid white;
      border-radius:18px;
      box-shadow:0 4px 12px rgba(0,149,246,0.4);
      font-size:12px;
      font-weight:700;
      color:white;
      white-space:nowrap;
    "><span style="font-size:14px">${icon}</span>WANTED</div>`,
    iconSize: [80, 36], iconAnchor: [40, 18], popupAnchor: [0, -18]
  });
};

const TYPES = ['All', 'Land', 'Plot', 'Apartment', 'House', 'Commercial'];
const RADIUS_OPTIONS = [5, 10, 20, 50];

const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 13); }, [center, map]);
  return null;
};

// Property Card - Instagram style
const PropertyCard = ({ property, isBuying, onFavorite, isFavorite }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => !isBuying && navigate(`/agentapex/property/${property.id}`)}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100"
    >
      <div className="relative aspect-[4/3]">
        <img
          src={property.images?.[0] || 'https://images.pexels.com/photos/3030307/pexels-photo-3030307.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold text-white ${isBuying ? 'bg-blue-500' : 'bg-amber-500'}`}>
            {isBuying ? 'WANTED' : 'FOR SALE'}
          </span>
        </div>
        {!isBuying && (
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite?.(property.id); }}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="text-lg font-bold text-gray-900">
          ₹{isBuying ? `${property.budget_min}-${property.budget_max}` : property.price} {property.price_unit || property.budget_unit}
        </p>
        <p className="text-sm text-gray-900 font-medium mt-0.5">{property.title || property.property_type}</p>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          {property.location || property.location_preference}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{property.property_type}</span>
          <span className="text-xs text-gray-500">{isBuying ? (property.area_min || 'Any size') : `${property.area} ${property.area_unit}`}</span>
        </div>
      </div>
    </motion.div>
  );
};

const MapSearch = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const { location: userLocation, loading: locationLoading, requestLocation, permissionStatus } = useGeoLocation();
  
  const [viewMode, setViewMode] = useState('map');
  const [listingMode, setListingMode] = useState('sell');
  const [properties, setProperties] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  
  // Search & Filters
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [maxPrice, setMaxPrice] = useState(500);
  const [radius, setRadius] = useState(10);
  const [searchCenter, setSearchCenter] = useState(null);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Default to Hyderabad if no user location
  const DEFAULT_CENTER = [17.385, 78.4867];
  const mapCenter = searchCenter || (userLocation ? [userLocation.latitude, userLocation.longitude] : DEFAULT_CENTER);

  // Location search with Nominatim
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

  const selectLocation = (result) => {
    setSearchCenter([result.lat, result.lon]);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    toast.success(`Showing properties near ${result.name.split(',')[0]}`);
  };

  useEffect(() => { fetchData(); }, [selectedType, maxPrice, radius, searchCenter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const lat = searchCenter?.[0] || userLocation?.latitude;
      const lng = searchCenter?.[1] || userLocation?.longitude;
      const params = { latitude: lat, longitude: lng, radius_km: radius };
      if (selectedType !== 'All') params.property_type = selectedType;
      if (maxPrice) params.max_price = maxPrice;
      
      const [propsRes, reqsRes, favsRes] = await Promise.all([
        api().get('/properties', { params }),
        api().get('/requirements/all'),
        api().get('/favorites')
      ]);
      
      setProperties(propsRes.data);
      setRequirements(reqsRes.data);
      setFavorites(new Set(favsRes.data.map(p => p.id)));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleFavorite = async (id) => {
    try {
      if (favorites.has(id)) {
        await api().delete(`/favorites/${id}`);
        setFavorites(prev => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        await api().post(`/favorites/${id}`);
        setFavorites(prev => new Set(prev).add(id));
      }
    } catch (e) { console.error(e); }
  };

  const data = listingMode === 'sell' ? properties : requirements;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} data-testid="back-btn" className="w-10 h-10 flex items-center justify-center shrink-0">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          
          {/* Search Bar */}
          <div 
            onClick={() => setShowSearch(true)}
            className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5 cursor-pointer"
          >
            <Search className="w-5 h-5 text-gray-400" />
            <span className="text-gray-500 text-sm">
              {searchCenter ? 'Custom location' : 'Search location...'}
            </span>
          </div>
          
          <button 
            onClick={() => setShowFilters(true)} 
            data-testid="filter-btn"
            className="w-10 h-10 flex items-center justify-center shrink-0"
          >
            <SlidersHorizontal className="w-6 h-6 text-gray-900" />
          </button>
        </div>
        
        {/* Mode Toggle - Instagram style segmented control */}
        <div className="flex gap-2 mt-3 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setListingMode('sell')}
            data-testid="mode-sell"
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              listingMode === 'sell' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            For Sale ({properties.length})
          </button>
          <button
            onClick={() => {
              setListingMode('buy');
              // Center map on first requirement if available
              const reqsWithLocation = requirements.filter(r => r.latitude && r.longitude);
              if (reqsWithLocation.length > 0) {
                setSearchCenter([reqsWithLocation[0].latitude, reqsWithLocation[0].longitude]);
              }
            }}
            data-testid="mode-buy"
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              listingMode === 'buy' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Wanted ({requirements.length})
          </button>
        </div>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[1000] flex flex-col"
          >
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="w-10 h-10 flex items-center justify-center">
                  <ArrowLeft className="w-6 h-6" />
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
                      onClick={() => selectLocation(result)}
                      className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-gray-50"
                    >
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{result.name.split(',')[0]}</p>
                        <p className="text-xs text-gray-500 truncate">{result.name.split(',').slice(1).join(',')}</p>
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
                  <p className="text-sm text-gray-500 mb-4">Popular searches</p>
                  <div className="flex flex-wrap gap-2">
                    {['Hyderabad', 'Bangalore', 'Mumbai', 'Chennai', 'Pune'].map(city => (
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Toggle */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setViewMode('map')}
          data-testid="view-map"
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            viewMode === 'map' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'
          }`}
        >
          <MapPin className="w-4 h-4" /> Map
        </button>
        <button
          onClick={() => setViewMode('list')}
          data-testid="view-list"
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            viewMode === 'list' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'
          }`}
        >
          <Grid3X3 className="w-4 h-4" /> Grid
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {viewMode === 'map' ? (
          <div className="h-[calc(100vh-180px)]">
            <MapContainer center={mapCenter} zoom={13} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapRecenter center={mapCenter} />
              
              {userLocation && (
                <>
                  <Marker position={[userLocation.latitude, userLocation.longitude]} icon={L.divIcon({
                    className: 'user-loc',
                    html: '<div style="width:12px;height:12px;background:#0095F6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 2px rgba(0,149,246,0.3)"></div>',
                    iconSize: [12, 12], iconAnchor: [6, 6]
                  })}>
                    <Popup><span className="text-sm font-medium">You are here</span></Popup>
                  </Marker>
                  <Circle 
                    center={[userLocation.latitude, userLocation.longitude]} 
                    radius={radius * 1000} 
                    pathOptions={{ 
                      color: listingMode === 'sell' ? '#FF9500' : '#0095F6', 
                      fillOpacity: 0.05, 
                      weight: 2,
                      dashArray: '5, 5'
                    }} 
                  />
                </>
              )}
              
              {listingMode === 'sell' && properties.map(p => (
                <Marker key={p.id} position={[p.latitude, p.longitude]} icon={createSaleMarker(p.price, p.price_unit, p.property_type)}>
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{p.property_type === 'Land' ? '🌾' : '📐'}</span>
                        <span className="font-bold text-amber-600">₹{p.price} {p.price_unit}</span>
                      </div>
                      <p className="text-gray-600 text-sm font-medium">{p.property_type}</p>
                      <p className="text-gray-400 text-xs">{p.area} {p.area_unit} • {p.location}</p>
                      <button 
                        onClick={() => navigate(`/agentapex/property/${p.id}`)} 
                        className="mt-3 w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {listingMode === 'buy' && requirements.filter(r => r.latitude && r.longitude).map((r) => (
                <Marker 
                  key={r.id} 
                  position={[r.latitude, r.longitude]} 
                  icon={createBuyMarker(r.property_type)}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{r.property_type === 'Land' ? '🌾' : '📐'}</span>
                        <span className="font-bold text-blue-600">Wanted</span>
                      </div>
                      <p className="text-gray-600 text-sm font-medium">{r.property_type}</p>
                      <p className="text-gray-500 text-sm">Budget: ₹{r.budget_min}-{r.budget_max} {r.budget_unit}</p>
                      <p className="text-gray-400 text-xs">{r.location_preference}</p>
                      <p className="text-xs text-gray-400 mt-1">Area: {r.area_min}-{r.area_max} {r.area_unit}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            
            {/* My Location Button */}
            <button
              onClick={() => {
                if (userLocation) {
                  setSearchCenter([userLocation.latitude, userLocation.longitude]);
                  toast.success('Centered on your location');
                } else {
                  requestLocation();
                  toast.info('Requesting location access...');
                }
              }}
              className="absolute top-4 right-4 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200"
              data-testid="my-location-btn"
            >
              <Crosshair className={`w-5 h-5 ${userLocation ? 'text-blue-500' : 'text-gray-400'}`} />
            </button>
            
            {/* Floating Result Count */}
            <div className="absolute bottom-6 left-4 right-4 z-[1000]">
              <button
                onClick={() => setViewMode('list')}
                className={`w-full py-3.5 rounded-full font-semibold text-white shadow-lg ${
                  listingMode === 'sell' ? 'bg-amber-500' : 'bg-blue-500'
                }`}
              >
                View {data.length} {listingMode === 'sell' ? 'Properties' : 'Requirements'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 gap-3 pb-20">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-2xl skeleton" />
              ))
            ) : data.length === 0 ? (
              <div className="col-span-2 text-center py-16">
                <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No properties found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              data.map(item => (
                <PropertyCard 
                  key={item.id} 
                  property={item} 
                  isBuying={listingMode === 'buy'}
                  isFavorite={favorites.has(item.id)}
                  onFavorite={toggleFavorite}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Filter Drawer - Instagram style bottom sheet */}
      <Drawer.Root open={showFilters} onOpenChange={setShowFilters}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-[1001]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[1002] max-h-[85vh] outline-none">
            <div className="p-4">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Filters</h2>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              {/* Property Type */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">Property Type</p>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedType === t 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Price Range */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">Max Price</p>
                  <p className="text-sm font-bold text-gray-900">₹{maxPrice} Lakhs</p>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
                />
              </div>
              
              {/* Radius */}
              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-900 mb-3">Search Radius</p>
                <div className="flex gap-2">
                  {RADIUS_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                        radius === r 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Apply Button */}
              <button
                onClick={() => { fetchData(); setShowFilters(false); }}
                className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl"
              >
                Apply Filters
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
};

export default MapSearch;
