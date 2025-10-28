import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Heart, User, Search, Filter, X } from 'lucide-react';
import AuthScreen from '../../components/AuthScreen';
import ChatInterface from '../../components/ChatInterface';
import GoogleMapView from '../../components/GoogleMapView';
import { useLanguage } from '../../i18n/translations';
import './IncomeLandsApp.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const IncomeLandsApp = () => {
  const { t, language } = useLanguage();
  
  // Auth state - Check localStorage for existing session
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('incomelands_token') ? true : false;
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('incomelands_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('incomelands_token') || null;
  });
  
  // Navigation state
  const [activeTab, setActiveTab] = useState('home');
  const [showChat, setShowChat] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyDetail, setShowPropertyDetail] = useState(false);
  
  // Data state
  const [properties, setProperties] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(20);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    propertyType: null,
    transactionType: 'sell',
    minPrice: null,
    maxPrice: null,
    distance: 5
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation && isAuthenticated) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          fetchProperties(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log('Location error:', error);
          // Default to Hyderabad
          setUserLocation({ latitude: 17.385, longitude: 78.486 });
          fetchProperties(17.385, 78.486);
        }
      );
    }
  }, [isAuthenticated]);

  // Fetch properties from backend
  const fetchProperties = async (lat, lng) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/incomelands/properties/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radius_km: filters.distance,
          property_type: filters.propertyType,
          transaction_type: filters.transactionType,
          min_price: filters.minPrice,
          max_price: filters.maxPrice,
          limit: 50
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
    setLoading(false);
  };

  // Fetch my properties
  const fetchMyProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/api/incomelands/properties/my/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching my properties:', error);
    }
  };

  // Fetch credits
  const fetchCredits = async () => {
    try {
      const response = await fetch(`${API_URL}/api/incomelands/credits/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCredits(data.total_credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  // Handle authentication success
  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setToken(userData.token || 'mock_token');
    setCredits(userData.free_credits || 20);
    
    // Save to localStorage
    localStorage.setItem('incomelands_user', JSON.stringify(userData));
    localStorage.setItem('incomelands_token', userData.token || 'mock_token');
  };

  // Handle property creation
  const handlePropertyComplete = async (propertyData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/incomelands/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(propertyData)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowChat(false);
        setActiveTab('home');
        if (userLocation) {
          fetchProperties(userLocation.latitude, userLocation.longitude);
        }
        fetchMyProperties();
        alert(t('propertyAdded'));
      }
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Failed to create property');
    }
    setLoading(false);
  };

  // Handle property like
  const handleLike = async (propertyId) => {
    try {
      const response = await fetch(`${API_URL}/api/incomelands/properties/${propertyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Update local state
        setProperties(prev => prev.map(p => 
          p.id === propertyId 
            ? { ...p, isLiked: data.liked, likes: data.liked ? [...(p.likes || []), user.id] : (p.likes || []).filter(id => id !== user.id) }
            : p
        ));
      }
    } catch (error) {
      console.error('Error liking property:', error);
    }
  };

  // Handle contact unlock
  const handleUnlockContact = async (propertyId) => {
    if (credits < 10) {
      alert('Insufficient credits! Need 10 credits.');
      return;
    }
    
    if (!confirm(`Unlock contact for 10 credits?\nYour balance: ${credits} credits`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/incomelands/properties/${propertyId}/unlock-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ property_id: propertyId, amount: 10 })
      });
      
      const data = await response.json();
      if (data.success) {
        setCredits(data.remaining_credits);
        alert(`Contact Unlocked!\n${data.agent_phone}\n\nRemaining credits: ${data.remaining_credits}`);
      }
    } catch (error) {
      console.error('Error unlocking contact:', error);
      alert('Failed to unlock contact');
    }
  };

  // Show authentication screen if not logged in
  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Show chat interface for posting property
  if (showChat) {
    return (
      <ChatInterface
        propertyType="lands"
        transactionType="sell"
        onComplete={handlePropertyComplete}
        onCancel={() => setShowChat(false)}
      />
    );
  }

  // Render property card
  const PropertyCard = ({ property }) => {
    const isLiked = property.likes?.includes(user.id);
    
    return (
      <div className="property-card" onClick={() => {
        setSelectedProperty(property);
        setShowPropertyDetail(true);
      }}>
        {property.photos && property.photos.length > 0 ? (
          <img src={property.photos[0]} alt="Property" className="property-image" />
        ) : (
          <div className="property-image-placeholder">
            <MapPin size={32} />
          </div>
        )}
        
        <button
          className="like-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleLike(property.id);
          }}
        >
          <Heart size={20} fill={isLiked ? '#f44336' : 'none'} color={isLiked ? '#f44336' : 'white'} />
        </button>
        
        <div className="property-info">
          <h3 className="property-location">{property.location?.address || 'Unknown Location'}</h3>
          <div className="property-details">
            <span>{property.property_type}</span>
            {property.distance_km && <span>• {property.distance_km} km</span>}
          </div>
          <div className="property-price">
            ₹{(property.price?.amount / 100000).toFixed(2)}L
            {property.price?.negotiable && <span className="negotiable"> (Negotiable)</span>}
          </div>
          
          {property.agent_id !== user.id && (
            <button
              className="unlock-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleUnlockContact(property.id);
              }}
            >
              {property.contact_locked ? '🔒 Unlock (10₹)' : '✅ Contact'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="incomelands-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1>IncomeLands</h1>
        </div>
        <div className="header-right">
          <div className="credits-badge">
            💰 {credits}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        {activeTab === 'home' && (
          <div className="home-screen">
            {/* Search Bar */}
            <div className="search-container">
              <div className="search-bar">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Search location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                className="filter-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={20} />
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="filters-panel">
                <div className="filter-row">
                  <label>Type:</label>
                  <select
                    value={filters.propertyType || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value || null }))}
                  >
                    <option value="">All</option>
                    <option value="lands">Lands</option>
                    <option value="plot">Plot</option>
                    <option value="flat">Flat</option>
                    <option value="villa">Villa</option>
                  </select>
                </div>
                <div className="filter-row">
                  <label>Distance:</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={filters.distance}
                    onChange={(e) => setFilters(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
                  />
                  <span>{filters.distance} km</span>
                </div>
                <button
                  className="apply-filters-btn"
                  onClick={() => {
                    if (userLocation) {
                      fetchProperties(userLocation.latitude, userLocation.longitude);
                    }
                    setShowFilters(false);
                  }}
                >
                  Apply Filters
                </button>
              </div>
            )}

            {/* Properties Grid */}
            <div className="properties-grid">
              {loading ? (
                <div className="loading">Loading properties...</div>
              ) : properties.length === 0 ? (
                <div className="empty-state">
                  <MapPin size={64} color="#ccc" />
                  <p>No properties found nearby</p>
                  <button onClick={() => setShowChat(true)}>Post First Property</button>
                </div>
              ) : (
                properties.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'map' && userLocation && (
          <GoogleMapView
            myProperties={myProperties}
            projects={properties.filter(p => p.transaction_type === 'sell')}
            requirements={properties.filter(p => p.transaction_type === 'buy')}
            onMarkerClick={(property) => {
              setSelectedProperty(property);
              setShowPropertyDetail(true);
            }}
          />
        )}

        {activeTab === 'favorites' && (
          <div className="favorites-screen">
            <h2>Saved Properties</h2>
            <div className="properties-grid">
              {favorites.length === 0 ? (
                <div className="empty-state">
                  <Heart size={64} color="#ccc" />
                  <p>No saved properties</p>
                </div>
              ) : (
                favorites.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-screen">
            <div className="profile-header">
              <div className="profile-avatar">
                {user.name?.charAt(0) || 'U'}
              </div>
              <h2>{user.name || 'User'}</h2>
              <p>{user.mobile}</p>
            </div>
            
            <div className="profile-stats">
              <div className="stat-card">
                <div className="stat-value">{myProperties.length}</div>
                <div className="stat-label">Properties</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{credits}</div>
                <div className="stat-label">Credits</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{favorites.length}</div>
                <div className="stat-label">Saved</div>
              </div>
            </div>
            
            <div className="profile-menu">
              <button onClick={fetchMyProperties}>My Properties</button>
              <button>Language: {language}</button>
              <button>Settings</button>
              <button onClick={() => {
                localStorage.removeItem('incomelands_user');
                localStorage.removeItem('incomelands_token');
                setIsAuthenticated(false);
                setUser(null);
                setToken(null);
              }}>Logout</button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Search size={24} />
          <span>Home</span>
        </button>
        <button
          className={`nav-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <MapPin size={24} />
          <span>Map</span>
        </button>
        <button
          className="nav-btn add-btn"
          onClick={() => setShowChat(true)}
        >
          <Plus size={28} />
        </button>
        <button
          className={`nav-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <Heart size={24} />
          <span>Saved</span>
        </button>
        <button
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={24} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default IncomeLandsApp;
