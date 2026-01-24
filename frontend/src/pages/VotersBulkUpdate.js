import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, AlertTriangle, Check, X, Edit2, Save, ArrowLeft, 
  RefreshCw, Filter, Hash, MapPin, Plus, Trash2, FileSpreadsheet,
  Download, Upload
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Add/Edit Voter Modal
const VoterModal = ({ isOpen, onClose, voter, village, wardNo, onSave }) => {
  const [formData, setFormData] = useState({
    epic_no: '',
    name: '',
    father_husband_name: '',
    age: '',
    gender: '',
    house_number: '',
    sl_no: '',
    mobile_number: ''
  });
  const [saving, setSaving] = useState(false);
  const isEdit = !!voter?.epic_no;

  useEffect(() => {
    if (voter) {
      setFormData({
        epic_no: voter.epic_no || '',
        name: voter.name || '',
        father_husband_name: voter.father_husband_name || '',
        age: voter.age || '',
        gender: voter.gender || '',
        house_number: voter.house_number || '',
        sl_no: voter.sl_no || '',
        mobile_number: voter.mobile_number || ''
      });
    } else {
      setFormData({
        epic_no: '',
        name: '',
        father_husband_name: '',
        age: '',
        gender: '',
        house_number: '',
        sl_no: '',
        mobile_number: ''
      });
    }
  }, [voter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.epic_no.trim()) {
      toast.error('EPIC Number is required');
      return;
    }

    setSaving(true);
    try {
      let response;
      
      if (isEdit) {
        // Update existing voter
        response = await fetch(`${API_URL}/api/voters/update-full/${formData.epic_no}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            village,
            ward_no: wardNo
          })
        });
      } else {
        // Add new voter
        response = await fetch(`${API_URL}/api/voters/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            village,
            ward_no: wardNo
          })
        });
      }

      const data = await response.json();
      if (data.success) {
        toast.success(isEdit ? 'Voter updated' : 'Voter added');
        onSave(data.voter);
        onClose();
      } else {
        toast.error(data.detail || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save voter');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="p-6 border-b border-slate-700 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isEdit ? <Edit2 className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-green-400" />}
            {isEdit ? 'Edit Voter' : 'Add New Voter'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {village} - Ward {wardNo}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">EPIC Number *</label>
              <Input
                value={formData.epic_no}
                onChange={(e) => setFormData(prev => ({ ...prev, epic_no: e.target.value.toUpperCase() }))}
                placeholder="e.g., YAV1234567"
                className="bg-slate-700/50 border-slate-600 text-white font-mono"
                disabled={isEdit}
                autoFocus={!isEdit}
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Father/Husband Name</label>
              <Input
                value={formData.father_husband_name}
                onChange={(e) => setFormData(prev => ({ ...prev, father_husband_name: e.target.value }))}
                placeholder="Father or Husband name"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Age</label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                placeholder="Age"
                min="18"
                max="120"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Gender</label>
              <Select value={formData.gender} onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v }))}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">House No</label>
              <Input
                value={formData.house_number}
                onChange={(e) => setFormData(prev => ({ ...prev, house_number: e.target.value }))}
                placeholder="e.g., 1-123"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">SL No</label>
              <Input
                type="number"
                value={formData.sl_no}
                onChange={(e) => setFormData(prev => ({ ...prev, sl_no: e.target.value }))}
                placeholder="Serial No"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Mobile Number</label>
              <Input
                type="tel"
                value={formData.mobile_number}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="10-digit mobile"
                maxLength={10}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              disabled={saving}
            >
              {saving ? 'Saving...' : (isEdit ? 'Update Voter' : 'Add Voter')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VotersBulkUpdate = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [loading, setLoading] = useState(true);
  const [voters, setVoters] = useState([]);
  const [wards, setWards] = useState([]);
  const [stats, setStats] = useState(null);
  const [incompleteStats, setIncompleteStats] = useState(null);
  
  // Filters
  const [village, setVillage] = useState(searchParams.get('village') || 'aliyabad');
  const [selectedWard, setSelectedWard] = useState(searchParams.get('ward') || 'all');
  const [filterType, setFilterType] = useState(searchParams.get('filter') || 'incomplete');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVoters, setTotalVoters] = useState(0);
  const limit = 50;

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

  // Fetch incomplete stats
  const fetchIncompleteStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/voters/incomplete-stats?village=${encodeURIComponent(village)}${selectedWard !== 'all' ? `&ward=${selectedWard}` : ''}`);
      const data = await response.json();
      if (data.success) {
        setIncompleteStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch incomplete stats:', error);
    }
  }, [village, selectedWard]);

  // Fetch voters
  const fetchVoters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('village', village);
      if (selectedWard !== 'all') params.append('ward', selectedWard);
      params.append('filter_type', filterType);
      params.append('page', currentPage);
      params.append('limit', limit);

      const response = await fetch(`${API_URL}/api/voters/list-with-status?${params}`);
      const data = await response.json();

      if (data.success) {
        setVoters(data.data);
        setTotalPages(data.pagination.total_pages);
        setTotalVoters(data.pagination.total);
        setStats(data.summary);
      }
    } catch (error) {
      toast.error('Failed to fetch voters');
    } finally {
      setLoading(false);
    }
  }, [village, selectedWard, filterType, currentPage]);

  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  useEffect(() => {
    fetchVoters();
    fetchIncompleteStats();
  }, [fetchVoters, fetchIncompleteStats]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (village !== 'aliyabad') params.set('village', village);
    if (selectedWard !== 'all') params.set('ward', selectedWard);
    if (filterType !== 'incomplete') params.set('filter', filterType);
    setSearchParams(params);
  }, [village, selectedWard, filterType, setSearchParams]);

  // Handle edit
  const handleEdit = (voter) => {
    setEditingVoter(voter);
    setModalOpen(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingVoter(null);
    setModalOpen(true);
  };

  // Handle save from modal
  const handleSaveVoter = (savedVoter) => {
    if (editingVoter) {
      // Update in list
      setVoters(prev => prev.map(v => v.epic_no === savedVoter.epic_no ? savedVoter : v));
    } else {
      // Add to list
      setVoters(prev => [savedVoter, ...prev]);
    }
    fetchIncompleteStats();
  };

  // Get completeness indicator
  const getCompleteness = (voter) => {
    const fields = ['name', 'father_husband_name', 'age', 'gender', 'house_number'];
    const filled = fields.filter(f => voter[f] && voter[f] !== '').length;
    const total = fields.length;
    const percentage = Math.round((filled / total) * 100);
    
    if (percentage === 100) return { status: 'complete', color: 'green', text: 'Complete' };
    if (percentage >= 60) return { status: 'partial', color: 'yellow', text: 'Partial' };
    return { status: 'incomplete', color: 'red', text: 'Incomplete' };
  };

  // Get missing fields for a voter
  const getMissingFields = (voter) => {
    const fieldLabels = {
      name: 'Name',
      father_husband_name: 'Father/Husband',
      age: 'Age',
      gender: 'Gender',
      house_number: 'House No'
    };
    
    return Object.entries(fieldLabels)
      .filter(([key]) => !voter[key] || voter[key] === '')
      .map(([, label]) => label);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Modal */}
      <VoterModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        voter={editingVoter}
        village={village}
        wardNo={selectedWard !== 'all' ? selectedWard : '1'}
        onSave={handleSaveVoter}
      />

      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
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
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                  Bulk Update - Missing Records
                </h1>
                <p className="text-slate-400 text-sm">View and update incomplete voter records</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleAddNew}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Voter
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => navigate('/voters-admin')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Admin Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Total</p>
                  <p className="text-xl font-bold text-white">{incompleteStats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Complete</p>
                  <p className="text-xl font-bold text-white">{incompleteStats?.complete || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Partial</p>
                  <p className="text-xl font-bold text-white">{incompleteStats?.partial || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Incomplete</p>
                  <p className="text-xl font-bold text-white">{incompleteStats?.incomplete || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Hash className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">No Name</p>
                  <p className="text-xl font-bold text-white">{incompleteStats?.missing_name || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Ward Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Ward:</span>
                <Select value={selectedWard} onValueChange={setSelectedWard}>
                  <SelectTrigger className="w-[120px] bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="All Wards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    {wards.map(w => (
                      <SelectItem key={w.ward_no} value={String(w.ward_no)}>Ward {w.ward_no}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Type */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Show:</span>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px] bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Records</SelectItem>
                    <SelectItem value="incomplete">Incomplete Only</SelectItem>
                    <SelectItem value="complete">Complete Only</SelectItem>
                    <SelectItem value="missing_name">Missing Name</SelectItem>
                    <SelectItem value="missing_age">Missing Age</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => { fetchVoters(); fetchIncompleteStats(); }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              <div className="ml-auto text-sm text-slate-400">
                Showing <span className="text-white font-semibold">{voters.length}</span> of{' '}
                <span className="text-white font-semibold">{totalVoters}</span> records
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voters Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">EPIC No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Father/Husband</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">House No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Ward</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Missing</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading voters...
                    </td>
                  </tr>
                ) : voters.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-slate-400">
                      <Check className="w-12 h-12 mx-auto mb-2 text-green-400" />
                      No {filterType === 'incomplete' ? 'incomplete' : ''} records found
                    </td>
                  </tr>
                ) : (
                  voters.map((voter, index) => {
                    const completeness = getCompleteness(voter);
                    const missingFields = getMissingFields(voter);
                    
                    return (
                      <tr key={voter.epic_no || index} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            completeness.color === 'green' ? 'bg-green-500/20 text-green-400' :
                            completeness.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {completeness.color === 'green' ? <Check className="w-3 h-3" /> :
                             completeness.color === 'yellow' ? <AlertTriangle className="w-3 h-3" /> :
                             <X className="w-3 h-3" />}
                            {completeness.text}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-blue-400">{voter.epic_no}</td>
                        <td className="px-4 py-3 text-sm text-white font-medium">
                          {voter.name || <span className="text-red-400 italic">Missing</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {voter.father_husband_name || <span className="text-slate-500">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {voter.age || <span className="text-slate-500">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {voter.gender ? (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              voter.gender === 'M' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                            }`}>
                              {voter.gender === 'M' ? 'Male' : 'Female'}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {voter.house_number || <span className="text-slate-500">-</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">{voter.ward_no}</td>
                        <td className="px-4 py-3 text-xs text-red-400">
                          {missingFields.length > 0 ? missingFields.join(', ') : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20"
                            onClick={() => handleEdit(voter)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Help Section */}
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-400">
                <p className="font-medium text-slate-300 mb-2">How to use Bulk Update</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Select ward to filter records for that ward</li>
                  <li>Use "Show" filter to find incomplete records</li>
                  <li>Click Edit icon to update missing fields</li>
                  <li>Click "Add Voter" to manually add missing voters</li>
                  <li>Required fields: Village, Ward, EPIC No.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VotersBulkUpdate;
