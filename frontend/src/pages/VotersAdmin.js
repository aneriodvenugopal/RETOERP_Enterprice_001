import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Shield, Eye, EyeOff, Download, XCircle, 
  Users, MapPin, Hash, RefreshCw, ArrowLeft, Save,
  AlertTriangle, CheckCircle, Lock, Unlock, Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VotersAdmin = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wards, setWards] = useState([]);
  const [wardSettings, setWardSettings] = useState({});
  const [stats, setStats] = useState(null);

  // Fetch ward data and settings
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch wards
      const wardsRes = await fetch(`${API_URL}/api/voters/wards?village=aliyabad`);
      const wardsData = await wardsRes.json();
      
      // Fetch settings
      const settingsRes = await fetch(`${API_URL}/api/voters/admin/settings`);
      const settingsData = await settingsRes.json();
      
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/api/voters/stats`);
      const statsData = await statsRes.json();
      
      if (wardsData.success) {
        setWards(wardsData.wards || []);
      }
      
      if (settingsData.success) {
        setWardSettings(settingsData.settings || {});
      }
      
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle ward visibility
  const toggleWardVisibility = async (wardNo) => {
    const currentSetting = wardSettings[wardNo] || { visible: true, export_enabled: true };
    const newVisible = !currentSetting.visible;
    
    setWardSettings(prev => ({
      ...prev,
      [wardNo]: { ...currentSetting, visible: newVisible }
    }));
    
    try {
      const response = await fetch(`${API_URL}/api/voters/admin/ward-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ward_no: wardNo,
          visible: newVisible,
          export_enabled: currentSetting.export_enabled
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`Ward ${wardNo} ${newVisible ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      toast.error('Failed to update setting');
      // Revert on error
      setWardSettings(prev => ({
        ...prev,
        [wardNo]: currentSetting
      }));
    }
  };

  // Toggle ward export
  const toggleWardExport = async (wardNo) => {
    const currentSetting = wardSettings[wardNo] || { visible: true, export_enabled: true };
    const newExportEnabled = !currentSetting.export_enabled;
    
    setWardSettings(prev => ({
      ...prev,
      [wardNo]: { ...currentSetting, export_enabled: newExportEnabled }
    }));
    
    try {
      const response = await fetch(`${API_URL}/api/voters/admin/ward-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ward_no: wardNo,
          visible: currentSetting.visible,
          export_enabled: newExportEnabled
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`Ward ${wardNo} export ${newExportEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      toast.error('Failed to update setting');
      setWardSettings(prev => ({
        ...prev,
        [wardNo]: currentSetting
      }));
    }
  };

  // Delete ward data
  const deleteWard = async (wardNo) => {
    if (!window.confirm(`Are you sure you want to DELETE ALL VOTERS from Ward ${wardNo}? This cannot be undone!`)) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/voters/clear?village=aliyabad&ward_no=${wardNo}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`Deleted ${data.deleted_count} voters from Ward ${wardNo}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete ward data');
    }
  };

  const getWardSetting = (wardNo) => {
    return wardSettings[wardNo] || { visible: true, export_enabled: true };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

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
                  <Shield className="w-6 h-6 text-amber-400" />
                  Voters Admin Settings
                </h1>
                <p className="text-slate-400 text-sm">Manage ward visibility and export permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => navigate('/voters-bulk-update')}
              >
                <Users className="w-4 h-4 mr-2" />
                Bulk Update
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={fetchData}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total Voters</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.total?.toLocaleString() || 0}
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
                  <p className="text-slate-400 text-xs">Total Wards</p>
                  <p className="text-2xl font-bold text-white">{wards.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Visible Wards</p>
                  <p className="text-2xl font-bold text-white">
                    {wards.filter(w => getWardSetting(w.ward_no).visible).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Export Enabled</p>
                  <p className="text-2xl font-bold text-white">
                    {wards.filter(w => getWardSetting(w.ward_no).export_enabled).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ward Settings Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Ward Settings
            </CardTitle>
            <CardDescription className="text-slate-400">
              Control visibility and export permissions for each ward
            </CardDescription>
          </CardHeader>
          <CardContent>
            {wards.length > 0 ? (
              <div className="space-y-3">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <div className="col-span-2">Ward</div>
                  <div className="col-span-2">Voters</div>
                  <div className="col-span-2 text-center">Show List</div>
                  <div className="col-span-2 text-center">Enable Export</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-2 text-center">Actions</div>
                </div>
                
                {wards.map((ward) => {
                  const setting = getWardSetting(ward.ward_no);
                  return (
                    <div
                      key={ward.ward_no}
                      className={`grid grid-cols-12 gap-4 p-4 rounded-lg border transition-colors ${
                        setting.visible 
                          ? 'bg-slate-700/30 border-slate-600' 
                          : 'bg-slate-800/50 border-slate-700 opacity-60'
                      }`}
                    >
                      {/* Ward Number */}
                      <div className="col-span-2 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          setting.visible ? 'bg-indigo-500/20' : 'bg-slate-600/50'
                        }`}>
                          <span className={`text-lg font-bold ${setting.visible ? 'text-indigo-400' : 'text-slate-500'}`}>
                            {ward.ward_no}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">Ward {ward.ward_no}</p>
                        </div>
                      </div>
                      
                      {/* Voter Count */}
                      <div className="col-span-2 flex items-center">
                        <span className="text-slate-300">{ward.voter_count?.toLocaleString()} voters</span>
                      </div>
                      
                      {/* Visibility Toggle */}
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          onClick={() => toggleWardVisibility(ward.ward_no)}
                          className={`p-2 rounded-lg transition-colors ${
                            setting.visible 
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                              : 'bg-slate-600/50 text-slate-500 hover:bg-slate-600'
                          }`}
                          title={setting.visible ? 'Click to hide' : 'Click to show'}
                        >
                          {setting.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      {/* Export Toggle */}
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          onClick={() => toggleWardExport(ward.ward_no)}
                          className={`p-2 rounded-lg transition-colors ${
                            setting.export_enabled 
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                              : 'bg-slate-600/50 text-slate-500 hover:bg-slate-600'
                          }`}
                          title={setting.export_enabled ? 'Click to disable export' : 'Click to enable export'}
                        >
                          {setting.export_enabled ? <Download className="w-5 h-5" /> : <DownloadOff className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      {/* Status */}
                      <div className="col-span-2 flex items-center justify-center">
                        {setting.visible ? (
                          <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                            <Unlock className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-600/50 px-2 py-1 rounded-full">
                            <Lock className="w-3 h-3" />
                            Hidden
                          </span>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white hover:bg-slate-600"
                          onClick={() => navigate(`/voterslist/aliyabad/ward/${ward.ward_no}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          onClick={() => deleteWard(ward.ward_no)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">No wards found</p>
                <p className="text-sm text-slate-500">Import voter data to see wards here</p>
                <Button
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => navigate('/voterslist-import')}
                >
                  Import Voters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-2">Admin Controls</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Show List:</strong> Toggle to show/hide ward from regular users</li>
                  <li><strong>Enable Export:</strong> Toggle to allow/block Excel export for the ward</li>
                  <li>Hidden wards are only visible to admins</li>
                  <li>Users assigned to a ward can only see their ward&apos;s data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VotersAdmin;
