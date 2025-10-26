import React, { useState, useEffect } from 'react';
import { MapPin, Camera, Mic, Phone, Plus, Users, Home as HomeIcon, FileText, Navigation2, CheckCircle, Wallet, X, Lock, Unlock, Map as MapIcon } from 'lucide-react';
import { api } from '../../services';
import GoogleMapView from '../../components/GoogleMapView';
import './IncomeLandsApp.css';

const IncomeLandsApp = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [agent, setAgent] = useState(null);
  const [mapView, setMapView] = useState('properties');
  const [projects, setProjects] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [credits, setCredits] = useState(100);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

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
    
    setLoading(false);
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
          const location = { latitude: 17.385, longitude: 78.486 };
          setUserLocation(location);
          fetchNearbyData(location);
        }
      );
    }
  };

  const fetchNearbyData = async (location) => {
    try {
      const projectsRes = await api.get('/marketplace/projects', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius_km: 25,
          limit: 50
        }
      });
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.projects);
      }

      const reqRes = await api.get('/marketplace/requirements', {
        params: { status: 'active', limit: 50 }
      });
      if (reqRes.data.success) {
        setRequirements(reqRes.data.requirements);
      }
    } catch (error) {
      console.error('Error:', error);
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
          onItemClick={setSelectedItem}
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
            alert('✅ ప్రాపర్టీ successfully add అయింది!');
            setActiveTab('map');
          }}
        />;
      case 'leads':
        return <MyLeadsScreen agent={agent} />;
      case 'requirements':
        return <RequirementsScreen 
          agent={agent}
          requirements={requirements}
          onAdd={() => fetchNearbyData(userLocation)}
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

  if (loading) {
    return (
      <div className="incomelands-loading">
        <MapPin size={48} color="#FF6B35" />
        <h2>IncomeLands</h2>
        <p>Loading...</p>
      </div>
    );
  }

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
          <span>{credits}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="app-main">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
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
          <span>యాడ్</span>
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

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal 
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          credits={credits}
          setCredits={setCredits}
          agent={agent}
        />
      )}
    </div>
  );
};

// Map View Screen
const MapViewScreen = ({ mapView, setMapView, projects, requirements, myProperties, onItemClick, userLocation }) => {
  return (
    <div className="map-view-screen">
      {/* Tabs */}
      <div className="map-tabs">
        <button 
          className={mapView === 'properties' ? 'active' : ''}
          onClick={() => setMapView('properties')}
        >
          <HomeIcon size={18} />
          <span>నా ప్రాపర్టీలు</span>
          <span className="count">{myProperties.length}</span>
        </button>
        <button 
          className={mapView === 'projects' ? 'active' : ''}
          onClick={() => setMapView('projects')}
        >
          <MapPin size={18} />
          <span>ప్రాజెక్ట్స్</span>
          <span className="count">{projects.length}</span>
        </button>
        <button 
          className={mapView === 'requirements' ? 'active' : ''}
          onClick={() => setMapView('requirements')}
        >
          <FileText size={18} />
          <span>కావాలి</span>
          <span className="count">{requirements.length}</span>
        </button>
      </div>

      {/* Location Indicator */}
      {userLocation && (
        <div className="location-bar">
          <Navigation2 size={14} />
          <span>మీ లొకేషన్ track అవుతోంది</span>
        </div>
      )}

      {/* Content */}
      <div className="map-content">
        {mapView === 'properties' && (
          <PropertiesView properties={myProperties} onItemClick={onItemClick} />
        )}
        {mapView === 'projects' && (
          <ProjectsView projects={projects} onItemClick={onItemClick} />
        )}
        {mapView === 'requirements' && (
          <RequirementsView requirements={requirements} onItemClick={onItemClick} />
        )}
      </div>
    </div>
  );
};

// Properties View
const PropertiesView = ({ properties, onItemClick }) => {
  if (properties.length === 0) {
    return (
      <div className="empty-view">
        <Camera size={64} color="#ddd" />
        <h3>మీరు ఇంకా ప్రాపర్టీలు add చేయలేదు</h3>
        <p>"యాడ్" button click చేసి మీ ప్రాపర్టీలు పోస్ట్ చేయండి</p>
      </div>
    );
  }

  return (
    <div className="items-grid">
      {properties.map((prop, idx) => (
        <div key={idx} className="property-card" onClick={() => onItemClick({...prop, type: 'property'})}>
          <div className="property-image">
            {prop.image ? (
              <img src={prop.image} alt={prop.title} />
            ) : (
              <div className="no-image"><Camera size={40} color="#ccc" /></div>
            )}
            {prop.voiceNote && (
              <div className="voice-badge"><Mic size={12} /> వాయిస్</div>
            )}
          </div>
          <div className="property-info">
            <h4>{prop.title}</h4>
            <p className="location"><MapPin size={12} /> {prop.location}</p>
            <div className="property-meta">
              <span className="price">₹{(prop.price / 100000).toFixed(1)}L</span>
              <span className="area">{prop.area} sq.ft</span>
            </div>
            <span className="property-type">{prop.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Projects View
const ProjectsView = ({ projects, onItemClick }) => {
  if (projects.length === 0) {
    return (
      <div className="empty-view">
        <MapPin size={64} color="#ddd" />
        <h3>దగ్గరలో projects లేవు</h3>
        <p>మీ location మార్చండి లేదా refresh చేయండి</p>
      </div>
    );
  }

  return (
    <div className="items-grid">
      {projects.map((project) => (
        <div key={project.id} className="property-card project" onClick={() => onItemClick({...project, type: 'project'})}>
          <div className="property-image">
            <img src={project.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'} alt={project.name} />
            <div className="project-badge">RETOERP</div>
            {project.distance_km && (
              <div className="distance-badge">{project.distance_km.toFixed(1)} km</div>
            )}
          </div>
          <div className="property-info">
            <h4>{project.name}</h4>
            <p className="location"><MapPin size={12} /> {project.city}</p>
            <div className="property-meta">
              <span className="price">₹{(project.price_range?.min / 100000).toFixed(1)}L+</span>
              <span className="area">{project.available_properties} plots</span>
            </div>
            <p className="developer">by {project.developer_name}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Requirements View
const RequirementsView = ({ requirements, onItemClick }) => {
  if (requirements.length === 0) {
    return (
      <div className="empty-view">
        <FileText size={64} color="#ddd" />
        <h3>కొనుగోలుదారుల అవసరాలు లేవు</h3>
        <p>కొత్త requirements త్వరలో వస్తాయి</p>
      </div>
    );
  }

  return (
    <div className="requirements-list">
      {requirements.map((req) => (
        <div key={req.id} className="requirement-card" onClick={() => onItemClick({...req, type: 'requirement'})}>
          <div className="req-header">
            <span className="req-type-badge">{req.property_type}</span>
            <span className="req-for">{req.requirement_type === 'buy' ? 'కొనుగోలు' : 'అద్దె'}</span>
          </div>
          <div className="req-details">
            <p className="req-budget">
              <strong>బడ్జెట్:</strong> ₹{(req.budget_min / 100000).toFixed(1)}L - ₹{(req.budget_max / 100000).toFixed(1)}L
            </p>
            <p className="req-location">
              <MapPin size={12} /> {req.preferred_locations.slice(0, 2).join(', ')}
            </p>
            {req.min_area && (
              <p className="req-area">{req.min_area} - {req.max_area} sq.ft</p>
            )}
          </div>
          <div className="req-unlock">
            <Lock size={14} />
            <span>కాంటాక్ట్ చూడండి (₹10)</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Add Property Screen
const AddPropertyScreen = ({ agent, userLocation, onPropertyAdd }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'plot',
    price: '',
    area: '',
    location: '',
    description: '',
    ownerName: '',
    ownerPhone: '',
    image: null,
    voiceNote: false
  });

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const property = {
      ...formData,
      id: Date.now(),
      postedDate: new Date().toISOString(),
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      price: parseFloat(formData.price),
      area: parseFloat(formData.area)
    };
    onPropertyAdd(property);
  };

  return (
    <div className="add-screen">
      <h2>కొత్త ప్రాపర్టీ యాడ్ చేయండి</h2>
      
      <form onSubmit={handleSubmit} className="add-form">
        {/* Image Capture */}
        <div className="image-section">
          {formData.image ? (
            <div className="captured-img">
              <img src={formData.image} alt="Property" />
              <button type="button" className="change-btn" onClick={() => setFormData({ ...formData, image: null })}>
                మార్చండి
              </button>
            </div>
          ) : (
            <label className="capture-label">
              <Camera size={40} />
              <span>ఫోటో తీయండి</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleImageCapture} hidden />
            </label>
          )}
        </div>

        {/* Voice Note */}
        <button 
          type="button" 
          className={`voice-btn ${formData.voiceNote ? 'recorded' : ''}`}
          onClick={() => {
            setFormData({ ...formData, voiceNote: !formData.voiceNote });
            if (!formData.voiceNote) alert('🎤 వాయిస్ రికార్డింగ్ feature త్వరలో available!');
          }}
        >
          <Mic size={18} />
          {formData.voiceNote ? 'వాయిస్ నోట్ recorded ✓' : 'వాయిస్ నోట్ రికార్డ్ చేయండి'}
        </button>

        <div className="form-group">
          <label>ప్రాపర్టీ రకం *</label>
          <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
            <option value="plot">ప్లాట్</option>
            <option value="house">ఇల్లు</option>
            <option value="flat">ఫ్లాట్</option>
            <option value="commercial">కమర్షియల్</option>
            <option value="agricultural">వ్యవసాయ భూమి</option>
          </select>
        </div>

        <div className="form-group">
          <label>శీర్షిక *</label>
          <input 
            type="text"
            placeholder="ఉదా: గచిబౌలి లో 200 sq yards ప్లాట్"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>ధర (₹) *</label>
            <input 
              type="number"
              placeholder="5000000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>ఏరియా (sq.ft) *</label>
            <input 
              type="number"
              placeholder="1500"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>లొకేషన్ *</label>
          <input 
            type="text"
            placeholder="గచిబౌలి, హైదరాబాద్"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>వివరణ</label>
          <textarea 
            placeholder="ప్రాపర్టీ గురించి వివరాలు..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label>యజమాని పేరు *</label>
          <input 
            type="text"
            placeholder="యజమాని పేరు"
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>యజమాని ఫోన్ *</label>
          <input 
            type="tel"
            placeholder="10-digit number"
            value={formData.ownerPhone}
            onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="submit-btn">
          <CheckCircle size={18} />
          ప్రాపర్టీ పోస్ట్ చేయండి
        </button>
      </form>
    </div>
  );
};

// My Leads Screen
const MyLeadsScreen = ({ agent }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agent) {
      fetchLeads();
    } else {
      setLoading(false);
    }
  }, [agent]);

  const fetchLeads = async () => {
    try {
      const response = await api.get(`/marketplace/leads/agent/${agent.id}`);
      if (response.data.success) {
        setLeads(response.data.leads);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!agent) {
    return (
      <div className="empty-view">
        <Users size={64} color="#ddd" />
        <h3>ముందుగా రిజిస్టర్ అవ్వండి</h3>
        <p>"నేను" tab లో వెళ్ళి registration పూర్తి చేయండి</p>
      </div>
    );
  }

  if (loading) return <div className="loading-text">Loading...</div>;

  if (leads.length === 0) {
    return (
      <div className="empty-view">
        <Users size={64} color="#ddd" />
        <h3>మీరు ఇంకా leads submit చేయలేదు</h3>
        <p>RETOERP projects నుండి leads submit చేసి commission సంపాదించండి</p>
      </div>
    );
  }

  return (
    <div className="leads-screen">
      <h2>నా లీడ్స్</h2>
      <div className="leads-list">
        {leads.map((lead) => (
          <div key={lead.id} className="lead-card">
            <div className="lead-info">
              <h4>{lead.buyer_name}</h4>
              <p>{lead.buyer_phone}</p>
              <span className="lead-project">{lead.project_name || 'Project'}</span>
            </div>
            <div className="lead-status-box">
              <span className={`status-badge ${lead.status}`}>{lead.status}</span>
              {lead.commission_amount && (
                <p className="commission-amt">₹{(lead.commission_amount / 1000).toFixed(1)}K</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Requirements Screen
const RequirementsScreen = ({ agent, requirements, onAdd }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="requirements-screen">
      <div className="screen-header">
        <h2>కొనుగోలుదారుల అవసరాలు</h2>
        <button className="add-btn-small" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
        </button>
      </div>

      {showForm && (
        <AddRequirementForm 
          agent={agent}
          onClose={() => {
            setShowForm(false);
            onAdd();
          }}
        />
      )}

      <div className="requirements-list">
        {requirements.map((req) => (
          <div key={req.id} className="requirement-card">
            <div className="req-header">
              <span className="req-type-badge">{req.property_type}</span>
              <span className="req-for">{req.requirement_type === 'buy' ? 'కొనుగోలు' : 'అద్దె'}</span>
            </div>
            <div className="req-details">
              <p className="req-budget">
                <strong>బడ్జెట్:</strong> ₹{(req.budget_min / 100000).toFixed(1)}L - ₹{(req.budget_max / 100000).toFixed(1)}L
              </p>
              <p className="req-location">
                <MapPin size={12} /> {req.preferred_locations.join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add Requirement Form
const AddRequirementForm = ({ agent, onClose }) => {
  const [formData, setFormData] = useState({
    requirement_type: 'buy',
    property_type: 'plot',
    budget_min: '',
    budget_max: '',
    preferred_locations: '',
    buyer_name: '',
    buyer_phone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/marketplace/requirements', {
        ...formData,
        budget_min: parseFloat(formData.budget_min),
        budget_max: parseFloat(formData.budget_max),
        preferred_locations: formData.preferred_locations.split(',').map(l => l.trim()),
        posted_by_agent_id: agent?.id,
        is_direct_buyer: !agent
      });
      alert('✅ అవసరం successfully పోస్ట్ అయింది!');
      onClose();
    } catch (error) {
      alert('❌ Error posting requirement');
    }
  };

  return (
    <div className="add-req-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>రకం</label>
          <select value={formData.requirement_type} onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })}>
            <option value="buy">కొనుగోలు</option>
            <option value="rent">అద్దె</option>
          </select>
        </div>

        <div className="form-group">
          <label>ప్రాపర్టీ రకం</label>
          <select value={formData.property_type} onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}>
            <option value="plot">ప్లాట్</option>
            <option value="flat">ఫ్లాట్</option>
            <option value="villa">విల్లా</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>కనిష్ట బడ్జెట్ (₹)</label>
            <input type="number" value={formData.budget_min} onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>గరిష్ట బడ్జెట్ (₹)</label>
            <input type="number" value={formData.budget_max} onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })} required />
          </div>
        </div>

        <div className="form-group">
          <label>లొకేషన్లు (comma separated)</label>
          <input type="text" placeholder="హైదరాబాద్, గచిబౌలి" value={formData.preferred_locations} onChange={(e) => setFormData({ ...formData, preferred_locations: e.target.value })} required />
        </div>

        <div className="form-group">
          <label>కొనుగోలుదారు పేరు</label>
          <input type="text" value={formData.buyer_name} onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })} required />
        </div>

        <div className="form-group">
          <label>ఫోన్</label>
          <input type="tel" value={formData.buyer_phone} onChange={(e) => setFormData({ ...formData, buyer_phone: e.target.value })} required />
        </div>

        <button type="submit" className="submit-btn">పోస్ట్ చేయండి</button>
      </form>
    </div>
  );
};

// Agent Profile Screen
const AgentProfileScreen = ({ agent, setAgent, credits }) => {
  const [showRegForm, setShowRegForm] = useState(!agent);
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    phone: agent?.phone || '',
    city: agent?.city || '',
    state: agent?.state || '',
    experience_years: agent?.experience_years || 0
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/marketplace/agents/register', {
        ...formData,
        experience_years: parseInt(formData.experience_years),
        areas_covered: [formData.city]
      });
      if (response.data.success) {
        const newAgent = response.data.agent;
        setAgent(newAgent);
        localStorage.setItem('incomelands_agent', JSON.stringify(newAgent));
        alert('✅ మీరు successfully register అయ్యారు!');
        setShowRegForm(false);
      }
    } catch (error) {
      alert('❌ Registration failed');
    }
  };

  if (showRegForm) {
    return (
      <div className="profile-screen">
        <h2>ఏజెంట్ రిజిస్ట్రేషన్</h2>
        <form onSubmit={handleRegister} className="profile-form">
          <div className="form-group">
            <label>పేరు *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>ఫోన్ *</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>నగరం *</label>
            <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>రాష్ట్రం *</label>
            <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>అనుభవం (సంవత్సరాలు)</label>
            <input type="number" value={formData.experience_years} onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })} />
          </div>
          <button type="submit" className="submit-btn">రిజిస్టర్ అవ్వండి</button>
        </form>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <div className="avatar-circle">{agent.name.charAt(0).toUpperCase()}</div>
        <h2>{agent.name}</h2>
        <p>{agent.phone}</p>
      </div>

      <div className="stats-row">
        <div className="stat-item">
          <span className="stat-num">{credits}</span>
          <span className="stat-label">Credits</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">{agent.total_leads_submitted || 0}</span>
          <span className="stat-label">Leads</span>
        </div>
        <div className="stat-item">
          <span className="stat-num">₹{((agent.total_commission_earned || 0) / 1000).toFixed(1)}K</span>
          <span className="stat-label">Earned</span>
        </div>
      </div>

      <div className="info-section">
        <div className="info-item">
          <span>లొకేషన్:</span>
          <span>{agent.city}, {agent.state}</span>
        </div>
        <div className="info-item">
          <span>అనుభవం:</span>
          <span>{agent.experience_years || 0} సంవత్సరాలు</span>
        </div>
      </div>

      <div className="subscription-box">
        <h3>Subscription</h3>
        <p>✅ Free Trial - 6 months</p>
        <p>{credits} Credits remaining</p>
        <button className="upgrade-btn">Upgrade ₹99/month</button>
      </div>
    </div>
  );
};

// Detail Modal
const DetailModal = ({ item, onClose, credits, setCredits, agent }) => {
  const [unlocked, setUnlocked] = useState(false);

  const handleUnlock = async () => {
    if (credits < 10) {
      alert('❌ తగినంత credits లేవు!');
      return;
    }

    if (item.type === 'project') {
      try {
        await api.post('/marketplace/unlock-contact', {
          agent_id: agent?.id,
          agent_phone: agent?.phone,
          tenant_id: item.tenant_id,
          project_id: item.id,
          payment_method: 'credits',
          transaction_id: `TXN${Date.now()}`
        });
      } catch (error) {
        console.error('Unlock error:', error);
      }
    }

    const newCredits = credits - 10;
    setCredits(newCredits);
    localStorage.setItem('incomelands_credits', newCredits);
    setUnlocked(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        
        <h2>{item.name || item.title}</h2>
        
        {item.image && <img src={item.image} alt="Property" className="modal-img" />}
        
        <div className="modal-details">
          <p><strong>ధర:</strong> ₹{((item.price || item.price_range?.min) / 100000).toFixed(1)}L</p>
          {item.area && <p><strong>ఏరియా:</strong> {item.area} sq.ft</p>}
          <p><strong>లొకేషన్:</strong> {item.location || item.city}</p>
          {item.description && <p>{item.description}</p>}
        </div>

        {item.type !== 'property' && (
          <div className="modal-contact">
            {!unlocked ? (
              <button className="unlock-contact-btn" onClick={handleUnlock}>
                <Lock size={18} />
                కాంటాక్ట్ చూడండి (₹10)
              </button>
            ) : (
              <div className="contact-unlocked">
                <Unlock size={18} color="#4CAF50" />
                <p><strong>కాంటాక్ట్:</strong> {item.ownerPhone || item.developer_phone || 'N/A'}</p>
              </div>
            )}
          </div>
        )}

        {item.type === 'property' && (
          <div className="contact-unlocked">
            <p><strong>యజమాని:</strong> {item.ownerName}</p>
            <p><strong>ఫోన్:</strong> <a href={`tel:${item.ownerPhone}`}>{item.ownerPhone}</a></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeLandsApp;