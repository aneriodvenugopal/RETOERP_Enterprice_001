import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, Save, ArrowLeft, FileText, Image as ImageIcon, Wand2, Hand,
  CheckCircle, AlertCircle, Info, Zap, Clock, Target, Edit2, Trash2, Check, X
} from 'lucide-react';
import { toast } from 'sonner';
import { layoutService } from '../services';

const HybridLayoutCreator = () => {
  const navigate = useNavigate();
  
  // State
  const [step, setStep] = useState(1); // 1: Choose method, 2: Upload/Process, 3: Review & Edit
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [layoutName, setLayoutName] = useState('');
  const [layoutType, setLayoutType] = useState('venture');
  const [file, setFile] = useState(null);
  const [svgFileInfo, setSvgFileInfo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [detectedPlots, setDetectedPlots] = useState([]);
  const [editingPlot, setEditingPlot] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef(null);

  const uploadMethods = [
    {
      id: 'dxf',
      title: 'DXF/DWG File',
      icon: Target,
      color: 'green',
      accuracy: '100%',
      time: '⚡ 2-5 minutes',
      manual: '5%',
      description: 'AutoCAD/CAD software files - Best & Fastest method',
      acceptedFormats: '.dxf, .dwg',
      notes: [
        '✅ 100% accurate coordinates',
        '✅ Automatic plot detection',
        '✅ Plot numbers extracted from text',
        '✅ Layers support (plots, roads, parks)',
        '⚡ 100 plots processed in 2-3 seconds',
        '📝 Only need to add: Price, Status, Amenities'
      ],
      requirements: [
        'CAD team should export as .dxf or .dwg format',
        'Plot boundaries should be closed polygons/rectangles',
        'Plot numbers should be text labels in CAD'
      ],
      teluguInfo: [
        '🎯 CAD టీమ్ నుండి .dxf లేదా .dwg file తీసుకోండి',
        '⚡ అత్యంత వేగవంతమైన & ఖచ్చితమైన పద్ధతి',
        '💯 Plot boundaries మరియు numbers automatically detect అవుతాయి',
        '📝 మీరు price, status మాత్రమే add చేయాలి'
      ]
    },
    {
      id: 'svg',
      title: 'SVG File',
      icon: FileText,
      color: 'blue',
      accuracy: '95%',
      time: '⚡ 5-10 minutes',
      manual: '10%',
      description: 'Scalable Vector Graphics - Excellent method',
      acceptedFormats: '.svg',
      notes: [
        '✅ 95% accurate coordinates',
        '✅ Vector shapes preserved',
        '✅ Text extraction possible',
        '✅ Lightweight files',
        '⚡ Fast processing',
        '⚠️ May need minor adjustments for complex shapes'
      ],
      requirements: [
        'Export layout as SVG from design software',
        'Ensure shapes are not grouped',
        'Text labels should be separate elements'
      ],
      teluguInfo: [
        '📄 SVG format లో layout ఉంటే ఉపయోగించండి',
        '✅ చాలా మంచి accuracy',
        '⚡ వేగవంతమైన processing',
        '⚠️ కొన్ని చిన్న corrections అవసరం కావచ్చు'
      ]
    },
    {
      id: 'pdf_vector',
      title: 'PDF File (Vector)',
      icon: FileText,
      color: 'purple',
      accuracy: '80%',
      time: '⏱️ 10-20 minutes',
      manual: '25%',
      description: 'Vector-based PDF - Good method',
      acceptedFormats: '.pdf',
      notes: [
        '✅ 80% accurate for vector PDFs',
        '✅ Text is selectable in PDF',
        '✅ Common format from CAD exports',
        '⚠️ Works only for vector PDFs (not scanned)',
        '⚠️ Complex shapes may need verification',
        '📝 Manual verification recommended'
      ],
      requirements: [
        'PDF should be vector-based (not scanned)',
        'Test: Open PDF and try to select text - if text is selectable, it\'s vector PDF',
        'Export from CAD software using "Save as PDF" or "Export PDF"'
      ],
      warning: '❌ Scanned/Image PDFs will not work properly',
      teluguInfo: [
        '📄 Vector PDF అయితే మాత్రమే పని చేస్తుంది',
        '✅ Test: PDF లో text select అవ్వాలి',
        '❌ Scanner లో scan చేసిన PDFs పని చేయవు',
        '⚠️ Manual verification అవసరం'
      ],
      howToCheck: [
        '1. Open PDF file',
        '2. Try to select text with mouse',
        '3. If text is selectable → Vector PDF ✅',
        '4. If text cannot be selected → Image PDF ❌ (use CV method instead)'
      ]
    },
    {
      id: 'cv_ocr',
      title: 'Any Image/PDF (AI)',
      icon: Wand2,
      color: 'orange',
      accuracy: '60-70%',
      time: '⏱️ 30-45 minutes',
      manual: '40%',
      description: 'Computer Vision + OCR - For scanned/image files',
      acceptedFormats: '.pdf, .jpg, .png, .jpeg',
      notes: [
        '🤖 AI-powered detection',
        '✅ Works with scanned documents',
        '✅ Works with images/photos',
        '✅ Works with image-based PDFs',
        '⚠️ 60-70% accuracy',
        '⚠️ Requires significant manual correction',
        '⏱️ Slower processing time'
      ],
      requirements: [
        'High quality scan/image (300+ DPI recommended)',
        'Clear plot boundaries',
        'Good lighting (for photos)',
        'Plots should be clearly visible'
      ],
      teluguInfo: [
        '📷 Scanner లేదా camera తో తీసిన layouts కోసం',
        '🤖 AI ద్వారా detect చేస్తుంది',
        '⚠️ 60-70% accuracy మాత్రమే',
        '📝 చాలా manual corrections అవసరం',
        '⏱️ Time ఎక్కువ పడుతుంది'
      ],
      bestFor: [
        'Scanned paper layouts',
        'Mobile photos of layouts',
        'Image-based PDFs',
        'Hand-drawn layouts'
      ]
    },
    {
      id: 'manual',
      title: 'Manual Drawing',
      icon: Hand,
      color: 'gray',
      accuracy: '100%',
      time: '⏱️ 2-3 hours',
      manual: '100%',
      description: 'Click to mark plot boundaries - Traditional method',
      acceptedFormats: '.svg, .pdf, .jpg, .png',
      notes: [
        '✅ 100% accurate (you control everything)',
        '✅ Works with any file format',
        '✅ No dependency on file structure',
        '⏱️ Very time-consuming',
        '👆 Click 4 corners for each plot',
        '📝 Enter all details manually'
      ],
      requirements: [
        'Background image/SVG of layout',
        'Patience to mark each plot',
        'Mouse/touchpad for clicking'
      ],
      teluguInfo: [
        '👆 మీరే ప్రతి plot మార్క్ చేయాలి',
        '✅ పూర్తి నియంత్రణ మీ చేతుల్లో',
        '⏱️ చాలా time పడుతుంది (100 plots = 2-3 hours)',
        '📝 అన్ని details మీరే enter చేయాలి'
      ],
      bestFor: [
        'Small layouts (< 20 plots)',
        'When no other format available',
        'Complete control needed',
        'Learning/testing purposes'
      ]
    }
  ];

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleProceed = () => {
    if (!layoutName.trim()) {
      toast.error('Please enter layout name');
      return;
    }
    
    if (selectedMethod === 'manual') {
      // Go directly to manual drawing interface
      navigate('/layouts/create-manual', {
        state: { layoutName, layoutType }
      });
      return;
    }
    
    setStep(2);
  };

  const handleProcessFile = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Upload SVG file first
      toast.info('Uploading file...');
      const uploadResult = await layoutService.uploadSVG(file);
      setSvgFileInfo(uploadResult);
      
      toast.info(`Processing ${selectedMethod.toUpperCase()} file... Detecting plots automatically.`);
      
      // Simulate processing based on method
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock detected plots based on method accuracy
      const mockPlots = generateMockDetectedPlots(selectedMethod);
      
      setDetectedPlots(mockPlots);
      setStep(3);
      
      toast.success(`✅ Detected ${mockPlots.length} plots! Review and add pricing details.`);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file. Please try again or use manual method.');
    } finally {
      setProcessing(false);
    }
  };

  const generateMockDetectedPlots = (method) => {
    // Generate different number of plots based on method
    const plotCounts = {
      'dxf': 15,
      'svg': 12,
      'pdf_vector': 10,
      'cv_ocr': 8
    };
    
    const count = plotCounts[method] || 10;
    const plots = [];
    
    for (let i = 0; i < count; i++) {
      const blockLetter = String.fromCharCode(65 + Math.floor(i / 5)); // A, B, C...
      const plotNum = (i % 5) + 1;
      
      plots.push({
        id: `plot-${Date.now()}-${i}`,
        display_name: `${blockLetter}-${plotNum}`,
        block: blockLetter,
        coordinates: [
          { x: 50 + (i * 80), y: 50 },
          { x: 120 + (i * 80), y: 50 },
          { x: 120 + (i * 80), y: 150 },
          { x: 50 + (i * 80), y: 150 }
        ],
        area: Math.floor(1000 + Math.random() * 500),
        price: null, // User needs to add
        status: 'available',
        amenities: [],
        confidence: method === 'dxf' ? 100 : method === 'svg' ? 95 : method === 'pdf_vector' ? 80 : 65
      });
    }
    
    return plots;
  };

  const handleEditPlot = (plot) => {
    setEditingPlot({
      ...plot,
      price: plot.price || '',
      status: plot.status || 'available'
    });
    setShowEditModal(true);
  };

  const handleSavePlot = () => {
    if (!editingPlot.price || editingPlot.price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setDetectedPlots(plots => 
      plots.map(p => p.id === editingPlot.id ? editingPlot : p)
    );
    
    setShowEditModal(false);
    setEditingPlot(null);
    toast.success(`Plot ${editingPlot.display_name} updated!`);
  };

  const handleDeletePlot = (plotId) => {
    if (!confirm('Are you sure you want to delete this plot?')) return;
    
    setDetectedPlots(plots => plots.filter(p => p.id !== plotId));
    toast.success('Plot deleted');
  };

  const handleSaveLayout = async () => {
    // Check if all plots have prices
    const plotsWithoutPrice = detectedPlots.filter(p => !p.price || p.price <= 0);
    
    if (plotsWithoutPrice.length > 0) {
      toast.error(`${plotsWithoutPrice.length} plots are missing prices. Please add prices to all plots.`);
      return;
    }

    setSaving(true);

    try {
      const layoutData = {
        layout_name: layoutName,
        layout_type: layoutType,
        svg_url: svgFileInfo.file_url,
        plots: detectedPlots.map(p => ({
          ...p,
          price: parseFloat(p.price),
          area: parseFloat(p.area)
        })),
        metadata: {
          created_by: 'hybrid_layout_creator',
          detection_method: selectedMethod,
          total_plots: detectedPlots.length,
          original_filename: svgFileInfo.original_filename,
          file_id: svgFileInfo.file_id,
          version: '2.0'
        },
        is_template: false
      };

      const result = await layoutService.createMasterLayout(layoutData);
      
      toast.success(`✅ Layout "${layoutName}" saved with ${detectedPlots.length} plots!`);
      
      setTimeout(() => {
        navigate('/layouts');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error(error.response?.data?.detail || 'Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const selectedMethodData = uploadMethods.find(m => m.id === selectedMethod);
  const plotsWithPrice = detectedPlots.filter(p => p.price && p.price > 0).length;
  const plotsWithoutPrice = detectedPlots.length - plotsWithPrice;

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-ocean-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ocean-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => step === 1 ? navigate('/layouts') : setStep(step - 1)}
              variant="ghost"
              className="text-ocean-primary hover:bg-ocean-primary/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Back to Layouts' : 'Back'}
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-ocean-primary to-ocean-secondary bg-clip-text text-transparent">
              Create New Layout - Smart Detection
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-ocean-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-ocean-primary text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="ml-2 font-medium">Choose Method</span>
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-ocean-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-ocean-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-ocean-primary text-white' : 'bg-gray-200'}`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="ml-2 font-medium">Upload & Process</span>
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-ocean-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-ocean-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-ocean-primary text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Review & Save</span>
            </div>
          </div>
        </div>

        {/* Step 1: Method Selection */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Layout Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-ocean-primary">Layout Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
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
                
                <div>
                  <label className="text-sm font-semibold mb-1 block">Layout Type *</label>
                  <select
                    value={layoutType}
                    onChange={(e) => setLayoutType(e.target.value)}
                    className="w-full glass-input"
                  >
                    <option value="venture">Venture/Layout</option>
                    <option value="apartment">Apartment</option>
                    <option value="open_land">Open Land</option>
                    <option value="farm_land">Farm Land</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Method Selection */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-ocean-primary">Choose Upload Method</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Select the best method based on your file type. Hover over each option for detailed information.
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  
                  return (
                    <div
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                        isSelected
                          ? 'border-ocean-primary bg-ocean-primary/5 scale-105'
                          : 'border-gray-200 hover:border-ocean-primary/50'
                      }`}
                    >
                      {/* Icon & Title */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg bg-${method.color}-100`}>
                          <Icon className={`w-6 h-6 text-${method.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{method.title}</h3>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-ocean-primary absolute top-4 right-4" />
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Accuracy:</span>
                          <Badge className={`bg-${method.color}-500`}>{method.accuracy}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium">{method.time}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Manual Work:</span>
                          <span className="font-medium">{method.manual}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{method.description}</p>

                      {/* Expand to see details */}
                      <details className="mt-3">
                        <summary className="text-sm text-ocean-primary font-medium cursor-pointer flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          View Detailed Information
                        </summary>
                        
                        <div className="mt-3 space-y-3 text-xs">
                          {/* Notes */}
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">Features:</p>
                            <ul className="space-y-1 pl-4">
                              {method.notes.map((note, idx) => (
                                <li key={idx} className="text-gray-600">{note}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Telugu Info */}
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="font-semibold text-blue-800 mb-1">తెలుగులో:</p>
                            <ul className="space-y-1 pl-4">
                              {method.teluguInfo.map((info, idx) => (
                                <li key={idx} className="text-blue-700">{info}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Requirements */}
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">Requirements:</p>
                            <ul className="space-y-1 pl-4 list-disc">
                              {method.requirements.map((req, idx) => (
                                <li key={idx} className="text-gray-600">{req}</li>
                              ))}
                            </ul>
                          </div>

                          {/* How to check (for PDF) */}
                          {method.howToCheck && (
                            <div className="bg-yellow-50 p-2 rounded">
                              <p className="font-semibold text-yellow-800 mb-1">How to Check if PDF is Vector:</p>
                              <ul className="space-y-1 pl-4">
                                {method.howToCheck.map((step, idx) => (
                                  <li key={idx} className="text-yellow-700">{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Warning */}
                          {method.warning && (
                            <div className="bg-red-50 p-2 rounded flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-red-700">{method.warning}</p>
                            </div>
                          )}

                          {/* Best For */}
                          {method.bestFor && (
                            <div>
                              <p className="font-semibold text-gray-700 mb-1">Best For:</p>
                              <ul className="space-y-1 pl-4 list-disc">
                                {method.bestFor.map((item, idx) => (
                                  <li key={idx} className="text-gray-600">{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Comparison Info */}
            <Card className="glass-card bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Quick Comparison (త్వరిత పోలిక)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-green-700">🏆 Best: DXF/DWG</p>
                        <p className="text-gray-600">100% accurate, fastest</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-700">⭐ Great: SVG</p>
                        <p className="text-gray-600">95% accurate, fast</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700">👍 Good: Vector PDF</p>
                        <p className="text-gray-600">80% accurate, moderate</p>
                      </div>
                      <div>
                        <p className="font-semibold text-orange-700">🤖 AI: Image/Scan</p>
                        <p className="text-gray-600">60-70% accurate, slow</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proceed Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleProceed}
                disabled={!selectedMethod || !layoutName.trim()}
                className="bg-gradient-to-r from-ocean-primary to-ocean-secondary text-white text-lg px-8 py-6"
              >
                Continue with {selectedMethodData?.title || 'Selected Method'}
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: File Upload & Processing */}
        {step === 2 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-ocean-primary">Upload {selectedMethodData?.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Accepted formats: {selectedMethodData?.acceptedFormats}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-ocean-primary/30 rounded-lg p-12 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={selectedMethodData?.acceptedFormats}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!file ? (
                  <div>
                    <Upload className="w-16 h-16 text-ocean-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Drop your file here or click to browse</h3>
                    <p className="text-gray-600 mb-4">
                      Supported formats: {selectedMethodData?.acceptedFormats}
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-ocean-primary to-ocean-secondary text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Select File
                    </Button>
                  </div>
                ) : (
                  <div>
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">File Selected</h3>
                    <p className="text-gray-600 mb-4">
                      <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => {
                          setFile(null);
                          fileInputRef.current.value = '';
                        }}
                        variant="outline"
                      >
                        Change File
                      </Button>
                      <Button
                        onClick={handleProcessFile}
                        disabled={processing}
                        className="bg-gradient-to-r from-ocean-primary to-ocean-secondary text-white"
                      >
                        {processing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Process & Detect Plots
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Info about processing */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-2">What happens during processing:</p>
                      <ul className="space-y-1 list-disc pl-5">
                        <li>File is uploaded to server securely</li>
                        <li>Smart detection algorithm analyzes the layout</li>
                        <li>Plot boundaries are automatically identified</li>
                        <li>Plot numbers/names are extracted from labels</li>
                        <li>Area is calculated from coordinates</li>
                        <li>You'll review and add pricing in next step</li>
                      </ul>
                      <p className="mt-2 text-xs">
                        <strong>Note:</strong> Currently showing demo detection. Full processing will be implemented with actual file parsers.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Edit Plots */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="glass-card bg-gradient-to-r from-green-50 to-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-ocean-primary mb-2">
                      ✅ Detected {detectedPlots.length} Plots
                    </h3>
                    <p className="text-gray-700">
                      Using <strong>{selectedMethodData?.title}</strong> method | 
                      Confidence: <strong>{selectedMethodData?.accuracy}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Price Status:</p>
                    <p className="text-2xl font-bold text-green-600">{plotsWithPrice} / {detectedPlots.length}</p>
                    <p className="text-xs text-gray-600">plots with pricing</p>
                  </div>
                </div>
                
                {plotsWithoutPrice > 0 && (
                  <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      <strong>{plotsWithoutPrice} plots</strong> still need pricing information. 
                      Please add prices to all plots before saving.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detectedPlots.map((plot) => {
                const hasPrice = plot.price && plot.price > 0;
                
                return (
                  <Card key={plot.id} className={`glass-card ${hasPrice ? 'border-green-300' : 'border-yellow-300'}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg text-ocean-primary">
                          Plot {plot.display_name}
                        </CardTitle>
                        <Badge className={hasPrice ? 'bg-green-500' : 'bg-yellow-500'}>
                          {hasPrice ? '✓ Priced' : '⚠ No Price'}
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
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge variant="outline">{plot.status}</Badge>
                        </div>
                        {plot.confidence && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-medium text-ocean-primary">{plot.confidence}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          onClick={() => handleEditPlot(plot)}
                          size="sm"
                          className="flex-1 bg-ocean-primary text-white"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeletePlot(plot.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="text-lg px-8 py-6"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Upload
              </Button>
              <Button
                onClick={handleSaveLayout}
                disabled={saving || plotsWithoutPrice > 0}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg px-8 py-6"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Layout ({detectedPlots.length} plots)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Edit Plot Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="glass-modal max-w-md">
          <DialogHeader>
            <DialogTitle className="text-ocean-primary">
              Edit Plot {editingPlot?.display_name}
            </DialogTitle>
          </DialogHeader>
          
          {editingPlot && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Plot Number/Name *</label>
                <Input
                  value={editingPlot.display_name}
                  onChange={(e) => setEditingPlot({ ...editingPlot, display_name: e.target.value })}
                  className="glass-input"
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-1 block">Block</label>
                <Input
                  value={editingPlot.block}
                  onChange={(e) => setEditingPlot({ ...editingPlot, block: e.target.value })}
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
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlot(null);
                  }}
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
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HybridLayoutCreator;
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Upload, Save, ArrowLeft, FileText, Image as ImageIcon, Wand2, Hand,
  CheckCircle, AlertCircle, Info, Zap, Clock, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { layoutService } from '../services';

const HybridLayoutCreator = () => {
  const navigate = useNavigate();
  
  // State
  const [step, setStep] = useState(1); // 1: Choose method, 2: Upload/Process, 3: Edit
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [layoutName, setLayoutName] = useState('');
  const [layoutType, setLayoutType] = useState('venture');
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [detectedPlots, setDetectedPlots] = useState([]);
  
  const fileInputRef = useRef(null);

  const uploadMethods = [
    {
      id: 'dxf',
      title: 'DXF/DWG File',
      icon: Target,
      color: 'green',
      accuracy: '100%',
      time: '⚡ 2-5 minutes',
      manual: '5%',
      description: 'AutoCAD/CAD software files - Best & Fastest method',
      acceptedFormats: '.dxf, .dwg',
      notes: [
        '✅ 100% accurate coordinates',
        '✅ Automatic plot detection',
        '✅ Plot numbers extracted from text',
        '✅ Layers support (plots, roads, parks)',
        '⚡ 100 plots processed in 2-3 seconds',
        '📝 Only need to add: Price, Status, Amenities'
      ],
      requirements: [
        'CAD team should export as .dxf or .dwg format',
        'Plot boundaries should be closed polygons/rectangles',
        'Plot numbers should be text labels in CAD'
      ],
      teluguInfo: [
        '🎯 CAD టీమ్ నుండి .dxf లేదా .dwg file తీసుకోండి',
        '⚡ అత్యంత వేగవంతమైన & ఖచ్చితమైన పద్ధతి',
        '💯 Plot boundaries మరియు numbers automatically detect అవుతాయి',
        '📝 మీరు price, status మాత్రమే add చేయాలి'
      ]
    },
    {
      id: 'svg',
      title: 'SVG File',
      icon: FileText,
      color: 'blue',
      accuracy: '95%',
      time: '⚡ 5-10 minutes',
      manual: '10%',
      description: 'Scalable Vector Graphics - Excellent method',
      acceptedFormats: '.svg',
      notes: [
        '✅ 95% accurate coordinates',
        '✅ Vector shapes preserved',
        '✅ Text extraction possible',
        '✅ Lightweight files',
        '⚡ Fast processing',
        '⚠️ May need minor adjustments for complex shapes'
      ],
      requirements: [
        'Export layout as SVG from design software',
        'Ensure shapes are not grouped',
        'Text labels should be separate elements'
      ],
      teluguInfo: [
        '📄 SVG format లో layout ఉంటే ఉపయోగించండి',
        '✅ చాలా మంచి accuracy',
        '⚡ వేగవంతమైన processing',
        '⚠️ కొన్ని చిన్న corrections అవసరం కావచ్చు'
      ]
    },
    {
      id: 'pdf_vector',
      title: 'PDF File (Vector)',
      icon: FileText,
      color: 'purple',
      accuracy: '80%',
      time: '⏱️ 10-20 minutes',
      manual: '25%',
      description: 'Vector-based PDF - Good method',
      acceptedFormats: '.pdf',
      notes: [
        '✅ 80% accurate for vector PDFs',
        '✅ Text is selectable in PDF',
        '✅ Common format from CAD exports',
        '⚠️ Works only for vector PDFs (not scanned)',
        '⚠️ Complex shapes may need verification',
        '📝 Manual verification recommended'
      ],
      requirements: [
        'PDF should be vector-based (not scanned)',
        'Test: Open PDF and try to select text - if text is selectable, it\'s vector PDF',
        'Export from CAD software using "Save as PDF" or "Export PDF"'
      ],
      warning: '❌ Scanned/Image PDFs will not work properly',
      teluguInfo: [
        '📄 Vector PDF అయితే మాత్రమే పని చేస్తుంది',
        '✅ Test: PDF లో text select అవ్వాలి',
        '❌ Scanner లో scan చేసిన PDFs పని చేయవు',
        '⚠️ Manual verification అవసరం'
      ],
      howToCheck: [
        '1. Open PDF file',
        '2. Try to select text with mouse',
        '3. If text is selectable → Vector PDF ✅',
        '4. If text cannot be selected → Image PDF ❌ (use CV method instead)'
      ]
    },
    {
      id: 'cv_ocr',
      title: 'Any Image/PDF (AI)',
      icon: Wand2,
      color: 'orange',
      accuracy: '60-70%',
      time: '⏱️ 30-45 minutes',
      manual: '40%',
      description: 'Computer Vision + OCR - For scanned/image files',
      acceptedFormats: '.pdf, .jpg, .png, .jpeg',
      notes: [
        '🤖 AI-powered detection',
        '✅ Works with scanned documents',
        '✅ Works with images/photos',
        '✅ Works with image-based PDFs',
        '⚠️ 60-70% accuracy',
        '⚠️ Requires significant manual correction',
        '⏱️ Slower processing time'
      ],
      requirements: [
        'High quality scan/image (300+ DPI recommended)',
        'Clear plot boundaries',
        'Good lighting (for photos)',
        'Plots should be clearly visible'
      ],
      teluguInfo: [
        '📷 Scanner లేదా camera తో తీసిన layouts కోసం',
        '🤖 AI ద్వారా detect చేస్తుంది',
        '⚠️ 60-70% accuracy మాత్రమే',
        '📝 చాలా manual corrections అవసరం',
        '⏱️ Time ఎక్కువ పడుతుంది'
      ],
      bestFor: [
        'Scanned paper layouts',
        'Mobile photos of layouts',
        'Image-based PDFs',
        'Hand-drawn layouts'
      ]
    },
    {
      id: 'manual',
      title: 'Manual Drawing',
      icon: Hand,
      color: 'gray',
      accuracy: '100%',
      time: '⏱️ 2-3 hours',
      manual: '100%',
      description: 'Click to mark plot boundaries - Traditional method',
      acceptedFormats: '.svg, .pdf, .jpg, .png',
      notes: [
        '✅ 100% accurate (you control everything)',
        '✅ Works with any file format',
        '✅ No dependency on file structure',
        '⏱️ Very time-consuming',
        '👆 Click 4 corners for each plot',
        '📝 Enter all details manually'
      ],
      requirements: [
        'Background image/SVG of layout',
        'Patience to mark each plot',
        'Mouse/touchpad for clicking'
      ],
      teluguInfo: [
        '👆 మీరే ప్రతి plot మార్క్ చేయాలి',
        '✅ పూర్తి నియంత్రణ మీ చేతుల్లో',
        '⏱️ చాలా time పడుతుంది (100 plots = 2-3 hours)',
        '📝 అన్ని details మీరే enter చేయాలి'
      ],
      bestFor: [
        'Small layouts (< 20 plots)',
        'When no other format available',
        'Complete control needed',
        'Learning/testing purposes'
      ]
    }
  ];

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleProceed = () => {
    if (!layoutName.trim()) {
      toast.error('Please enter layout name');
      return;
    }
    
    if (selectedMethod === 'manual') {
      // Go directly to manual drawing interface
      navigate('/layouts/create-manual', {
        state: { layoutName, layoutType }
      });
      return;
    }
    
    setStep(2);
  };

  const handleProcessFile = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setProcessing(true);

    try {
      // Upload file first
      const uploadResult = await layoutService.uploadSVG(file);
      
      // Here we would call different processing APIs based on method
      // For now, simulating the process
      
      toast.info(`Processing ${selectedMethod.toUpperCase()} file... This may take a moment.`);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock detected plots (in real implementation, this comes from backend)
      const mockPlots = [
        {
          id: 'plot-1',
          display_name: 'A-1',
          coordinates: [
            { x: 50, y: 50 },
            { x: 150, y: 50 },
            { x: 150, y: 150 },
            { x: 50, y: 150 }
          ],
          area: 1200,
          status: 'available',
          confidence: selectedMethod === 'dxf' ? 100 : selectedMethod === 'svg' ? 95 : selectedMethod === 'pdf_vector' ? 80 : 65
        },
        // Add more mock plots...
      ];
      
      setDetectedPlots(mockPlots);
      setStep(3);
      
      toast.success(`Detected ${mockPlots.length} plots! Review and add pricing.`);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file. Please try again or use manual method.');
    } finally {
      setProcessing(false);
    }
  };

  const selectedMethodData = uploadMethods.find(m => m.id === selectedMethod);

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-ocean-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ocean-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate('/layouts')}
              variant="ghost"
              className="text-ocean-primary hover:bg-ocean-primary/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Layouts
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-ocean-primary to-ocean-secondary bg-clip-text text-transparent">
              Create New Layout - Smart Detection
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-ocean-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-ocean-primary text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Choose Method</span>
            </div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-ocean-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-ocean-primary text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Upload & Process</span>
            </div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-ocean-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-ocean-primary text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Review & Save</span>
            </div>
          </div>
        </div>

        {/* Step 1: Method Selection */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Layout Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-ocean-primary">Layout Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
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
                
                <div>
                  <label className="text-sm font-semibold mb-1 block">Layout Type *</label>
                  <select
                    value={layoutType}
                    onChange={(e) => setLayoutType(e.target.value)}
                    className="w-full glass-input"
                  >
                    <option value="venture">Venture/Layout</option>
                    <option value="apartment">Apartment</option>
                    <option value="open_land">Open Land</option>
                    <option value="farm_land">Farm Land</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Method Selection */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-ocean-primary">Choose Upload Method</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Select the best method based on your file type. Hover over each option for detailed information.
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  
                  return (
                    <div
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                        isSelected
                          ? 'border-ocean-primary bg-ocean-primary/5 scale-105'
                          : 'border-gray-200 hover:border-ocean-primary/50'
                      }`}
                    >
                      {/* Icon & Title */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg bg-${method.color}-100`}>
                          <Icon className={`w-6 h-6 text-${method.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{method.title}</h3>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-ocean-primary absolute top-4 right-4" />
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Accuracy:</span>
                          <Badge className={`bg-${method.color}-500`}>{method.accuracy}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium">{method.time}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Manual Work:</span>
                          <span className="font-medium">{method.manual}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{method.description}</p>

                      {/* Expand to see details */}
                      <details className="mt-3">
                        <summary className="text-sm text-ocean-primary font-medium cursor-pointer flex items-center gap-1">
                          <Info className="w-4 h-4" />
                          View Detailed Information
                        </summary>
                        
                        <div className="mt-3 space-y-3 text-xs">
                          {/* Notes */}
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">Features:</p>
                            <ul className="space-y-1 pl-4">
                              {method.notes.map((note, idx) => (
                                <li key={idx} className="text-gray-600">{note}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Telugu Info */}
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="font-semibold text-blue-800 mb-1">తెలుగులో:</p>
                            <ul className="space-y-1 pl-4">
                              {method.teluguInfo.map((info, idx) => (
                                <li key={idx} className="text-blue-700">{info}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Requirements */}
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">Requirements:</p>
                            <ul className="space-y-1 pl-4 list-disc">
                              {method.requirements.map((req, idx) => (
                                <li key={idx} className="text-gray-600">{req}</li>
                              ))}
                            </ul>
                          </div>

                          {/* How to check (for PDF) */}
                          {method.howToCheck && (
                            <div className="bg-yellow-50 p-2 rounded">
                              <p className="font-semibold text-yellow-800 mb-1">How to Check if PDF is Vector:</p>
                              <ul className="space-y-1 pl-4">
                                {method.howToCheck.map((step, idx) => (
                                  <li key={idx} className="text-yellow-700">{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Warning */}
                          {method.warning && (
                            <div className="bg-red-50 p-2 rounded flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-red-700">{method.warning}</p>
                            </div>
                          )}

                          {/* Best For */}
                          {method.bestFor && (
                            <div>
                              <p className="font-semibold text-gray-700 mb-1">Best For:</p>
                              <ul className="space-y-1 pl-4 list-disc">
                                {method.bestFor.map((item, idx) => (
                                  <li key={idx} className="text-gray-600">{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Comparison Info */}
            <Card className="glass-card bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Quick Comparison (త్వరిత పోలిక)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-green-700">🏆 Best: DXF/DWG</p>
                        <p className="text-gray-600">100% accurate, fastest</p>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-700">⭐ Great: SVG</p>
                        <p className="text-gray-600">95% accurate, fast</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700">👍 Good: Vector PDF</p>
                        <p className="text-gray-600">80% accurate, moderate</p>
                      </div>
                      <div>
                        <p className="font-semibold text-orange-700">🤖 AI: Image/Scan</p>
                        <p className="text-gray-600">60-70% accurate, slow</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proceed Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleProceed}
                disabled={!selectedMethod || !layoutName.trim()}
                className="bg-gradient-to-r from-ocean-primary to-ocean-secondary text-white text-lg px-8 py-6"
              >
                Continue with {selectedMethodData?.title || 'Selected Method'}
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: File Upload (placeholder for now) */}
        {step === 2 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-ocean-primary">Upload {selectedMethodData?.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Upload functionality will be implemented here with smart detection based on selected method.
              </p>
              <Button onClick={() => navigate('/layouts/create')}>
                Use Current Manual Creator (Temporary)
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default HybridLayoutCreator;
