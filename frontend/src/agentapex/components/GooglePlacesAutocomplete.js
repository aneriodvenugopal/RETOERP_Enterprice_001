import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Highlight matching text
const HighlightText = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;
  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="text-blue-600 font-semibold">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
};

/**
 * Google Places Autocomplete Component
 * Looks and feels exactly like Google Maps search.
 * 
 * Features:
 * - Session tokens (groups keystrokes = faster + cheaper)
 * - Location bias (nearby Hyderabad places show first)
 * - English results with proper partial matching
 * - No "No locations found" flash during typing
 * 
 * Props:
 * - onSelect: (location) => void
 * - onClose: () => void
 * - mode: 'inline' | 'fullscreen'
 * - placeholder: string
 * - initialValue: string
 * - className: string
 */
export const GooglePlacesAutocomplete = ({
  onSelect,
  onClose,
  mode = 'inline',
  placeholder = 'Search location...',
  initialValue = '',
  className = ''
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const containerRef = useRef(null);
  const debouncedQuery = useDebounce(query, 200);

  // Initialize Google Places
  useEffect(() => {
    let attempts = 0;
    let intervalId = null;

    const initGooglePlaces = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        // Create session token for grouped billing
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

        const mapDiv = document.createElement('div');
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);
        const map = new window.google.maps.Map(mapDiv, {
          center: { lat: 17.385, lng: 78.4867 },
          zoom: 10
        });
        placesServiceRef.current = new window.google.maps.places.PlacesService(map);
        if (intervalId) clearInterval(intervalId);
        return true;
      }
      return false;
    };

    if (!initGooglePlaces()) {
      intervalId = setInterval(() => {
        attempts++;
        if (initGooglePlaces() || attempts >= 20) {
          clearInterval(intervalId);
        }
      }, 500);
    }

    if (mode === 'fullscreen') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [mode]);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchPlaces(debouncedQuery);
    } else {
      setResults([]);
      setShowResults(false);
      setHasSearched(false);
    }
  }, [debouncedQuery]);

  // Click outside to close (inline mode)
  useEffect(() => {
    if (mode !== 'inline') return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mode]);

  const searchPlaces = async (searchQuery) => {
    if (!autocompleteServiceRef.current) return;

    setLoading(true);
    setHasSearched(false);

    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      setHasSearched(true);
    }, 3000);

    // Hyderabad location bias — nearby places show first
    const hyderabadCenter = new window.google.maps.LatLng(17.385, 78.4867);
    const circle = new window.google.maps.Circle({
      center: hyderabadCenter,
      radius: 50000 // 50km radius bias
    });

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: searchQuery,
        componentRestrictions: { country: 'in' },
        language: 'en',
        locationBias: circle.getBounds(),
        sessionToken: sessionTokenRef.current,
      },
      (predictions, status) => {
        clearTimeout(safetyTimeout);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setResults(predictions.map(p => ({
            place_id: p.place_id,
            mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
            secondaryText: p.structured_formatting?.secondary_text || p.description.split(',').slice(1).join(','),
            fullDescription: p.description,
            types: p.types || [],
          })));
          setShowResults(true);
        } else {
          setResults([]);
        }
        setLoading(false);
        setHasSearched(true);
      }
    );
  };

  const handleSelectPlace = useCallback((result) => {
    if (!placesServiceRef.current) {
      toast.error('Google Places not initialized');
      return;
    }

    setLoading(true);
    placesServiceRef.current.getDetails(
      {
        placeId: result.place_id,
        fields: ['geometry', 'formatted_address', 'address_components', 'name', 'place_id'],
        sessionToken: sessionTokenRef.current,
      },
      (place, status) => {
        // Reset session token after selection (new session for next search)
        if (window.google?.maps?.places) {
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }

        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          let city = '', state = '', postal_code = '';
          place.address_components?.forEach(comp => {
            if (comp.types.includes('locality')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
            if (comp.types.includes('postal_code')) postal_code = comp.long_name;
          });

          const locationData = {
            place_id: result.place_id,
            location_text: result.mainText,
            latitude: lat,
            longitude: lng,
            formatted_address: place.formatted_address,
            city,
            state,
            postal_code
          };

          onSelect(locationData);
          setQuery(result.mainText);
          setShowResults(false);
          setResults([]);
        } else {
          toast.error('Failed to get location details');
        }
        setLoading(false);
      }
    );
  }, [onSelect]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const popularAreas = ['Hyderabad', 'Vijayawada', 'Guntur', 'Tirupati', 'Warangal', 'Bangalore', 'Chennai'];

  // ─── RESULT ITEM ───
  const ResultItem = ({ result, idx }) => (
    <button
      key={result.place_id}
      onClick={() => handleSelectPlace(result)}
      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-b-0"
      data-testid={`location-result-${idx}`}
    >
      <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        <MapPin className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-gray-900 leading-tight">
          <HighlightText text={result.mainText} query={query} />
        </p>
        <p className="text-[13px] text-[#70757a] mt-0.5 truncate leading-tight">{result.secondaryText}</p>
      </div>
    </button>
  );

  // ─── RESULTS BODY (shared between modes) ───
  const ResultsBody = () => {
    if (loading) {
      return (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      );
    }
    if (results.length > 0) {
      return (
        <div className="py-1">
          {results.map((result, idx) => (
            <ResultItem key={result.place_id} result={result} idx={idx} />
          ))}
        </div>
      );
    }
    if (hasSearched && query.length >= 2 && !loading) {
      return (
        <div className="py-8 text-center">
          <MapPin className="w-9 h-9 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No results for "{query}"</p>
          <p className="text-xs text-gray-400 mt-1">Try different spelling or nearby area name</p>
        </div>
      );
    }
    return (
      <div className="p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 px-1">Popular Areas</p>
        <div className="flex flex-wrap gap-2">
          {popularAreas.map(area => (
            <button
              key={area}
              onClick={() => setQuery(area)}
              className="px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              {area}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ─── FULLSCREEN MODE ───
  if (mode === 'fullscreen') {
    return (
      <div className="fixed inset-0 bg-white z-[2000] flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-b border-gray-100 shadow-sm">
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            data-testid="close-location-search"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-900 placeholder-gray-400"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              data-testid="location-search-input"
            />
            {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-1" />}
            {query && !loading && (
              <button onClick={handleClear} className="ml-1 p-1 rounded-full hover:bg-gray-200">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto bg-white">
          <ResultsBody />
        </div>
      </div>
    );
  }

  // ─── INLINE MODE ───
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center bg-gray-100 rounded-xl px-3.5 py-2.5">
        <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
          autoComplete="off"
          data-testid="location-search-input"
        />
        {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-1" />}
        {query && !loading && (
          <button onClick={handleClear} className="ml-1 p-0.5">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[300px] overflow-y-auto">
          <ResultsBody />
        </div>
      )}
    </div>
  );
};

// ─── HOOK VERSION (for custom UIs) ───
export const useGooglePlacesAutocomplete = () => {
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let attempts = 0;
    let intervalId = null;

    const init = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        const mapDiv = document.createElement('div');
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);
        const map = new window.google.maps.Map(mapDiv, { center: { lat: 17.385, lng: 78.4867 }, zoom: 10 });
        placesServiceRef.current = new window.google.maps.places.PlacesService(map);
        setIsReady(true);
        if (intervalId) clearInterval(intervalId);
        return true;
      }
      return false;
    };

    if (!init()) {
      intervalId = setInterval(() => {
        attempts++;
        if (init() || attempts >= 20) clearInterval(intervalId);
      }, 500);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, []);

  const searchPlaces = useCallback((query) => {
    return new Promise((resolve) => {
      if (!autocompleteServiceRef.current || !query) {
        resolve([]);
        return;
      }

      const hyderabadCenter = new window.google.maps.LatLng(17.385, 78.4867);
      const circle = new window.google.maps.Circle({ center: hyderabadCenter, radius: 50000 });

      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: 'in' },
          language: 'en',
          locationBias: circle.getBounds(),
          sessionToken: sessionTokenRef.current,
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions.map(p => ({
              place_id: p.place_id,
              mainText: p.structured_formatting?.main_text || p.description.split(',')[0],
              secondaryText: p.structured_formatting?.secondary_text || p.description.split(',').slice(1).join(','),
              fullDescription: p.description,
            })));
          } else {
            resolve([]);
          }
        }
      );
    });
  }, []);

  const getPlaceDetails = useCallback((placeId) => {
    return new Promise((resolve, reject) => {
      if (!placesServiceRef.current) {
        reject(new Error('Not initialized'));
        return;
      }
      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: ['geometry', 'formatted_address', 'address_components', 'name'],
          sessionToken: sessionTokenRef.current,
        },
        (place, status) => {
          // Reset session token
          if (window.google?.maps?.places) {
            sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
          }
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            let city = '', state = '', postal_code = '';
            place.address_components?.forEach(comp => {
              if (comp.types.includes('locality')) city = comp.long_name;
              if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
              if (comp.types.includes('postal_code')) postal_code = comp.long_name;
            });
            resolve({ latitude: lat, longitude: lng, formatted_address: place.formatted_address, city, state, postal_code });
          } else {
            reject(new Error('Place details failed'));
          }
        }
      );
    });
  }, []);

  return { searchPlaces, search: searchPlaces, getPlaceDetails, isReady };
};

export default GooglePlacesAutocomplete;
