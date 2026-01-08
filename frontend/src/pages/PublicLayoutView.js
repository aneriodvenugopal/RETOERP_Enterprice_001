import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MapPin, Building2, Home, Phone, Mail, User, MessageSquare,
  Check, Clock, AlertCircle, ZoomIn, ZoomOut, Maximize2, Minimize2,
  IndianRupee, Share2, ImageIcon, Video, Heart, CreditCard, X,
  ChevronLeft, ChevronRight, Play, Calendar, FileText
} from 'lucide-react';
import { toast } from 'sonner';

const PublicLayoutView = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [showPlotModal, setShowPlotModal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [svgUrl, setSvgUrl] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [svgDimensions, setSvgDimensions] = useState({ width: 1200, height: 800 });
  const containerRef = useRef(null);
  
  // Interest form state
  const [interestForm, setInterestForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [submittingInterest, setSubmittingInterest] = useState(false);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    id_proof: '',
    payment_method: 'upi'
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    fetchPublicLayout();
  }, [projectId]);

  // Extract SVG dimensions when URL changes - with better fallback
  useEffect(() => {
    if (svgUrl) {
      // Default dimensions (matches the SVG from this project)
      const defaultDimensions = { width: 1122.6667, height: 793.33331 };
      
      // Try to fetch SVG and parse viewBox for accurate dimensions
      // Use credentials: 'omit' and mode for CORS handling
      fetch(svgUrl, { mode: 'cors', credentials: 'omit' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.text();
        })
        .then(svgText => {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgElement = svgDoc.querySelector('svg');
          
          if (svgElement) {
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
              const parts = viewBox.split(/[\s,]+/).map(Number);
              if (parts.length >= 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
                const [, , width, height] = parts;
                setSvgDimensions({ width, height });
                console.log('📐 Public View SVG ViewBox detected:', { width, height });
                return;
              }
            }
            // Try width/height attributes
            const width = svgElement.getAttribute('width');
            const height = svgElement.getAttribute('height');
            if (width && height) {
              setSvgDimensions({ 
                width: parseFloat(width), 
                height: parseFloat(height) 
              });
              console.log('📐 Public View SVG dimensions from attributes:', { width, height });
              return;
            }
          }
          // Fallback to default
          setSvgDimensions(defaultDimensions);
        })
        .catch(err => {
          console.warn('Could not fetch SVG for dimensions, using defaults:', err.message);
          setSvgDimensions(defaultDimensions);
        });
    }
  }, [svgUrl]);

  const fetchPublicLayout = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/layouts/public/projects/${projectId}/layout`
      );
      
      if (response.data) {
        setLayout(response.data.layout);
        setProject(response.data.project);
        
        if (response.data.layout?.svg_url) {
          let fullSvgUrl = response.data.layout.svg_url;
          
          // Handle relative URLs
          if (fullSvgUrl.startsWith('/')) {
            fullSvgUrl = `${process.env.REACT_APP_BACKEND_URL}${fullSvgUrl}`;
          } else {
            // If the URL points to a different domain, replace with current backend
            // This handles cases where the database has old domain references
            try {
              const urlObj = new URL(fullSvgUrl);
              const currentBackend = new URL(process.env.REACT_APP_BACKEND_URL);
              if (urlObj.hostname !== currentBackend.hostname) {
                // Replace the domain with current backend domain
                fullSvgUrl = `${process.env.REACT_APP_BACKEND_URL}${urlObj.pathname}`;
                console.log('📷 Corrected SVG URL domain:', fullSvgUrl);
              }
            } catch (e) {
              // If URL parsing fails, use as-is
              console.warn('Could not parse SVG URL:', e);
            }
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
      available: 'rgba(34, 197, 94, 0.5)',  // Green
      booked: 'rgba(251, 191, 36, 0.5)',    // Yellow
      blocked: 'rgba(249, 115, 22, 0.5)',   // Orange
      sold: 'rgba(239, 68, 68, 0.4)'        // Red
    };
    return colors[status] || colors.available;
  };
  
  // Extract plot number from display_name (e.g., "Plot 1" -> "1")
  const getPlotLabel = (displayName) => {
    if (!displayName) return '';
    const match = displayName.match(/Plot\s*(\d+)/i);
    return match ? match[1] : displayName;
  };

  const getStatusBadge = (status) => {
    const config = {
      available: { color: 'bg-green-500', icon: Check, label: 'Available' },
      booked: { color: 'bg-yellow-500', icon: Clock, label: 'Booked' },
      blocked: { color: 'bg-orange-500', icon: AlertCircle, label: 'Blocked' },
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

  const handlePlotClick = (plot) => {
    setSelectedPlot(plot);
    setShowPlotModal(true);
    setActiveTab('details');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Contact for Price';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString()}`;
  };

  const handleInterestSubmit = async (e) => {
    e.preventDefault();
    setSubmittingInterest(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Thank you for your interest! Our team will contact you soon.');
    setInterestForm({ name: '', phone: '', email: '', message: '' });
    setSubmittingInterest(false);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmittingBooking(true);
    
    // Simulate API call - In real implementation, integrate with payment gateway
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Booking request submitted! Redirecting to payment...');
    setSubmittingBooking(false);
    
    // Here you would redirect to payment gateway
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-100 text-lg">Loading layout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Card className="max-w-md bg-white/10 backdrop-blur border-white/20">
          <CardContent className="pt-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Layout Not Available</h2>
            <p className="text-slate-300">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plots = layout?.plots || [];
  const availablePlots = plots.filter(p => p.status === 'available');
  const bookedPlots = plots.filter(p => p.status === 'booked');
  const blockedPlots = plots.filter(p => p.status === 'blocked');
  const soldPlots = plots.filter(p => p.status === 'sold');

  return (
    <div ref={containerRef} className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-500/20 backdrop-blur rounded-xl border border-cyan-500/30">
              <Building2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{project?.name || 'Project Layout'}</h1>
              {project?.location && (
                <p className="text-sm text-cyan-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {project.location}, {project.city}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur rounded-lg p-1 border border-white/20">
              <Button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm px-2 min-w-[50px] text-center">{(zoom * 100).toFixed(0)}%</span>
              <Button onClick={() => setZoom(z => Math.min(3, z + 0.2))} size="sm" variant="ghost" className="text-white hover:bg-white/20">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            
            <Button onClick={toggleFullScreen} size="sm" variant="ghost" className="text-white hover:bg-white/20">
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            
            <Button onClick={handleShare} size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout Area - Full Screen */}
      <div className="absolute inset-0 pt-20 pb-24 px-4 overflow-auto">
        <div 
          className="min-h-full flex items-center justify-center"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          {svgUrl ? (
            <div style={{ position: 'relative', display: 'inline-block' }} className="shadow-2xl rounded-xl overflow-hidden border-4 border-white/20">
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
                viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {plots.map((plot) => (
                  <g 
                    key={plot.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlotClick(plot);
                    }}
                  >
                    <polygon
                      points={getPolygonPoints(plot.coordinates)}
                      fill={getStatusColor(plot.status)}
                      stroke={selectedPlot?.id === plot.id ? '#06b6d4' : '#64748b'}
                      strokeWidth={selectedPlot?.id === plot.id ? '4' : '2'}
                      style={{ cursor: 'pointer' }}
                    />
                    {/* Plot number label - just the number inside the plot */}
                    <text
                      x={plot.coordinates.reduce((sum, c) => sum + c.x, 0) / plot.coordinates.length}
                      y={plot.coordinates.reduce((sum, c) => sum + c.y, 0) / plot.coordinates.length}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#1e293b"
                      fontSize="11"
                      fontWeight="bold"
                      style={{ textShadow: '0 0 3px white, 0 0 3px white', pointerEvents: 'none' }}
                    >
                      {getPlotLabel(plot.display_name)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div className="text-center text-white">
              <Building2 className="w-24 h-24 mx-auto text-slate-600 mb-4" />
              <p className="text-xl text-slate-400">No layout available</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-6 px-6 py-4 flex-wrap">
          <div className="flex items-center gap-3 bg-green-500/20 backdrop-blur px-4 py-2 rounded-full border border-green-500/30">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-300 font-medium">{availablePlots.length} Available</span>
          </div>
          <div className="flex items-center gap-3 bg-yellow-500/20 backdrop-blur px-4 py-2 rounded-full border border-yellow-500/30">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-yellow-300 font-medium">{bookedPlots.length} Booked</span>
          </div>
          <div className="flex items-center gap-3 bg-orange-500/20 backdrop-blur px-4 py-2 rounded-full border border-orange-500/30">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-orange-300 font-medium">{blockedPlots.length} Blocked</span>
          </div>
          <div className="flex items-center gap-3 bg-red-500/20 backdrop-blur px-4 py-2 rounded-full border border-red-500/30">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-red-300 font-medium">{soldPlots.length} Sold</span>
          </div>
          <div className="text-slate-400 text-sm">
            Click on any plot to view details
          </div>
        </div>
      </div>

      {/* Plot Details Modal */}
      <Dialog open={showPlotModal} onOpenChange={setShowPlotModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 bg-white">
          {selectedPlot && (
            <>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPlot.display_name}</h2>
                    <p className="text-cyan-100">{project?.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(selectedPlot.status)}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-gray-50">
                  <TabsTrigger value="details" className="py-3 px-6 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-600 data-[state=active]:text-cyan-600">
                    <FileText className="w-4 h-4 mr-2" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="gallery" className="py-3 px-6 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-600 data-[state=active]:text-cyan-600">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Gallery
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="py-3 px-6 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-600 data-[state=active]:text-cyan-600">
                    <Video className="w-4 h-4 mr-2" />
                    Videos
                  </TabsTrigger>
                  <TabsTrigger value="interest" className="py-3 px-6 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-600 data-[state=active]:text-cyan-600">
                    <Heart className="w-4 h-4 mr-2" />
                    Show Interest
                  </TabsTrigger>
                  {selectedPlot.status === 'available' && (
                    <TabsTrigger value="booking" className="py-3 px-6 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-600 data-[state=active]:text-cyan-600">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Book Property
                    </TabsTrigger>
                  )}
                </TabsList>

                <div className="p-6 max-h-[50vh] overflow-y-auto">
                  {/* Details Tab */}
                  <TabsContent value="details" className="mt-0">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Property Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Plot Number</p>
                            <p className="font-bold text-lg">{selectedPlot.display_name}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Block</p>
                            <p className="font-bold text-lg">{selectedPlot.block || 'A'}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Area</p>
                            <p className="font-bold text-lg">{selectedPlot.area || 'N/A'} <span className="text-sm font-normal">{selectedPlot.unit || 'sq.yard'}</span></p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500">Facing</p>
                            <p className="font-bold text-lg">{selectedPlot.facing || 'East'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Pricing</h3>
                        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <p className="text-sm text-green-700 mb-1">Total Price</p>
                          <p className="text-3xl font-bold text-green-700">{formatPrice(selectedPlot.price)}</p>
                          {selectedPlot.area && selectedPlot.price > 0 && (
                            <p className="text-sm text-green-600 mt-2">
                              ₹{Math.round(selectedPlot.price / selectedPlot.area).toLocaleString()} per {selectedPlot.unit || 'sq.yard'}
                            </p>
                          )}
                        </div>
                        
                        {selectedPlot.status === 'available' && (
                          <Button 
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 h-12 text-lg"
                            onClick={() => setActiveTab('booking')}
                          >
                            <CreditCard className="w-5 h-5 mr-2" />
                            Book Now
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Amenities */}
                    {selectedPlot.amenities && selectedPlot.amenities.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedPlot.amenities.map((amenity, idx) => (
                            <Badge key={idx} variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Gallery Tab */}
                  <TabsContent value="gallery" className="mt-0">
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Images Available</h3>
                      <p className="text-gray-500">Gallery images will be added soon</p>
                    </div>
                  </TabsContent>

                  {/* Videos Tab */}
                  <TabsContent value="videos" className="mt-0">
                    <div className="text-center py-12">
                      <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No Videos Available</h3>
                      <p className="text-gray-500">Property videos will be added soon</p>
                    </div>
                  </TabsContent>

                  {/* Show Interest Tab */}
                  <TabsContent value="interest" className="mt-0">
                    <div className="max-w-md mx-auto">
                      <div className="text-center mb-6">
                        <Heart className="w-12 h-12 mx-auto text-pink-500 mb-2" />
                        <h3 className="text-lg font-semibold">Interested in this property?</h3>
                        <p className="text-gray-500 text-sm">Fill the form below and we&apos;ll contact you</p>
                      </div>
                      
                      <form onSubmit={handleInterestSubmit} className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Full Name *</label>
                          <Input
                            value={interestForm.name}
                            onChange={(e) => setInterestForm({...interestForm, name: e.target.value})}
                            placeholder="Enter your name"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Phone *</label>
                            <Input
                              value={interestForm.phone}
                              onChange={(e) => setInterestForm({...interestForm, phone: e.target.value})}
                              placeholder="+91 98765 43210"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <Input
                              type="email"
                              value={interestForm.email}
                              onChange={(e) => setInterestForm({...interestForm, email: e.target.value})}
                              placeholder="email@example.com"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Message</label>
                          <textarea
                            value={interestForm.message}
                            onChange={(e) => setInterestForm({...interestForm, message: e.target.value})}
                            placeholder="Any specific questions or requirements..."
                            className="w-full px-3 py-2 border rounded-lg resize-none h-24"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                          disabled={submittingInterest}
                        >
                          {submittingInterest ? 'Submitting...' : 'Submit Interest'}
                        </Button>
                      </form>
                    </div>
                  </TabsContent>

                  {/* Booking Tab */}
                  {selectedPlot.status === 'available' && (
                    <TabsContent value="booking" className="mt-0">
                      <div className="max-w-lg mx-auto">
                        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 mb-6 border border-cyan-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-cyan-700">Booking Amount</p>
                              <p className="text-2xl font-bold text-cyan-800">₹50,000</p>
                              <p className="text-xs text-cyan-600">Token amount to reserve this plot</p>
                            </div>
                            <CreditCard className="w-12 h-12 text-cyan-500" />
                          </div>
                        </div>
                        
                        <form onSubmit={handleBookingSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Full Name *</label>
                              <Input
                                value={bookingForm.name}
                                onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})}
                                placeholder="Enter your name"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Phone *</label>
                              <Input
                                value={bookingForm.phone}
                                onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                                placeholder="+91 98765 43210"
                                required
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700">Email *</label>
                            <Input
                              type="email"
                              value={bookingForm.email}
                              onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                              placeholder="email@example.com"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700">Address</label>
                            <Input
                              value={bookingForm.address}
                              onChange={(e) => setBookingForm({...bookingForm, address: e.target.value})}
                              placeholder="Your current address"
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700">Payment Method</label>
                            <div className="grid grid-cols-3 gap-3 mt-2">
                              {['upi', 'card', 'netbanking'].map((method) => (
                                <button
                                  key={method}
                                  type="button"
                                  onClick={() => setBookingForm({...bookingForm, payment_method: method})}
                                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                                    bookingForm.payment_method === method 
                                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <p className="font-medium capitalize">{method === 'upi' ? 'UPI' : method === 'netbanking' ? 'Net Banking' : 'Card'}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <Button 
                              type="submit" 
                              className="w-full h-12 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                              disabled={submittingBooking}
                            >
                              {submittingBooking ? 'Processing...' : 'Pay ₹50,000 & Book'}
                            </Button>
                            <p className="text-xs text-center text-gray-500 mt-2">
                              Secure payment powered by Stripe/Razorpay
                            </p>
                          </div>
                        </form>
                      </div>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicLayoutView;
