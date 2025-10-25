import React, { useState, useEffect } from 'react';
import { Home, Search, PlusCircle, BarChart3, User, MapPin, Phone, DollarSign, TrendingUp, Navigation, Filter, Heart, Share2 } from 'lucide-react';
import { api } from '../../services';
import './IncomeLandsApp.css';

const IncomeLandsApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [agent, setAgent] = useState(null);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    initializeApp();
    getUserLocation();
  }, []);

  const initializeApp = async () => {
    try {
      // Check if agent is already registered (get from localStorage)
      const savedAgent = localStorage.getItem('incomelands_agent');
      if (savedAgent) {
        setAgent(JSON.parse(savedAgent));
        await fetchAgentData(JSON.parse(savedAgent).id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          fetchNearbyProjects(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Hyderabad coordinates
          setUserLocation({ latitude: 17.385, longitude: 78.486 });
          fetchNearbyProjects(17.385, 78.486);
        }
      );
    }
  };

  const fetchNearbyProjects = async (lat, lon) => {
    try {
      const response = await api.get('/marketplace/projects', {
        params: {
          latitude: lat,
          longitude: lon,
          radius_km: 20,
          limit: 20
        }
      });
      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchAgentData = async (agentId) => {
    try {
      const [agentRes, leadsRes] = await Promise.all([
        api.get(`/marketplace/agents/${agentId}`),
        api.get(`/marketplace/leads/agent/${agentId}`)
      ]);
      
      if (agentRes.data.success) {
        setStats(agentRes.data);
      }
      if (leadsRes.data.success) {
        setLeads(leadsRes.data.leads);
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
    }
  };

  const registerAgent = async (agentData) => {
    try {
      const response = await api.post('/marketplace/agents/register', agentData);
      if (response.data.success) {
        const newAgent = response.data.agent;
        setAgent(newAgent);
        localStorage.setItem('incomelands_agent', JSON.stringify(newAgent));
        await fetchAgentData(newAgent.id);
      }
    } catch (error) {
      console.error('Error registering agent:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen projects={projects} userLocation={userLocation} agent={agent} />;
      case 'search':
        return <SearchScreen projects={projects} />;
      case 'add':
        return <AddLeadScreen agent={agent} projects={projects} onLeadSubmit={() => fetchAgentData(agent?.id)} />;
      case 'dashboard':
        return <DashboardScreen agent={agent} stats={stats} leads={leads} />;
      case 'profile':
        return <ProfileScreen agent={agent} onRegister={registerAgent} />;
      default:
        return <HomeScreen projects={projects} userLocation={userLocation} agent={agent} />;
    }
  };

  if (loading) {
    return (
      <div className="incomelands-app loading">
        <div className="loader-container">
          <div className="loader"></div>
          <h2>IncomeLands Partner</h2>
          <p>by RETOERP</p>
        </div>
      </div>
    );
  }

  return (
    <div className="incomelands-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <MapPin className="logo-icon" />
            <div>
              <h1>IncomeLands</h1>
              <p>Partner by RETOERP</p>
            </div>
          </div>
          {userLocation && (
            <button className="location-btn">
              <Navigation size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Home size={24} />
          <span>Home</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={24} />
          <span>Search</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <PlusCircle size={24} />
          <span>Add Lead</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={24} />
          <span>Dashboard</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={24} />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

// Home Screen Component
const HomeScreen = ({ projects, userLocation, agent }) => {
  return (
    <div className="home-screen">
      {/* Stats Bar */}
      {agent && (
        <div className="stats-bar">
          <div className="stat-item">
            <TrendingUp size={16} />
            <span>{agent.total_leads_submitted || 0} Leads</span>
          </div>
          <div className="stat-item">
            <DollarSign size={16} />
            <span>₹{((agent.total_commission_earned || 0) / 1000).toFixed(1)}K</span>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      <div className="welcome-section">
        <h2>Discover Properties</h2>
        <p>Near you • {projects.length} projects available</p>
      </div>

      {/* Projects Grid */}
      <div className="projects-grid">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {projects.length === 0 && (
        <div className="empty-state">
          <MapPin size={64} className="empty-icon" />
          <h3>No Projects Found</h3>
          <p>Try adjusting your location or filters</p>
        </div>
      )}
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project }) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="project-card">
      <div className="project-image">
        <img 
          src={project.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'} 
          alt={project.name}
        />
        <button className="like-btn" onClick={() => setLiked(!liked)}>
          <Heart size={20} fill={liked ? '#ff3366' : 'none'} color={liked ? '#ff3366' : '#fff'} />
        </button>
        {project.distance_km && (
          <div className="distance-badge">
            {project.distance_km.toFixed(1)} km away
          </div>
        )}
      </div>
      <div className="project-info">
        <h3>{project.name}</h3>
        <p className="location">
          <MapPin size={14} />
          {project.city}, {project.state}
        </p>
        <div className="project-stats">
          <span>{project.available_properties} available</span>
          <span className="price">From ₹{(project.price_range?.min / 100000).toFixed(1)}L</span>
        </div>
        <div className="project-developer">
          <span>by {project.developer_name}</span>
        </div>
      </div>
    </div>
  );
};

// Search Screen Component
const SearchScreen = ({ projects }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    city: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="search-screen">
      <div className="search-header">
        <div className="search-bar">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search projects, locations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={20} />
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <h3>Filters</h3>
          <div className="filter-group">
            <label>Min Price (₹)</label>
            <input 
              type="number" 
              placeholder="10,00,000"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
            />
          </div>
          <div className="filter-group">
            <label>Max Price (₹)</label>
            <input 
              type="number" 
              placeholder="50,00,000"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
            />
          </div>
          <button className="apply-filters-btn">Apply Filters</button>
        </div>
      )}

      <div className="search-results">
        <p className="results-count">{filteredProjects.length} projects found</p>
        <div className="projects-list">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Add Lead Screen Component
const AddLeadScreen = ({ agent, projects, onLeadSubmit }) => {
  const [formData, setFormData] = useState({
    project_id: '',
    buyer_name: '',
    buyer_phone: '',
    buyer_email: '',
    budget: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agent) {
      alert('Please complete your profile first!');
      return;
    }

    setSubmitting(true);
    try {
      const selectedProject = projects.find(p => p.id === formData.project_id);
      const response = await api.post('/marketplace/leads/submit', {
        tenant_id: selectedProject.tenant_id,
        project_id: formData.project_id,
        agent_id: agent.id,
        agent_name: agent.name,
        agent_phone: agent.phone,
        buyer_name: formData.buyer_name,
        buyer_phone: formData.buyer_phone,
        buyer_email: formData.buyer_email,
        budget: parseFloat(formData.budget),
        notes: formData.notes,
        source_detail: 'IncomeLands Mobile App'
      });

      if (response.data.success) {
        alert('Lead submitted successfully! Commission will be tracked.');
        setFormData({
          project_id: '',
          buyer_name: '',
          buyer_phone: '',
          buyer_email: '',
          budget: '',
          notes: ''
        });
        onLeadSubmit();
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      alert('Error submitting lead. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-lead-screen">
      <h2>Submit New Lead</h2>
      <p className="subtitle">Add buyer details to earn commission</p>

      <form onSubmit={handleSubmit} className="lead-form">
        <div className="form-group">
          <label>Select Project *</label>
          <select 
            value={formData.project_id}
            onChange={(e) => setFormData({...formData, project_id: e.target.value})}
            required
          >
            <option value="">Choose a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.city}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Buyer Name *</label>
          <input 
            type="text" 
            placeholder="Enter buyer's name"
            value={formData.buyer_name}
            onChange={(e) => setFormData({...formData, buyer_name: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Buyer Phone *</label>
          <input 
            type="tel" 
            placeholder="10-digit mobile number"
            value={formData.buyer_phone}
            onChange={(e) => setFormData({...formData, buyer_phone: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Buyer Email</label>
          <input 
            type="email" 
            placeholder="buyer@example.com"
            value={formData.buyer_email}
            onChange={(e) => setFormData({...formData, buyer_email: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Budget (₹) *</label>
          <input 
            type="number" 
            placeholder="e.g., 5000000"
            value={formData.budget}
            onChange={(e) => setFormData({...formData, budget: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea 
            placeholder="Add any additional information..."
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows="3"
          />
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Lead'}
        </button>

        <div className="commission-info">
          <DollarSign size={16} />
          <span>You'll earn 1% commission if this lead converts!</span>
        </div>
      </form>
    </div>
  );
};

// Dashboard Screen Component
const DashboardScreen = ({ agent, stats, leads }) => {
  if (!agent) {
    return (
      <div className="dashboard-screen empty">
        <div className="empty-state">
          <User size={64} className="empty-icon" />
          <h3>Complete Your Profile</h3>
          <p>Go to Profile tab to register as an agent</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-screen">
      <h2>Your Performance</h2>
      
      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon leads">
            <TrendingUp />
          </div>
          <div className="stat-content">
            <h3>{agent.total_leads_submitted || 0}</h3>
            <p>Leads Submitted</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon conversions">
            <BarChart3 />
          </div>
          <div className="stat-content">
            <h3>{agent.converted_leads || 0}</h3>
            <p>Conversions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon commission">
            <DollarSign />
          </div>
          <div className="stat-content">
            <h3>₹{((agent.total_commission_earned || 0) / 1000).toFixed(1)}K</h3>
            <p>Commission Earned</p>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="recent-leads">
        <h3>Recent Leads</h3>
        {leads.length === 0 ? (
          <p className="no-leads">No leads submitted yet. Start adding leads to earn commission!</p>
        ) : (
          <div className="leads-list">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="lead-item">
                <div className="lead-info">
                  <h4>{lead.buyer_name}</h4>
                  <p>{lead.buyer_phone}</p>
                  <span className="lead-project">{lead.project_name || 'Project'}</span>
                </div>
                <div className="lead-status">
                  <span className={`status-badge ${lead.status}`}>
                    {lead.status}
                  </span>
                  {lead.commission_amount && (
                    <span className="commission-amount">
                      ₹{(lead.commission_amount / 1000).toFixed(1)}K
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Profile Screen Component
const ProfileScreen = ({ agent, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(!agent);
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    phone: agent?.phone || '',
    email: agent?.email || '',
    city: agent?.city || '',
    state: agent?.state || '',
    experience_years: agent?.experience_years || ''
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    await onRegister({
      ...formData,
      areas_covered: [formData.city],
      latitude: 17.385,
      longitude: 78.486,
      experience_years: parseInt(formData.experience_years) || 0
    });
    setIsRegistering(false);
  };

  if (!agent || isRegistering) {
    return (
      <div className="profile-screen registration">
        <h2>Register as Agent</h2>
        <p className="subtitle">Join IncomeLands Partner network</p>

        <form onSubmit={handleRegister} className="registration-form">
          <div className="form-group">
            <label>Full Name *</label>
            <input 
              type="text" 
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input 
              type="tel" 
              placeholder="10-digit mobile"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>City *</label>
            <input 
              type="text" 
              placeholder="Your city"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>State *</label>
            <input 
              type="text" 
              placeholder="Your state"
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Experience (Years)</label>
            <input 
              type="number" 
              placeholder="Years of experience"
              value={formData.experience_years}
              onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
            />
          </div>

          <button type="submit" className="register-btn">
            Complete Registration
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <div className="avatar">
          {agent.name.charAt(0).toUpperCase()}
        </div>
        <h2>{agent.name}</h2>
        <p>{agent.phone}</p>
        {agent.is_verified && <span className="verified-badge">✓ Verified Agent</span>}
      </div>

      <div className="profile-info">
        <div className="info-item">
          <label>Location</label>
          <p>{agent.city}, {agent.state}</p>
        </div>
        <div className="info-item">
          <label>Experience</label>
          <p>{agent.experience_years || 0} years</p>
        </div>
        <div className="info-item">
          <label>Member Since</label>
          <p>{new Date(agent.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="profile-actions">
        <button className="action-btn">Edit Profile</button>
        <button className="action-btn secondary">Settings</button>
        <button className="action-btn danger">Logout</button>
      </div>
    </div>
  );
};

export default IncomeLandsApp;
