import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, Building2, Home, Phone, Mail, 
  Check, Clock, AlertCircle, ZoomIn, ZoomOut,
  IndianRupee, Maximize2, Share2
} from 'lucide-react';
import { toast } from 'sonner';

const PublicLayoutView = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [svgUrl, setSvgUrl] = useState(null);

  useEffect(() => {
    fetchPublicLayout();
  }, [projectId]);

  const fetchPublicLayout = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/layouts/public/projects/${projectId}/layout`
      );
      
      if (response.data) {
        setLayout(response.data.layout);
        setProject(response.data.project);
        
        // Handle SVG URL
        if (response.data.layout?.svg_url) {
          let fullSvgUrl = response.data.layout.svg_url;
          if (fullSvgUrl.startsWith('/')) {
            fullSvgUrl = `${process.env.REACT_APP_BACKEND_URL}${fullSvgUrl}`;
          }
          setSvgUrl(fullSvgUrl);
        }
      }
    } catch (err) {
      console.error('Error loading public layout:', err);
      setError('Layout not found or not available for public viewing');
    } finally {
      setLoading(false);
    }
  };

  const getPolygonPoints = (coordinates) => {
    return coordinates.map(c => `${c.x},${c.y}`).join(' ');
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'rgba(34, 197, 94, 0.5)',
      booked: 'rgba(251, 191, 36, 0.5)',
      sold: 'rgba(239, 68, 68, 0.4)'
    };
    return colors[status] || colors.available;
  };

  const getStatusBadge = (status) => {
    const config = {
      available: { color: 'bg-green-500', icon: Check, label: 'Available' },
      booked: { color: 'bg-yellow-500', icon: Clock, label: 'Booked' },
      sold: { color: 'bg-red-500', icon: AlertCircle, label: 'Sold' }
    };
    const { color, icon: Icon, label } = config[status] || config.available;
    return (
      <Badge className={`${color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const formatPrice = (price) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading layout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Layout Not Available</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plots = layout?.plots || [];
  const availablePlots = plots.filter(p => p.status === 'available');
  const bookedPlots = plots.filter(p => p.status === 'booked');
  const soldPlots = plots.filter(p => p.status === 'sold');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{project?.name || 'Project Layout'}</h1>
                {project?.location && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {project.location}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={handleShare} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Layout Canvas - Main Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Project Layout</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setZoom(z => Math.min(3, z + 0.2))} size="sm" variant="outline">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} size="sm" variant="outline">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm py-2 px-3 bg-gray-100 rounded">{(zoom * 100).toFixed(0)}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg overflow-auto border" style={{ height: '600px' }}>
                  {svgUrl ? (
                    <div
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        width: 'fit-content'
                      }}
                    >
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={svgUrl} alt="Layout" style={{ display: 'block', maxWidth: '100%' }} />
                        
                        <svg
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'all'
                          }}
                          viewBox="0 0 1200 800"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          {plots.map((plot) => (
                            <g 
                              key={plot.id} 
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedPlot(plot)}
                            >
                              <polygon
                                points={getPolygonPoints(plot.coordinates)}
                                fill={getStatusColor(plot.status)}
                                stroke={selectedPlot?.id === plot.id ? '#0891b2' : '#64748b'}
                                strokeWidth={selectedPlot?.id === plot.id ? '3' : '2'}
                              />
                              <rect
                                x={plot.coordinates.reduce((sum, c) => sum + c.x, 0) / plot.coordinates.length - 30}
                                y={plot.coordinates.reduce((sum, c) => sum + c.y, 0) / plot.coordinates.length - 12}
                                width="60"
                                height="24"
                                rx="4"
                                fill="rgba(255,255,255,0.95)"
                                stroke={selectedPlot?.id === plot.id ? '#0891b2' : '#94a3b8'}
                                strokeWidth="1"
                              />
                              <text
                                x={plot.coordinates.reduce((sum, c) => sum + c.x, 0) / plot.coordinates.length}
                                y={plot.coordinates.reduce((sum, c) => sum + c.y, 0) / plot.coordinates.length}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={selectedPlot?.id === plot.id ? '#0891b2' : '#334155'}
                                fontSize="11"
                                fontWeight="bold"
                              >
                                {plot.display_name}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No layout available</p>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-6 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500/50 border border-green-600"></div>
                    <span className="text-sm text-gray-600">Available ({availablePlots.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500/50 border border-yellow-600"></div>
                    <span className="text-sm text-gray-600">Booked ({bookedPlots.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500/50 border border-red-600"></div>
                    <span className="text-sm text-gray-600">Sold ({soldPlots.length})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Plot Details */}
          <div className="space-y-4">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="w-5 h-5 text-cyan-600" />
                  Project Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Project Name</p>
                  <p className="font-medium">{project?.name}</p>
                </div>
                {project?.location && (
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{project.location}</p>
                  </div>
                )}
                {project?.city && (
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium">{project.city}, {project.state}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Total Plots</p>
                  <p className="font-medium">{plots.length}</p>
                </div>
              </CardContent>
            </Card>

            {/* Selected Plot Details */}
            {selectedPlot ? (
              <Card className="border-2 border-cyan-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedPlot.display_name}</CardTitle>
                    {getStatusBadge(selectedPlot.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Area</p>
                      <p className="font-bold text-lg">{selectedPlot.area || 'N/A'} <span className="text-sm font-normal">sq.ft</span></p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Block</p>
                      <p className="font-bold text-lg">{selectedPlot.block || 'A'}</p>
                    </div>
                  </div>
                  
                  {selectedPlot.price > 0 && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 mb-1">Price</p>
                      <p className="text-2xl font-bold text-green-700">{formatPrice(selectedPlot.price)}</p>
                    </div>
                  )}

                  {selectedPlot.status === 'available' && (
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                      <Phone className="w-4 h-4 mr-2" />
                      Enquire Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <MapPin className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Click on a plot to view details</p>
                </CardContent>
              </Card>
            )}

            {/* Available Plots Quick List */}
            {availablePlots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-700">
                    Available Plots ({availablePlots.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availablePlots.map(plot => (
                      <div 
                        key={plot.id}
                        onClick={() => setSelectedPlot(plot)}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedPlot?.id === plot.id 
                            ? 'bg-cyan-100 border border-cyan-300' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{plot.display_name}</span>
                          {plot.area > 0 && <span className="text-xs text-gray-500">{plot.area} sq.ft</span>}
                        </div>
                        {plot.price > 0 && (
                          <p className="text-sm text-green-600 font-medium">{formatPrice(plot.price)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Powered by RETOERP - Real Estate Management Platform</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayoutView;
