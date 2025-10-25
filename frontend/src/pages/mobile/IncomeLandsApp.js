import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Mic, Phone, Plus, List, Search, Wallet, Users, Home as HomeIcon, FileText, Navigation2, Filter, ChevronDown, CheckCircle } from 'lucide-react';
import { api } from '../../services';
import './IncomeLandsApp.css';

const IncomeLandsApp = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [agent, setAgent] = useState(null);
  const [mapView, setMapView] = useState('properties'); // properties, projects, requirements
  const [properties, setProperties] = useState([]);
  const [projects, setProjects] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [credits, setCredits] = useState(100); // Initial free credits
  const [userLocation, setUserLocation] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    initApp();
    getUserLocation();
  }, []);

  const initApp = () => {
    const savedAgent = localStorage.getItem('incomelands_agent');
    const savedCredits = localStorage.getItem('incomelands_credits');
    const savedProps = localStorage.getItem('my_properties');
    
    if (savedAgent) setAgent(JSON.parse(savedAgent));
    if (savedCredits) setCredits(parseInt(savedCredits));
    if (savedProps) setMyProperties(JSON.parse(savedProps));
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          fetchNearbyData(location);
        },
        () => {
          // Fallback to default location
          const location = { latitude: 17.385, longitude: 78.486 };
          setUserLocation(location);
          fetchNearbyData(location);
        }
      );
    }
  };

  const fetchNearbyData = async (location) => {
    try {
      // Fetch RETOERP projects
      const projectsRes = await api.get('/marketplace/projects', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius_km: 25
        }
      });
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.projects);
      }

      // Fetch buyer requirements
      const reqRes = await api.get('/marketplace/requirements', {
        params: { status: 'active' }
      });
      if (reqRes.data.success) {
        setRequirements(reqRes.data.requirements);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return <MapViewScreen 
          mapView={mapView}
          setMapView={setMapView}
          projects={projects}
          requirements={requirements}
          myProperties={myProperties}
          onPropertyClick={setSelectedProperty}
          userLocation={userLocation}
        />;
      case 'add':
        return <AddPropertyScreen 
          agent={agent}
          userLocation={userLocation}
          onPropertyAdd={(prop) => {
            const updated = [...myProperties, prop];
            setMyProperties(updated);
            localStorage.setItem('my_properties', JSON.stringify(updated));
          }}
        />;
      case 'leads':
        return <MyLeadsScreen agent={agent} />;
      case 'requirements':
        return <RequirementsScreen 
          agent={agent}
          requirements={requirements}
          credits={credits}
          setCredits={setCredits}
        />;
      case 'profile':
        return <AgentProfileScreen 
          agent={agent}
          setAgent={setAgent}
          credits={credits}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="incomelands-native">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="app-title">
          <MapPin size={24} color="#FF6B35" />
          <div>
            <h1>IncomeLands</h1>
            <span>Partner by RETOERP</span>
          </div>
        </div>
        <div className="credits-badge">
          <Wallet size={16} />
          <span>{credits} Credits</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="app-main">
        {renderContent()}
      </div>

      {/* Bottom Navigation - Telugu Labels */}
      <div className="bottom-nav-native">
        <button 
          className={activeTab === 'map' ? 'active' : ''}
          onClick={() => setActiveTab('map')}
        >
          <MapPin size={22} />
          <span>మ్యాప్</span>
        </button>
        <button 
          className={activeTab === 'add' ? 'active' : ''}
          onClick={() => setActiveTab('add')}
        >
          <Plus size={22} />
          <span>యాడ్ చేయండి</span>
        </button>
        <button 
          className={activeTab === 'leads' ? 'active' : ''}
          onClick={() => setActiveTab('leads')}
        >
          <Users size={22} />
          <span>లీడ్స్</span>
        </button>
        <button 
          className={activeTab === 'requirements' ? 'active' : ''}
          onClick={() => setActiveTab('requirements')}
        >
          <FileText size={22} />
          <span>కావాలి</span>
        </button>
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          <HomeIcon size={22} />
          <span>నేను</span>
        </button>
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <PropertyDetailModal 
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          credits={credits}
          setCredits={setCredits}
        />
      )}
    </div>
  );
};

// Remaining component code would continue here...
// (MapViewScreen, PropertyCard, etc.)

export default IncomeLandsApp;