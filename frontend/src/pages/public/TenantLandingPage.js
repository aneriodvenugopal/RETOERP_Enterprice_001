import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiInstance from '../../services/api';
import ChatWidget from '../../components/ChatWidget';
import { Building2, MapPin, Phone, Mail, TrendingUp, Home, Users, Calendar, ArrowRight, ExternalLink } from 'lucide-react';

function TenantLandingPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeSection, setActiveSection] = useState('home');
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    fetchTenantData();
  }, [tenantId]);

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      const response = await apiInstance.get(`/public/tenant/${tenantId}`);
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to load tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleEnquirySubmit = (e) => {
    e.preventDefault();
    // TODO: Submit enquiry via API
    alert('Thank you! We will contact you soon.');
    setEnquiryForm({ name: '', email: '', phone: '', message: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Company not found</p>
        </div>
      </div>
    );
  }

  const { tenant, projects_by_category, statistics } = data;
  const categories = ['All', ...Object.keys(projects_by_category)];
  const displayProjects = selectedCategory === 'All' 
    ? data.projects 
    : projects_by_category[selectedCategory] || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo Section */}
            <div className="flex items-center gap-4">
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.company_name} className="h-12 w-12 object-contain" />
              ) : (
                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {tenant.company_name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{tenant.company_name}</h1>
                {tenant.tagline && (
                  <p className="text-sm text-gray-600">{tenant.tagline}</p>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection('home')}
                className={`text-sm font-medium transition ${
                  activeSection === 'home' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('projects')}
                className={`text-sm font-medium transition ${
                  activeSection === 'projects' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className={`text-sm font-medium transition ${
                  activeSection === 'about' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={`text-sm font-medium transition ${
                  activeSection === 'contact' ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Contact
              </button>
              <button
                onClick={() => scrollToSection('enquiry')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Enquire Now
              </button>
              <button
                onClick={() => navigate(`/login?tenant=${tenantId}`)}
                className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center gap-2"
              >
                Login <ExternalLink size={16} />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white py-20">
        {tenant.banner_url && (
          <div className="absolute inset-0 opacity-20">
            <img src={tenant.banner_url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            {tenant.company_name}
          </h2>
          {tenant.tagline && (
            <p className="text-2xl md:text-3xl text-blue-100 mb-8">
              {tenant.tagline}
            </p>
          )}
          {tenant.description && (
            <p className="text-xl text-blue-50 max-w-3xl mx-auto mb-8">
              {tenant.description}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate(`/register?tenant=${tenantId}`)}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition text-lg font-semibold shadow-lg flex items-center gap-2"
            >
              Get Started <ArrowRight size={20} />
            </button>
            <a
              href="#projects"
              className="px-8 py-4 bg-blue-500 bg-opacity-30 backdrop-blur text-white rounded-xl hover:bg-opacity-40 transition text-lg font-semibold border-2 border-white"
            >
              Explore Projects
            </a>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="text-blue-600" size={28} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.years_in_business}+</p>
              <p className="text-gray-600 mt-1">Years Experience</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="text-green-600" size={28} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.total_projects}</p>
              <p className="text-gray-600 mt-1">Projects</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Home className="text-purple-600" size={28} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.total_properties}+</p>
              <p className="text-gray-600 mt-1">Properties</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="bg-orange-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="text-orange-600" size={28} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{statistics.total_bookings}+</p>
              <p className="text-gray-600 mt-1">Happy Clients</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Projects</h2>
            <p className="text-xl text-gray-600">Explore our premium real estate offerings</p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {cat} ({cat === 'All' ? data.projects.length : (projects_by_category[cat]?.length || 0)})
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProjects.map(project => (
              <div
                key={project.id}
                onClick={() => navigate(`/public/project/${project.id}`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer transform hover:scale-105"
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                  <Building2 size={64} className="text-white opacity-50" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
                  <div className="flex items-center text-gray-600 text-sm mb-3">
                    <MapPin size={16} className="mr-1" />
                    {project.location || 'Location TBA'}
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-600">
                      {project.property_count} Properties
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {project.available_count} Available
                    </span>
                  </div>
                  <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    View Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {displayProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No projects in this category</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-600">We're here to help you find your dream property</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Phone className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                  <p className="text-gray-600">{tenant.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Mail className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-600">{tenant.email}</p>
                </div>
              </div>

              {tenant.address && (
                <div className="flex items-start gap-4 md:col-span-2">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <MapPin className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                    <p className="text-gray-600">
                      {tenant.address}
                      {tenant.city && `, ${tenant.city}`}
                      {tenant.state && `, ${tenant.state}`}
                      {tenant.country && `, ${tenant.country}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <button
                onClick={() => navigate(`/login?tenant=${tenantId}`)}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold inline-flex items-center gap-2"
              >
                Login to Dashboard <ExternalLink size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} {tenant.company_name}. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Powered by RETOERP
          </p>
        </div>
      </footer>

      {/* RETOERP AI Assistant */}
      <ChatWidget tenantId={tenantId} position="bottom-right" />
    </div>
  );
}

export default TenantLandingPage;
