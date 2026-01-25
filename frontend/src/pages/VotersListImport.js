import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileUp, MapPin, Hash, Trash2, RefreshCw, 
  CheckCircle, XCircle, AlertTriangle, Users, Database,
  ArrowLeft, FileText, Loader2, Eye, Link, Settings, Shield
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VotersListImport = () => {
  const navigate = useNavigate();
  
  // Form state
  const [village, setVillage] = useState('Aliyabad');
  const [wardNo, setWardNo] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [useUrlImport, setUseUrlImport] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Data state
  const [wards, setWards] = useState([]);
  const [stats, setStats] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [incompleteStats, setIncompleteStats] = useState(null);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await fetch(`${API_URL}/api/voters/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
      
      // Also fetch incomplete stats
      const incompleteRes = await fetch(`${API_URL}/api/voters/incomplete-stats?village=${encodeURIComponent(village)}`);
      const incompleteData = await incompleteRes.json();
      if (incompleteData.success) {
        setIncompleteStats(incompleteData.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [village]);

  // Fetch wards
  const fetchWards = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/voters/wards?village=${encodeURIComponent(village)}`);
      const data = await response.json();
      if (data.success) {
        setWards(data.wards || []);
      }
    } catch (error) {
      console.error('Failed to fetch wards:', error);
    }
  }, [village]);

  useEffect(() => {
    fetchStats();
    fetchWards();
  }, [fetchStats, fetchWards]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Please select a PDF file');
        return;
      }
      
      // Check file size - warn if > 15MB
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > 15) {
        toast.warning(`Large file (${fileSizeMB.toFixed(1)} MB) - Use "From URL" for better reliability`, {
          duration: 8000
        });
      }
      
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!village.trim()) {
      toast.error('Please enter village name');
      return;
    }
    if (!wardNo.trim()) {
      toast.error('Please enter ward number');
      return;
    }
    if (!useUrlImport && !selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }
    if (useUrlImport && !pdfUrl.trim()) {
      toast.error('Please enter PDF URL');
      return;
    }
    
    // Block direct upload for files > 25MB
    if (!useUrlImport && selectedFile) {
      const fileSizeMB = selectedFile.size / 1024 / 1024;
      if (fileSizeMB > 25) {
        toast.error(`File too large (${fileSizeMB.toFixed(1)} MB). Please use "From URL" option for files over 25MB.`);
        setUseUrlImport(true);
        return;
      }
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      let response;

      if (useUrlImport) {
        response = await fetch(`${API_URL}/api/voters/import-from-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: pdfUrl.trim(),
            village: village.trim(),
            ward_no: parseInt(wardNo.trim()),
            replace_existing: replaceExisting
          })
        });
      } else {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('village', village.trim());
        formData.append('ward_no', wardNo.trim());
        formData.append('replace_existing', replaceExisting);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000);

        response = await fetch(`${API_URL}/api/voters/upload-pdf`, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setUploadResult(data);

      if (data.success) {
        toast.success(`Imported ${data.extracted_count} voters for Ward ${wardNo}!`);
        setSelectedFile(null);
        setPdfUrl('');
        const fileInput = document.getElementById('ward-pdf-input');
        if (fileInput) fileInput.value = '';
        fetchStats();
        fetchWards();
      } else {
        toast.error(data.message || 'Import failed');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Upload timed out. Try "Import from URL" for large files.');
      } else if (error.message === 'Failed to fetch') {
        toast.error('Network error. Try "Import from URL" for large files.');
      } else {
        toast.error('Failed: ' + error.message);
      }
      setUploadResult({ success: false, message: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle delete ward
  const handleDeleteWard = async (wardNumber) => {
    if (!window.confirm(`Delete all voters from Ward ${wardNumber}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/voters/clear?village=${encodeURIComponent(village)}&ward_no=${wardNumber}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(`Deleted ${data.deleted_count} voters from Ward ${wardNumber}`);
        fetchStats();
        fetchWards();
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 py-4 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-indigo-400" />
                  Ward-wise Voters Import
                </h1>
                <p className="text-slate-400 text-sm">Import voter data by ward</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => navigate('/voters-bulk-update')}
              >
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" />
                Fix Missing Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => navigate('/voters-admin')}
              >
                <Shield className="w-4 h-4 mr-2 text-amber-400" />
                Admin Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total Voters</p>
                  <p className="text-2xl font-bold text-white">
                    {loadingStats ? '...' : (stats?.total || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Hash className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Wards</p>
                  <p className="text-2xl font-bold text-white">{wards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Male</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.male?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Female</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.female?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Incomplete Records Card */}
          <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => navigate('/voters-bulk-update')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Incomplete</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {incompleteStats?.incomplete || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Import Form */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                Import Ward Data
              </CardTitle>
              <CardDescription className="text-slate-400">
                Upload PDF or import from URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Village Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Village Name
                </label>
                <Input
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="Enter village name"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Ward Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Ward Number *
                </label>
                <Input
                  type="number"
                  value={wardNo}
                  onChange={(e) => setWardNo(e.target.value)}
                  placeholder="e.g., 1, 2, 13"
                  min="1"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Import Method Toggle */}
              <div className="flex gap-2 p-1 bg-slate-700/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUseUrlImport(false)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    !useUrlImport 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUseUrlImport(true)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    useUrlImport 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  From URL
                </button>
              </div>

              {/* File Upload or URL */}
              {!useUrlImport ? (
                <div>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors cursor-pointer"
                       onClick={() => document.getElementById('ward-pdf-input').click()}>
                    <input
                      id="ward-pdf-input"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-indigo-400" />
                          <div className="text-left">
                            <p className="font-medium text-white">{selectedFile.name}</p>
                            <p className={`text-sm ${selectedFile.size / 1024 / 1024 > 15 ? 'text-amber-400' : 'text-slate-400'}`}>
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              {selectedFile.size / 1024 / 1024 > 15 && ' (Large file)'}
                            </p>
                          </div>
                        </div>
                        {selectedFile.size / 1024 / 1024 > 15 && (
                          <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 px-3 py-1.5 rounded-lg mt-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Large file may timeout. Use &quot;From URL&quot; for reliability.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <FileUp className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                        <p className="text-slate-400">Click to select PDF</p>
                        <p className="text-xs text-slate-500 mt-1">Max 25MB direct upload. Use URL for larger files.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <Input
                    placeholder="https://example.com/ward-voters.pdf"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">Direct link to PDF file</p>
                </div>
              )}

              {/* Replace Option */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="replace-ward"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-600"
                />
                <label htmlFor="replace-ward" className="text-sm text-slate-300">
                  Replace existing data for this ward
                </label>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading || !wardNo || (!useUrlImport && !selectedFile) || (useUrlImport && !pdfUrl)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing Ward {wardNo}...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Ward {wardNo || '?'} Voters
                  </>
                )}
              </Button>

              {/* Upload Result */}
              {uploadResult && (
                <div className={`p-4 rounded-lg ${uploadResult.success ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                  <div className="flex items-start gap-3">
                    {uploadResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${uploadResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {uploadResult.message}
                      </p>
                      {uploadResult.extracted_count !== undefined && (
                        <div className="text-sm text-slate-400 mt-2 space-y-1">
                          <p>Extracted: <span className="text-white">{uploadResult.extracted_count}</span> voters</p>
                          {uploadResult.skipped_count > 0 && (
                            <p>Skipped: <span className="text-amber-400">{uploadResult.skipped_count}</span> duplicates</p>
                          )}
                          {uploadResult.metadata?.total_pages && (
                            <p>Pages processed: <span className="text-white">{uploadResult.metadata.total_pages}</span></p>
                          )}
                        </div>
                      )}
                      {uploadResult.success && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 border-green-500/30 text-green-400 hover:bg-green-500/20"
                          onClick={() => navigate(`/voters-bulk-update?ward=${wardNo}`)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Check Incomplete Records
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ward List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-400" />
                  Imported Wards
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { fetchStats(); fetchWards(); }}
                  className="text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
              <CardDescription className="text-slate-400">
                {village} - {wards.length} ward(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wards.length > 0 ? (
                <div className="space-y-3">
                  {wards.map((ward) => (
                    <div
                      key={ward.ward_no}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-indigo-400">{ward.ward_no}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">Ward {ward.ward_no}</p>
                          <p className="text-sm text-slate-400">{ward.voter_count.toLocaleString()} voters</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                          onClick={() => navigate(`/voters-bulk-update?ward=${ward.ward_no}`)}
                          title="Check incomplete records"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white hover:bg-slate-600"
                          onClick={() => navigate(`/voterslist/${village.toLowerCase()}/ward/${ward.ward_no}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={() => handleDeleteWard(ward.ward_no)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">No wards imported yet</p>
                  <p className="text-sm text-slate-500">Upload a ward PDF to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Guide */}
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-1">Quick Guide</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Enter ward number and upload the PDF for that ward</li>
                  <li>For large files (&gt;20MB), use "From URL" option</li>
                  <li>Check "Replace existing" to overwrite previous data</li>
                  <li>After import, click <span className="text-amber-400">Check Incomplete Records</span> to view missing data</li>
                  <li>Use <span className="text-amber-400">Admin Settings</span> to enable/disable ward visibility and export</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VotersListImport;
