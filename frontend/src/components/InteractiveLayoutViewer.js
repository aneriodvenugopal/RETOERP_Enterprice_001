import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ZoomIn, ZoomOut, Maximize2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const InteractiveLayoutViewer = ({ layoutData, projectData, onPlotClick, readOnly = false }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [hoveredPlot, setHoveredPlot] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const statusColors = {
    available: '#10b981',
    booked: '#0891b2',
    blocked: '#ef4444',
    sold: '#6b7280'
  };

  const statusLabels = {
    available: 'Available',
    booked: 'Booked',
    blocked: 'Blocked',
    sold: 'Sold'
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handlePanStart = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handlePanMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handlePlotClick = (plot) => {
    setSelectedPlot(plot);
    if (onPlotClick && !readOnly) {
      onPlotClick(plot);
    }
  };

  const getPolygonPoints = (coordinates) => {
    return coordinates.map(coord => `${coord.x},${coord.y}`).join(' ');
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/public/layout/${projectData?.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Shareable link copied!');
  };

  const getStatusSummary = () => {
    const summary = { available: 0, booked: 0, blocked: 0, sold: 0 };
    layoutData?.plots?.forEach(plot => {
      if (summary[plot.status] !== undefined) {
        summary[plot.status]++;
      }
    });
    return summary;
  };

  const statusSummary = getStatusSummary();

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-ocean-primary">{projectData?.name || 'Layout Plan'}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{projectData?.location}</p>
            </div>
            <div className="flex gap-2">
              {!readOnly && (
                <Button onClick={handleShare} className="bg-gradient-to-r from-ocean-secondary to-ocean-accent text-white">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              {Object.entries(statusSummary).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors[status] }}></div>
                  <span className="text-sm font-medium">
                    {statusLabels[status]}: <span className="text-ocean-primary font-bold">{count}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="text-sm font-semibold text-ocean-primary">
              Total: {layoutData?.plots?.length || 0}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Button onClick={() => handleZoom(0.2)} variant="outline" size="sm">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button onClick={() => handleZoom(-0.2)} variant="outline" size="sm">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button onClick={resetView} variant="outline" size="sm">
              <Maximize2 className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <span className="text-sm ml-auto">Zoom: {(zoom * 100).toFixed(0)}%</span>
          </div>

          <div
            className="relative bg-gray-50 rounded-lg overflow-hidden border-2 border-ocean-primary/20"
            style={{ height: '600px', cursor: isPanning ? 'grabbing' : 'grab' }}
            onMouseDown={handlePanStart}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox="0 0 5000 6000"
              preserveAspectRatio="xMidYMid meet"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center'
              }}
            >
              {/* Render background SVG if provided - scale it to match plot coordinates */}
              {layoutData?.svg_content && (
                <g 
                  transform="scale(4.45, 7.55)"
                  opacity="0.8"
                  dangerouslySetInnerHTML={{ 
                    __html: layoutData.svg_content
                      .replace(/<\?xml[^>]*\?>/gi, '')
                      .replace(/<svg[^>]*>/gi, '<g>')
                      .replace(/<\/svg>/gi, '</g>')
                  }} 
                />
              )}

              {/* Render interactive plots on top */}
              {layoutData?.plots?.map((plot) => (
                <g key={plot.id}>
                  <polygon
                    points={getPolygonPoints(plot.coordinates)}
                    fill={statusColors[plot.status]}
                    fillOpacity={hoveredPlot?.id === plot.id ? 0.8 : 0.6}
                    stroke={hoveredPlot?.id === plot.id ? '#0891b2' : '#ffffff'}
                    strokeWidth={hoveredPlot?.id === plot.id ? 8 : 4}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlotClick(plot);
                    }}
                    onMouseEnter={() => setHoveredPlot(plot)}
                    onMouseLeave={() => setHoveredPlot(null)}
                  />
                  <text
                    x={plot.coordinates.reduce((sum, c) => sum + c.x, 0) / plot.coordinates.length}
                    y={plot.coordinates.reduce((sum, c) => sum + c.y, 0) / plot.coordinates.length}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="80"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {plot.display_name || plot.id}
                  </text>
                </g>
              ))}
            </svg>

            {hoveredPlot && (
              <div className="absolute top-4 left-4 glass-card p-4 max-w-xs z-50" style={{ pointerEvents: 'none' }}>
                <h4 className="font-bold text-ocean-primary">Plot {hoveredPlot.display_name}</h4>
                <div className="text-sm space-y-1 mt-2">
                  <p><span className="font-semibold">Status:</span> 
                    <Badge className="ml-2" style={{ backgroundColor: statusColors[hoveredPlot.status] }}>
                      {statusLabels[hoveredPlot.status]}
                    </Badge>
                  </p>
                  <p><span className="font-semibold">Area:</span> {hoveredPlot.area} sq.ft</p>
                  <p><span className="font-semibold">Price:</span> ₹{hoveredPlot.price.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPlot} onOpenChange={() => setSelectedPlot(null)}>
        <DialogContent className="glass-modal">
          <DialogHeader>
            <DialogTitle className="text-ocean-primary">Plot {selectedPlot?.display_name}</DialogTitle>
          </DialogHeader>
          {selectedPlot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge style={{ backgroundColor: statusColors[selectedPlot.status] }}>
                    {statusLabels[selectedPlot.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Area</p>
                  <p className="font-semibold">{selectedPlot.area} sq.ft</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price</p>
                  <p className="font-semibold text-ocean-primary">₹{selectedPlot.price.toLocaleString()}</p>
                </div>
              </div>
              {!readOnly && selectedPlot.status === 'available' && (
                <Button className="w-full bg-gradient-to-r from-ocean-primary to-ocean-secondary text-white">
                  Book This Plot
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InteractiveLayoutViewer;