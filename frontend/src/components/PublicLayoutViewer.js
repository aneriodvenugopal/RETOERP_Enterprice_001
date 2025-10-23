import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';

const PublicLayoutViewer = ({ layout, properties = [], onPlotClick }) => {
  const [zoom, setZoom] = useState(1);
  const [hoveredPlot, setHoveredPlot] = useState(null);

  const statusColors = {
    available: '#dff0d8',
    booked: '#f0ad4e',
    reserved: '#f0ad4e',
    blocked: '#d9534f',
    sold: '#6b7280'
  };

  const statusStrokes = {
    available: '#5cb85c',
    booked: '#d58512',
    reserved: '#d58512',
    blocked: '#c9302c',
    sold: '#4b5563'
  };

  const statusLabels = {
    available: 'Available',
    booked: 'Booked',
    reserved: 'Reserved',
    blocked: 'Blocked',
    sold: 'Sold'
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handlePlotClick = (plot) => {
    if (onPlotClick && plot.status === 'available') {
      onPlotClick(plot);
    }
  };

  const getPolygonPoints = (coordinates) => {
    return coordinates.map(coord => `${coord.x},${coord.y}`).join(' ');
  };

  const resetView = () => {
    setZoom(1);
  };

  const getStatusSummary = () => {
    const summary = { available: 0, booked: 0, reserved: 0, blocked: 0, sold: 0 };
    properties?.forEach(prop => {
      const status = prop.status || 'available';
      if (summary[status] !== undefined) {
        summary[status]++;
      }
    });
    return summary;
  };

  const statusSummary = getStatusSummary();

  // Merge layout plots with property data
  const plots = layout?.plots?.map(plot => {
    const property = properties.find(p => 
      p.plot_number === plot.display_name || 
      p.block === plot.block
    );
    return {
      ...plot,
      ...property,
      status: property?.status || plot.status || 'available'
    };
  }) || [];

  return (
    <div className="w-full space-y-4">
      {/* Status Legend */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            {Object.entries(statusSummary).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: statusColors[status] }}
                ></div>
                <span className="text-sm font-medium text-gray-700">
                  {statusLabels[status]}: <span className="font-bold text-gray-900">{count}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="text-sm font-semibold text-blue-600">
            Total: {properties.length}
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(0.2)}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={resetView}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
          >
            <Maximize2 size={20} />
            <span className="text-sm font-medium">Reset View</span>
          </button>
          <span className="text-sm ml-auto text-gray-600">Zoom: {(zoom * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Interactive Layout */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div 
          className="relative bg-gray-50 overflow-auto" 
          style={{ height: '800px' }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: 'fit-content',
              minWidth: '100%',
              minHeight: '100%'
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
              {/* Background Layout Image */}
              {layout?.svg_url && (
                <div style={{ width: '100%' }}>
                  <img 
                    src={layout.svg_url} 
                    alt="Layout Plan"
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
              )}

              {/* Interactive SVG Overlay */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1122.6667 793.33331"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              >
                {/* Interactive plots */}
                <g
                  transform="matrix(0,-1.3333333,-1.3333333,0,1122.6667,793.33333)"
                  style={{ pointerEvents: 'all' }}
                >
                  <g transform="matrix(0.12,0,0,0.12,2,2)">
                    {plots.map((plot) => (
                      <g key={plot.id}>
                        <polygon
                          points={getPolygonPoints(plot.coordinates)}
                          fill={hoveredPlot?.id === plot.id ? '#cce5ff' : statusColors[plot.status]}
                          stroke={hoveredPlot?.id === plot.id ? '#007bff' : statusStrokes[plot.status]}
                          strokeWidth={hoveredPlot?.id === plot.id ? 5 : 3}
                          style={{ 
                            cursor: plot.status === 'available' ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease'
                          }}
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
                          fontFamily="Arial"
                          fontSize="60"
                          fill="#333"
                          style={{ pointerEvents: 'none' }}
                        >
                          {plot.display_name || plot.plot_number}
                        </text>
                      </g>
                    ))}
                  </g>
                </g>

                {/* Info Message */}
                <g>
                  <rect 
                    x="50" 
                    y="60" 
                    width="280" 
                    height="35" 
                    fill="rgba(255,255,255,0.95)" 
                    stroke="#3b82f6" 
                    strokeWidth="2" 
                    rx="8" 
                  />
                  <text 
                    x="190" 
                    y="83" 
                    textAnchor="middle" 
                    fontFamily="Arial" 
                    fontSize="16" 
                    fill="#1e40af"
                    fontWeight="600"
                  >
                    Click on available plots for details
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* Hover Tooltip */}
          {hoveredPlot && (
            <div
              className="fixed bg-white rounded-xl shadow-2xl p-6 max-w-sm z-50 pointer-events-none border-2 border-blue-500"
              style={{ 
                top: '50%',
                right: '20px',
                transform: 'translateY(-50%)'
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Info className="text-blue-600" size={24} />
                <h4 className="font-bold text-gray-900 text-xl">
                  Plot {hoveredPlot.display_name || hoveredPlot.plot_number}
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Status:</span>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: statusStrokes[hoveredPlot.status] }}
                  >
                    {statusLabels[hoveredPlot.status]}
                  </span>
                </div>
                {hoveredPlot.area && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Area:</span>
                    <span className="font-semibold text-gray-900">{hoveredPlot.area} sq.ft</span>
                  </div>
                )}
                {hoveredPlot.price && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Price:</span>
                    <span className="font-bold text-blue-600 text-lg">₹{(hoveredPlot.price / 100000).toFixed(2)}L</span>
                  </div>
                )}
                {hoveredPlot.block && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Block:</span>
                    <span className="font-semibold text-gray-900">{hoveredPlot.block}</span>
                  </div>
                )}
                {hoveredPlot.status === 'available' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-green-600 font-medium text-center">
                      Click to view full details →
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicLayoutViewer;
