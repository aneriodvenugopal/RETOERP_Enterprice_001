import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, Save, Undo, Trash2, Check, Edit2, MapPin, 
  ArrowLeft, Layers, Home, ZoomIn, ZoomOut
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { layoutService } from '../services';
import axios from 'axios';
import PageInfoModal from '../components/PageInfoModal';

/**
 * ProjectLayoutEditor - Integrated layout editor for project-specific layouts
 * 
 * Features:
 * - Project-context aware
 * - Auto-save plots
 * - Variable points support (3+)
 * - Edit details vs re-mark points
 * - Clean UI/UX with zoom
 */

const ProjectLayoutEditor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  
  // State
  const [project, setProject] = useState(null);
  const [layoutName, setLayoutName] = useState('');
  const [svgFile, setSvgFile] = useState(null);
  const [svgUrl, setSvgUrl] = useState(null);
  const [svgFileInfo, setSvgFileInfo] = useState(null);
  const [plots, setPlots] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [showPlotForm, setShowPlotForm] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPlotId, setEditingPlotId] = useState(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 1122.6667, height: 793.33331 });
  
  const [plotForm, setPlotForm] = useState({
    display_name: '',
    block: 'A',
    price: '',
    area: '',
    status: 'available',
    amenities: []
  });

  useEffect(() => {
    loadProjectAndLayout();
  }, [projectId]);

  // Extract SVG dimensions when URL changes
  useEffect(() => {
    if (svgUrl) {
      fetch(svgUrl)
        .then(res => res.text())
        .then(svgText => {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgElement = svgDoc.querySelector('svg');
          
          if (svgElement) {
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
              const [x, y, width, height] = viewBox.split(' ').map(Number);
              setSvgDimensions({ width, height });
              console.log('📐 SVG ViewBox detected:', { width, height });
            }
          }
        })
        .catch(err => console.warn('Could not read SVG dimensions:', err));
    }
  }, [svgUrl]);

  const loadProjectAndLayout = async () => {
    setLoading(true);
    try {
      // Load project details
      const projectRes = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/projects/${projectId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      if (projectRes.data.success) {
        setProject(projectRes.data.project);
        
        // Load project layout
        const layoutRes = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/layouts/projects/${projectId}/layout`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        if (layoutRes.data.success && layoutRes.data.layout) {
          const layout = layoutRes.data.layout;
          console.log('📊 Project layout loaded:', layout);
          
          setLayoutName(layout.layout_name || projectRes.data.project.project_name);
          setPlots(layout.plots || []);
          
          if (layout.svg_url) {
            setSvgUrl(layout.svg_url);
            setSvgFileInfo({ file_url: layout.svg_url });
          }
          
          toast.success(`Layout loaded with ${layout.plots?.length || 0} plots`);
        } else {
          // No layout yet, use project name as default
          setLayoutName(projectRes.data.project.project_name + ' Layout');
          toast.info('No layout found. Create your first layout!');
        }
      }
    } catch (error) {
      console.error('Error loading project/layout:', error);
      if (error.response?.status === 404) {
        // Layout doesn't exist yet, that's ok
        toast.info('Create a new layout for this project');
      } else {
        toast.error('Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle SVG file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'image/svg+xml') {
      toast.error('Please upload a valid SVG file');
      return;
    }

    setUploading(true);
    setSvgFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/layouts/upload-svg`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setSvgUrl(response.data.file_url);
        setSvgFileInfo(response.data);
        toast.success('SVG uploaded successfully');
      }
    } catch (error) {
      console.error('SVG upload error:', error);
      toast.error('Failed to upload SVG');
    } finally {
      setUploading(false);
    }
  };

  // Handle click on SVG to add plot point
  const handleSvgClick = (e) => {
    if (!svgUrl) {
      toast.error('Please upload SVG first');
      return;
    }

    if (showPlotForm) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    
    const x = ((e.clientX - rect.left) / rect.width) * viewBox.width;
    const y = ((e.clientY - rect.top) / rect.height) * viewBox.height;
    
    const newPoints = [...currentPoints, { x: Math.round(x), y: Math.round(y) }];
    setCurrentPoints(newPoints);
    
    if (newPoints.length === 1) {
      toast.info('Keep clicking to mark all corners. Click "Finish Marking" when done.');
    }
  };

  // Finish marking and open form
  const finishMarking = () => {
    if (currentPoints.length < 3) {
      toast.error('Please mark at least 3 points to form a plot');
      return;
    }
    setShowPlotForm(true);
  };

  // Edit plot details only (name, price, area, status)
  const handleEditPlotDetails = (plot) => {
    setEditingPlotId(plot.id);
    setPlotForm({
      display_name: plot.display_name,
      block: plot.block || 'A',
      price: plot.price.toString(),
      area: plot.area.toString(),
      status: plot.status,
      amenities: plot.amenities || []
    });
    setCurrentPoints(plot.coordinates);
    setShowPlotForm(true);
  };

  // Re-mark plot points (change boundaries)
  const handleRemarkPlotPoints = (plot) => {
    setEditingPlotId(plot.id);
    setPlotForm({
      display_name: plot.display_name,
      block: plot.block || 'A',
      price: plot.price.toString(),
      area: plot.area.toString(),
      status: plot.status,
      amenities: plot.amenities || []
    });
    setCurrentPoints([]);
    toast.info('Click on SVG to re-mark plot boundaries');
  };

  // Add or update plot with auto-save
  const savePlot = async () => {
    if (!plotForm.display_name || !plotForm.area || !plotForm.price) {
      toast.error('Please fill all required fields');
      return;
    }

    if (currentPoints.length < 3) {
      toast.error('Please mark at least 3 points for the plot');
      return;
    }

    const plotData = {
      id: editingPlotId || `plot-${Date.now()}`,
      coordinates: currentPoints,
      ...plotForm,
      area: parseFloat(plotForm.area),
      price: parseFloat(plotForm.price)
    };

    let updatedPlots;
    if (editingPlotId) {
      updatedPlots = plots.map(p => p.id === editingPlotId ? plotData : p);
      setPlots(updatedPlots);
      toast.success('Plot updated');
    } else {
      updatedPlots = [...plots, plotData];
      setPlots(updatedPlots);
      toast.success('Plot added');
    }
    
    // Auto-save to database immediately
    try {
      const layoutData = {
        layout_name: layoutName,
        svg_url: svgFileInfo.file_url,
        plots: updatedPlots,
        metadata: {
          updated_by: user.id,
          last_updated: new Date().toISOString()
        }
      };

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/layouts/projects/${projectId}/layout`,
        layoutData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success('✅ Auto-saved to database');
      console.log('✅ Plot auto-saved to database');
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Failed to auto-save. Please try manual save.');
    }
    
    // Reset form
    setCurrentPoints([]);
    setShowPlotForm(false);
    setEditingPlotId(null);
    setPlotForm({
      display_name: '',
      block: 'A',
      price: '',
      area: '',
      status: 'available',
      amenities: []
    });
  };

  const cancelPlot = () => {
    setCurrentPoints([]);
    setShowPlotForm(false);
    setEditingPlotId(null);
  };

  const deletePlot = (plotId) => {
    if (window.confirm('Delete this plot?')) {
      setPlots(plots.filter(p => p.id !== plotId));
      toast.success('Plot deleted');
    }
  };

  const undoLastPoint = () => {
    if (currentPoints.length > 0) {
      setCurrentPoints(currentPoints.slice(0, -1));
    }
  };

  const clearPoints = () => {
    setCurrentPoints([]);
    toast.info('Points cleared. Start marking again.');
  };

  const handlePointClick = (e, pointIndex) => {
    e.stopPropagation();
    const newPoints = currentPoints.filter((_, idx) => idx !== pointIndex);
    setCurrentPoints(newPoints);
    toast.success(`Point ${pointIndex + 1} removed`);
  };

  // Manual save layout (for name changes)
  const saveLayout = async () => {
    if (!layoutName.trim()) {
      toast.error('Please enter layout name');
      return;
    }

    if (!svgFileInfo) {
      toast.error('Please upload SVG file');
      return;
    }

    setSaving(true);
    try {
      const layoutData = {
        layout_name: layoutName,
        svg_url: svgFileInfo.file_url,
        plots: plots,
        metadata: {
          updated_by: user.id,
          last_updated: new Date().toISOString()
        }
      };

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/layouts/projects/${projectId}/layout`,
        layoutData,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      toast.success('Layout saved successfully!');
    } catch (error) {
      console.error('Save layout error:', error);
      toast.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const getPolygonPoints = (coordinates) => {
    return coordinates.map(c => `${c.x},${c.y}`).join(' ');
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'rgba(34, 197, 94, 0.3)',
      booked: 'rgba(251, 191, 36, 0.3)',
      sold: 'rgba(239, 68, 68, 0.3)'
    };
    return colors[status] || colors.available;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Layers className="w-16 h-16 mx-auto mb-4 text-ocean-primary animate-pulse" />
          <p className="text-lg text-gray-600">Loading project layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${projectId}`)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-ocean-primary to-ocean-secondary bg-clip-text text-transparent">
                Layout Editor
              </h1>
              <p className="text-sm text-gray-600">
                {project?.project_name} - {layoutName}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Layout Info */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-ocean-primary">Layout Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Layout Name *</label>
                <Input
                  type="text"
                  placeholder="e.g., Green Valley Phase 1"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  className="glass-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload SVG */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-ocean-primary">Upload/Change SVG</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full bg-gradient-to-r from-ocean-primary to-ocean-secondary text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : svgUrl ? 'Change SVG' : 'Upload SVG'}
              </Button>
              
              {svgFile && (
                <p className="text-xs text-green-600">✓ {svgFile.name}</p>
              )}
            </CardContent>
          </Card>

          {/* Mark Plot Section */}
          {svgUrl && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-ocean-primary">Mark Plot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  Points marked: <span className="font-bold text-ocean-primary">{currentPoints.length}</span>
                  <span className="text-xs text-gray-500 ml-2">(min 3 points)</span>
                </p>
                
                {currentPoints.length > 0 && (
                  <div className="space-y-2">
                    <Button
                      onClick={undoLastPoint}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Undo className="w-4 h-4 mr-2" />
                      Undo Last Point
                    </Button>
                    
                    <Button
                      onClick={clearPoints}
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Points
                    </Button>
                    
                    {currentPoints.length >= 3 && !editingPlotId && (
                      <Button
                        onClick={finishMarking}
                        size="sm"
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Finish Marking ({currentPoints.length} points)
                      </Button>
                    )}
                  </div>
                )}
                
                {currentPoints.length > 0 && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    💡 Click on any marked point to remove it
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          {plots.length > 0 && (
            <Card className="glass-card bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">📝 Plot Actions:</p>
                <div className="space-y-1 text-xs text-blue-800">
                  <p>• <strong>Details</strong> (🔵): Edit name, price, area</p>
                  <p>• <strong>Points</strong> (🟣): Re-mark boundaries</p>
                  <p>• <strong>Delete</strong> (🔴): Remove plot</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Plots List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-ocean-primary flex items-center justify-between">
                <span>Plots ({plots.length})</span>
                <Badge className="bg-gradient-to-r from-ocean-primary to-ocean-secondary text-white">
                  {plots.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plots.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No plots added yet. Mark points on SVG to add plots.
                </p>
              ) : (
                <div className="space-y-2">
                  {plots.map((plot) => (
                    <div key={plot.id} className="flex items-start justify-between p-3 bg-white rounded-lg border hover:border-ocean-primary transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{plot.display_name}</p>
                        <p className="text-xs text-gray-600">{plot.area} sq.ft | ₹{plot.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: <span className="capitalize">{plot.status}</span> | {plot.coordinates.length} points
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          onClick={() => handleEditPlotDetails(plot)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50 text-xs justify-start"
                          title="Edit plot details"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                        <Button
                          onClick={() => handleRemarkPlotPoints(plot)}
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 hover:bg-purple-50 text-xs justify-start"
                          title="Re-mark boundaries"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Points
                        </Button>
                        <Button
                          onClick={() => deletePlot(plot.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 text-xs justify-start"
                          title="Delete plot"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Layout Button */}
          <Button
            onClick={saveLayout}
            disabled={saving || !layoutName.trim() || !svgFileInfo}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg py-6"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Layout ({plots.length} plots)
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - SVG Canvas */}
        <div className="lg:col-span-3">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-ocean-primary">Layout Canvas</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setZoom(z => Math.min(3, z + 0.2))} size="sm" variant="outline">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} size="sm" variant="outline">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm py-2 px-3 bg-gray-100 rounded">{(zoom * 100).toFixed(0)}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg overflow-auto border-2 border-ocean-primary/20" style={{ height: '700px' }}>
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
                        ref={svgRef}
                        onClick={handleSvgClick}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'crosshair'
                        }}
                        viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        {/* Render saved plots */}
                        {plots.map((plot) => (
                          <g key={plot.id} style={{ cursor: 'pointer' }}>
                            <polygon
                              points={getPolygonPoints(plot.coordinates)}
                              fill={getStatusColor(plot.status)}
                              stroke="#0891b2"
                              strokeWidth="2"
                            />
                            <text
                              x={plot.coordinates.reduce((sum, c) => sum + c.x, 0) / plot.coordinates.length}
                              y={plot.coordinates.reduce((sum, c) => sum + c.y, 0) / plot.coordinates.length}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#000"
                              fontSize="14"
                              fontWeight="bold"
                              stroke="#fff"
                              strokeWidth="3"
                              paintOrder="stroke"
                            >
                              {plot.display_name}
                            </text>
                          </g>
                        ))}

                        {/* Current drawing */}
                        {currentPoints.length > 0 && (
                          <>
                            {currentPoints.length >= 3 && (
                              <polygon
                                points={getPolygonPoints(currentPoints)}
                                fill="#ef444430"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                              />
                            )}
                            
                            {currentPoints.length >= 2 && currentPoints.length < 3 && (
                              <polyline
                                points={getPolygonPoints(currentPoints)}
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                              />
                            )}
                            
                            {currentPoints.map((point, idx) => (
                              <g key={idx}>
                                <circle
                                  cx={point.x}
                                  cy={point.y}
                                  r="8"
                                  fill="#ef4444"
                                  stroke="#fff"
                                  strokeWidth="2"
                                  style={{ cursor: 'pointer' }}
                                  onClick={(e) => handlePointClick(e, idx)}
                                  onMouseEnter={(e) => e.target.setAttribute('r', '10')}
                                  onMouseLeave={(e) => e.target.setAttribute('r', '8')}
                                />
                                <text
                                  x={point.x}
                                  y={point.y - 15}
                                  fill="#ef4444"
                                  fontSize="12"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {idx + 1}
                                </text>
                              </g>
                            ))}
                          </>
                        )}
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Home className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Upload SVG to start marking plots</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Plot Details Form Dialog */}
      <Dialog open={showPlotForm} onOpenChange={setShowPlotForm}>
        <DialogContent className="glass-modal max-w-md">
          <DialogHeader>
            <DialogTitle className="text-ocean-primary">
              {editingPlotId ? 'Edit Plot Details' : 'Add New Plot'} ({currentPoints.length} points)
            </DialogTitle>
            {editingPlotId && currentPoints.length === 0 && (
              <p className="text-sm text-purple-600 mt-2">
                💜 Re-marking boundaries: Click on SVG to mark new points
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-semibold">Block</label>
              <Input
                value={plotForm.block}
                onChange={(e) => setPlotForm({...plotForm, block: e.target.value})}
                placeholder="A"
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold">Plot Number/Name *</label>
              <Input
                value={plotForm.display_name}
                onChange={(e) => setPlotForm({...plotForm, display_name: e.target.value})}
                placeholder="e.g., A-1, Plot 101"
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold">Area (sq.ft) *</label>
              <Input
                type="number"
                value={plotForm.area}
                onChange={(e) => setPlotForm({...plotForm, area: e.target.value})}
                placeholder="1200"
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold">Price (₹) *</label>
              <Input
                type="number"
                value={plotForm.price}
                onChange={(e) => setPlotForm({...plotForm, price: e.target.value})}
                placeholder="5000000"
              />
            </div>
            
            <div>
              <label className="text-sm font-semibold">Status</label>
              <select
                value={plotForm.status}
                onChange={(e) => setPlotForm({...plotForm, status: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              💡 Need to adjust points? Click "Cancel" to go back
            </div>
            
            <div className="flex gap-2">
              <Button onClick={cancelPlot} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={savePlot} className="flex-1 bg-gradient-to-r from-ocean-primary to-ocean-secondary text-white">
                <Check className="w-4 h-4 mr-2" />
                {editingPlotId ? 'Update' : 'Add'} Plot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectLayoutEditor;
