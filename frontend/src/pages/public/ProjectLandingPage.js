import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiInstance from '../../services/api';
import ChatWidget from '../../components/ChatWidget';
import { Building2, MapPin, Phone, Mail, Home, DollarSign, Calendar, CheckCircle, XCircle, Clock, ArrowRight, ExternalLink, Maximize2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

function ProjectLandingPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [viewMode, setViewMode] = useState('layout'); // 'layout' or 'list'
  const [fullscreenLayout, setFullscreenLayout] = useState(false);
  const [layoutZoom, setLayoutZoom] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const response = await apiInstance.get(`/public/project/${projectId}`);
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-orange-100 text-orange-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'available': return <CheckCircle size={16} />;
      case 'booked': return <Clock size={16} />;
      case 'reserved': return <Clock size={16} />;
      case 'sold': return <XCircle size={16} />;
      default: return <Home size={16} />;
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `₹${(price / 100000).toFixed(2)}L`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Project not found</p>
        </div>
      </div>
    );
  }

  const { project, tenant, layout, properties, properties_by_status, statistics, price_range } = data;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">{project.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-600">{tenant?.company_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <a href="#properties" className="text-gray-700 hover:text-blue-600 transition">Properties</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition">Contact</a>
              <button
                onClick={() => navigate(`/login?project=${projectId}`)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                Book Now <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-5xl font-bold mb-4">{project.name}</h2>
              <div className="flex items-center text-blue-100 mb-6">
                <MapPin size={20} className="mr-2" />
                <span className="text-lg">{project.location || 'Premium Location'}</span>
              </div>
              {project.description && (
                <p className="text-xl text-blue-50 mb-6">{project.description}</p>
              )}
              <div className="flex flex-wrap gap-4">
                <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg px-4 py-2">
                  <p className="text-blue-100 text-sm">Properties</p>
                  <p className="text-2xl font-bold">{statistics.total_properties}</p>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg px-4 py-2">
                  <p className="text-blue-100 text-sm">Available</p>
                  <p className="text-2xl font-bold text-green-300">{statistics.available}</p>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg px-4 py-2">
                  <p className="text-blue-100 text-sm">Price Range</p>
                  <p className="text-xl font-bold">{formatPrice(price_range.min)} - {formatPrice(price_range.max)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur rounded-2xl p-6 h-64 flex items-center justify-center">
              <Building2 size={120} className="text-white opacity-50" />
            </div>
          </div>
        </div>
      </section>

      {/* View Mode Toggle */}
      <section className="py-6 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900">Properties</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('layout')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'layout'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Layout View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                List View
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Layout View (Full Page) */}
      {viewMode === 'layout' && layout && (
        <section className="bg-gray-100 relative" style={{ minHeight: fullscreenLayout ? '100vh' : '600px' }}>
          {fullscreenLayout && (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
              {/* Fullscreen Header */}
              <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                <h3 className="text-xl font-bold">{project.name} - Layout</h3>
                <div className="flex gap-2">
                  <button onClick={() => setLayoutZoom(Math.max(0.5, layoutZoom - 0.1))} className="p-2 bg-gray-800 rounded hover:bg-gray-700">
                    <ZoomOut size={20} />
                  </button>
                  <button onClick={() => setLayoutZoom(1)} className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700">
                    Reset
                  </button>
                  <button onClick={() => setLayoutZoom(Math.min(3, layoutZoom + 0.1))} className="p-2 bg-gray-800 rounded hover:bg-gray-700">
                    <ZoomIn size={20} />
                  </button>
                  <button onClick={() => setFullscreenLayout(false)} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700">
                    Exit Fullscreen
                  </button>
                </div>
              </div>
              {/* Layout Container */}
              <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                <div style={{ transform: `scale(${layoutZoom})`, transition: 'transform 0.2s' }}>
                  {layout.svg_data ? (
                    <div dangerouslySetInnerHTML={{ __html: layout.svg_data }} />
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-12 text-center">
                      <Building2 size={80} className="text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Layout visualization will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!fullscreenLayout && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-2xl shadow-xl p-6 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Interactive Layout</h3>
                  <button
                    onClick={() => setFullscreenLayout(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Maximize2 size={18} />
                    Fullscreen View
                  </button>
                </div>
                <div className="overflow-auto" style={{ maxHeight: '500px' }}>
                  {layout.svg_data ? (
                    <div dangerouslySetInnerHTML={{ __html: layout.svg_data }} />
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-16 text-center">
                      <Building2 size={80} className="text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Layout visualization coming soon</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <section id="properties" className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Plot No</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Area</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Price</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((prop, index) => (
                      <tr key={prop.id} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition`}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{prop.plot_number || prop.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{prop.type || 'Residential'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{prop.area ? `${prop.area} sq.ft` : '-'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatPrice(prop.price)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(prop.status)}`}>
                            {getStatusIcon(prop.status)}
                            {(prop.status || 'available').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {prop.status === 'available' ? (
                            <button
                              onClick={() => navigate(`/login?project=${projectId}&property=${prop.id}`)}
                              className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                            >
                              Book Now
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">Not Available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Interested in this project?</h3>
            <p className="text-lg text-gray-600 mb-8">Book a site visit or get more information</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate(`/login?project=${projectId}`)}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold inline-flex items-center gap-2"
              >
                Book Site Visit <ArrowRight size={18} />
              </button>
              <a href={`tel:${tenant?.phone}`} className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold inline-flex items-center gap-2">
                <Phone size={18} /> Call Now
              </a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-600">Contact: {tenant?.phone} | {tenant?.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} {tenant?.company_name}. All rights reserved.</p>
          <p className="text-gray-500 text-sm mt-2">Powered by RETOERP</p>
        </div>
      </footer>

      {/* RETOERP AI Assistant */}
      <ChatWidget tenantId={tenant?.id} position="bottom-right" />
    </div>
  );
}

export default ProjectLandingPage;