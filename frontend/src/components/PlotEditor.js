import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Move, Edit3, Save, X, Undo, Redo, ZoomIn, ZoomOut, 
  RotateCcw, Hand, MousePointer
} from 'lucide-react';
import { toast } from 'sonner';

const PlotEditor = ({ layout, onSave, onCancel }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  
  // Editor state
  const [editMode, setEditMode] = useState('select'); // select, move, edit
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [plots, setPlots] = useState(layout.plots || []);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [tempBoundary, setTempBoundary] = useState(null);
  
  // View state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // SVG dimensions
  const [svgDimensions, setSvgDimensions] = useState({ 
    width: 1122.6667, 
    height: 793.33331 
  });
  
  useEffect(() => {
    // Load SVG and detect dimensions
    if (layout?.svg_url) {
      fetch(layout.svg_url)
        .then(r => r.text())
        .then(svgText => {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgEl = svgDoc.querySelector('svg');
          
          if (svgEl) {
            const viewBox = svgEl.getAttribute('viewBox');
            if (viewBox) {
              const [, , w, h] = viewBox.split(' ').map(Number);
              setSvgDimensions({ width: w, height: h });
            }
          }
        });
    }
  }, [layout?.svg_url]);
  
  // Add to history
  const addToHistory = (newPlots) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newPlots)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPlots(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      toast.success('Undo successful');
    }
  };
  
  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPlots(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      toast.success('Redo successful');
    }
  };
  
  // Get SVG point from mouse event
  const getSVGPoint = (evt) => {
    if (!svgRef.current) return null;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((evt.clientX - rect.left - pan.x) / zoom);
    const y = ((evt.clientY - rect.top - pan.y) / zoom);
    
    return { x, y };
  };
  
  // Mouse down handler
  const handleMouseDown = (evt, plot = null) => {
    evt.preventDefault();
    
    const point = getSVGPoint(evt);
    
    if (editMode === 'pan' || evt.button === 1 || evt.shiftKey) {
      // Pan mode
      setIsPanning(true);
      setPanStart({ x: evt.clientX - pan.x, y: evt.clientY - pan.y });
    } else if (editMode === 'move' && plot) {
      // Move plot mode
      setSelectedPlot(plot);
      setIsDragging(true);
      setDragStart(point);
    } else if (editMode === 'edit' && plot) {
      // Edit boundary mode
      setSelectedPlot(plot);
      setTempBoundary(plot.boundary || plot.coordinates || []);
      setIsDragging(true);
      setDragStart(point);
    } else if (editMode === 'select' && plot) {
      // Select plot
      setSelectedPlot(plot);
    }
  };
  
  // Mouse move handler
  const handleMouseMove = (evt) => {
    if (isPanning) {
      setPan({
        x: evt.clientX - panStart.x,
        y: evt.clientY - panStart.y
      });
    } else if (isDragging && selectedPlot && dragStart) {
      const point = getSVGPoint(evt);
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;
      
      if (editMode === 'move') {
        // Move entire plot
        const updatedPlots = plots.map(p => {
          if (p.id === selectedPlot.id || p.display_name === selectedPlot.display_name) {
            const boundary = p.boundary || p.coordinates || [];
            const newBoundary = boundary.map(pt => ({
              x: pt.x + dx,
              y: pt.y + dy
            }));
            // Update both fields if they exist
            const updated = { ...p };
            if (p.boundary) updated.boundary = newBoundary;
            if (p.coordinates) updated.coordinates = newBoundary;
            return updated;
          }
          return p;
        });
        
        setPlots(updatedPlots);
        setDragStart(point);
      } else if (editMode === 'edit' && tempBoundary) {
        // Edit boundary (for now, scale uniformly)
        const centerX = tempBoundary.reduce((sum, pt) => sum + pt.x, 0) / tempBoundary.length;
        const centerY = tempBoundary.reduce((sum, pt) => sum + pt.y, 0) / tempBoundary.length;
        
        const scale = 1 + (dx / 100); // Adjust sensitivity
        
        const newBoundary = tempBoundary.map(pt => ({
          x: centerX + (pt.x - centerX) * scale,
          y: centerY + (pt.y - centerY) * scale
        }));
        
        const updatedPlots = plots.map(p => {
          if (p.id === selectedPlot.id || p.display_name === selectedPlot.display_name) {
            // Update both fields if they exist
            const updated = { ...p };
            if (p.boundary) updated.boundary = newBoundary;
            if (p.coordinates) updated.coordinates = newBoundary;
            return updated;
          }
          return p;
        });
        
        setPlots(updatedPlots);
      }
    }
  };
  
  // Mouse up handler
  const handleMouseUp = () => {
    if (isDragging && selectedPlot) {
      addToHistory(plots);
      toast.success('Plot updated');
    }
    
    setIsPanning(false);
    setIsDragging(false);
    setDragStart(null);
    setTempBoundary(null);
  };
  
  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };
  
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
  // Save changes
  const handleSave = () => {
    onSave(plots);
    toast.success('Changes saved successfully!');
  };
  
  // Render plot boundary
  const renderPlot = (plot) => {
    const plotId = plot.id || plot.plot_number || plot.display_name;
    const isSelected = selectedPlot?.id === plot.id || selectedPlot?.display_name === plot.display_name;
    const boundary = plot.boundary || plot.coordinates || [];
    
    if (boundary.length < 3) return null;
    
    const pathData = boundary.map((point, idx) => 
      `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ') + ' Z';
    
    const color = 
      plot.status === 'available' ? '#10b981' :
      plot.status === 'booked' ? '#f59e0b' :
      plot.status === 'sold' ? '#8b5cf6' : '#6b7280';
    
    // Calculate centroid for label
    const centerX = boundary.reduce((sum, pt) => sum + pt.x, 0) / boundary.length;
    const centerY = boundary.reduce((sum, pt) => sum + pt.y, 0) / boundary.length;
    
    return (
      <g key={plotId}>
        <path
          d={pathData}
          fill={color}
          fillOpacity={isSelected ? 0.4 : 0.3}
          stroke={isSelected ? '#3b82f6' : color}
          strokeWidth={isSelected ? 3 : 2}
          className="cursor-pointer transition-all hover:opacity-60"
          onMouseDown={(e) => handleMouseDown(e, plot)}
        />
        
        {/* Plot number label */}
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#000"
          fontSize="14"
          fontWeight="bold"
          className="pointer-events-none select-none"
          style={{ userSelect: 'none' }}
        >
          {plot.display_name || plot.plot_number || plot.id}
        </text>
        
        {/* Control points for selected plot */}
        {isSelected && editMode === 'edit' && boundary.map((point, idx) => (
          <circle
            key={idx}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth="2"
            className="cursor-move"
          />
        ))}
      </g>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Plot Editor</h2>
            <p className="text-sm text-gray-600 mt-1">
              {editMode === 'select' && 'Click on plots to select them'}
              {editMode === 'move' && 'Drag plots to move their position'}
              {editMode === 'edit' && 'Drag to resize plot boundaries'}
              {editMode === 'pan' && 'Drag to pan the view'}
            </p>
          </div>
          
          <Button onClick={onCancel} variant="ghost" size="sm">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex gap-2">
            {/* Mode buttons */}
            <Button
              onClick={() => setEditMode('select')}
              variant={editMode === 'select' ? 'default' : 'outline'}
              size="sm"
              title="Select Mode"
            >
              <MousePointer className="w-4 h-4 mr-1" />
              Select
            </Button>
            
            <Button
              onClick={() => setEditMode('move')}
              variant={editMode === 'move' ? 'default' : 'outline'}
              size="sm"
              title="Move Plots"
            >
              <Move className="w-4 h-4 mr-1" />
              Move
            </Button>
            
            <Button
              onClick={() => setEditMode('edit')}
              variant={editMode === 'edit' ? 'default' : 'outline'}
              size="sm"
              title="Edit Boundaries"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            
            <Button
              onClick={() => setEditMode('pan')}
              variant={editMode === 'pan' ? 'default' : 'outline'}
              size="sm"
              title="Pan View"
            >
              <Hand className="w-4 h-4 mr-1" />
              Pan
            </Button>
            
            <div className="w-px h-8 bg-gray-300 mx-2" />
            
            {/* History buttons */}
            <Button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              variant="outline"
              size="sm"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              variant="outline"
              size="sm"
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            {/* Zoom controls */}
            <Button onClick={handleZoomOut} size="sm" variant="outline">
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="px-3 py-2 bg-white border rounded text-sm">
              {(zoom * 100).toFixed(0)}%
            </span>
            
            <Button onClick={handleZoomIn} size="sm" variant="outline">
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Button onClick={handleResetView} size="sm" variant="outline">
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <div className="w-px h-8 bg-gray-300 mx-2" />
            
            {/* Save button */}
            <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-gray-100 p-4">
          <div 
            ref={containerRef}
            className="w-full h-full bg-white rounded-lg border-2 border-gray-300 overflow-hidden relative"
            style={{ cursor: isPanning ? 'grabbing' : editMode === 'pan' ? 'grab' : 'default' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: '0 0'
              }}
            >
              {/* Background image */}
              {layout.svg_url && (
                <image
                  href={layout.svg_url}
                  width={svgDimensions.width}
                  height={svgDimensions.height}
                  opacity="0.3"
                />
              )}
              
              {/* Plots */}
              {plots.map(plot => renderPlot(plot))}
            </svg>
            
            {/* Selected plot info */}
            {selectedPlot && (
              <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
                <div className="text-sm">
                  <div className="font-bold text-lg mb-2">
                    Plot {selectedPlot.display_name || selectedPlot.plot_number || selectedPlot.id}
                  </div>
                  <div className="space-y-1 text-gray-600">
                    <div>Status: <span className={`px-2 py-1 rounded text-xs ${
                      selectedPlot.status === 'available' ? 'bg-green-100 text-green-700' :
                      selectedPlot.status === 'booked' ? 'bg-orange-100 text-orange-700' :
                      selectedPlot.status === 'sold' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{selectedPlot.status}</span></div>
                    {selectedPlot.area && <div>Area: {selectedPlot.area} sq.ft</div>}
                    {selectedPlot.price && <div>Price: ₹{selectedPlot.price.toLocaleString()}</div>}
                    {selectedPlot.block && <div>Block: {selectedPlot.block}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotEditor;
