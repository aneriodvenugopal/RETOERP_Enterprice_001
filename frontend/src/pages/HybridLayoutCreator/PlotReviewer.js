import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Save, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const methodNames = {
  dxf: { title: 'DXF/DWG', accuracy: '100%' },
  svg: { title: 'SVG', accuracy: '95%' },
  pdf_vector: { title: 'PDF Vector', accuracy: '80%' },
  cv_ocr: { title: 'AI/OCR', accuracy: '60-70%' }
};

const PlotReviewer = ({ detectedPlots, setDetectedPlots, selectedMethod, saving, onSave, onBack }) => {
  const [editingPlot, setEditingPlot] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const method = methodNames[selectedMethod] || {};
  const plotsWithPrice = detectedPlots.filter(p => p.price && p.price > 0).length;
  const plotsWithoutPrice = detectedPlots.length - plotsWithPrice;

  const handleEditPlot = (plot) => {
    setEditingPlot({ ...plot, price: plot.price || '' });
    setShowEditModal(true);
  };

  const handleSavePlot = () => {
    if (!editingPlot.price || editingPlot.price <= 0) {
      toast.error('Please enter valid price');
      return;
    }

    setDetectedPlots(plots => plots.map(p => p.id === editingPlot.id ? editingPlot : p));
    setShowEditModal(false);
    setEditingPlot(null);
    toast.success('Plot updated!');
  };

  const handleDeletePlot = (plotId) => {
    if (!confirm('Delete this plot?')) return;
    setDetectedPlots(plots => plots.filter(p => p.id !== plotId));
    toast.success('Plot deleted');
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-ocean-primary mb-2">
                ✅ Detected {detectedPlots.length} Plots
              </h3>
              <p className="text-gray-700">
                Method: <strong>{method.title}</strong> | Accuracy: <strong>{method.accuracy}</strong>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Priced:</p>
              <p className="text-2xl font-bold text-green-600">{plotsWithPrice} / {detectedPlots.length}</p>
            </div>
          </div>
          
          {plotsWithoutPrice > 0 && (
            <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-700 mt-0.5" />
              <p className="text-sm text-yellow-800">
                <strong>{plotsWithoutPrice} plots</strong> need pricing
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {detectedPlots.map((plot) => {
          const hasPrice = plot.price && plot.price > 0;
          
          return (
            <Card key={plot.id} className={`glass-card ${hasPrice ? 'border-green-300' : 'border-yellow-300'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-ocean-primary">Plot {plot.display_name}</CardTitle>
                  <Badge className={hasPrice ? 'bg-green-500' : 'bg-yellow-500'}>
                    {hasPrice ? '✓' : '⚠'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Block:</span>
                    <span className="font-medium">{plot.block}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Area:</span>
                    <span className="font-medium">{plot.area} sq.ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className={`font-bold ${hasPrice ? 'text-green-600' : 'text-red-600'}`}>
                      {hasPrice ? `₹${parseFloat(plot.price).toLocaleString()}` : 'Not set'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button onClick={() => handleEditPlot(plot)} size="sm" className="flex-1 bg-ocean-primary text-white">
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button onClick={() => handleDeletePlot(plot.id)} size="sm" variant="outline" className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-4">
        <Button onClick={onBack} variant="outline" className="text-lg px-8 py-6">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={onSave}
          disabled={saving || plotsWithoutPrice > 0}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white text-lg px-8 py-6"
        >
          {saving ? 'Saving...' : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Layout
            </>
          )}
        </Button>
      </div>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="glass-modal max-w-md">
          <DialogHeader>
            <DialogTitle className="text-ocean-primary">Edit Plot {editingPlot?.display_name}</DialogTitle>
          </DialogHeader>
          
          {editingPlot && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Plot Name *</label>
                <Input
                  value={editingPlot.display_name}
                  onChange={(e) => setEditingPlot({ ...editingPlot, display_name: e.target.value })}
                  className="glass-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Area (sq.ft) *</label>
                  <Input
                    type="number"
                    value={editingPlot.area}
                    onChange={(e) => setEditingPlot({ ...editingPlot, area: e.target.value })}
                    className="glass-input"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-semibold mb-1 block">Price (₹) *</label>
                  <Input
                    type="number"
                    value={editingPlot.price}
                    onChange={(e) => setEditingPlot({ ...editingPlot, price: e.target.value })}
                    placeholder="Enter price"
                    className="glass-input"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-1 block">Status</label>
                <select
                  value={editingPlot.status}
                  onChange={(e) => setEditingPlot({ ...editingPlot, status: e.target.value })}
                  className="w-full glass-input"
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="blocked">Blocked</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => { setShowEditModal(false); setEditingPlot(null); }}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePlot}
                  className="flex-1 bg-gradient-to-r from-ocean-primary to-ocean-secondary text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlotReviewer;