import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trash2, Edit, Users, MapPin, TrendingUp, RefreshCw } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const WorkforceManagement = () => {
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scrapeForm, setScrapeForm] = useState({
    skill_type: 'all', // Changed to 'all' by default
    location: '',
    limit: 10
  });
  const [skillTypes, setSkillTypes] = useState([]);
  const [scraping, setScraping] = useState(false);
  const locationInputRef = React.useRef(null);
  const autocompleteRef = React.useRef(null);

  useEffect(() => {
    fetchData();
    fetchSkillTypes();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [pendingRes, statsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/workforce/admin/pending`, { headers }),
        axios.get(`${BACKEND_URL}/api/workforce/stats`)
      ]);

      setPendingWorkers(pendingRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching workforce data:', error);
      if (error.response?.status === 403) {
        alert('Access denied. Only SaaS Admin can access this page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillTypes = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/workforce/skills`);
      setSkillTypes(response.data);
    } catch (error) {
      console.error('Error fetching skill types:', error);
    }
  };

  const handleApprove = async (workerId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/workforce/admin/${workerId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Worker approved successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to approve worker');
      console.error(error);
    }
  };

  const handleReject = async (workerId) => {
    if (!window.confirm('Are you sure you want to reject this worker?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${BACKEND_URL}/api/workforce/admin/${workerId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Worker rejected');
      fetchData();
    } catch (error) {
      alert('Failed to reject worker');
      console.error(error);
    }
  };

  const handleDelete = async (workerId) => {
    if (!window.confirm('Are you sure you want to delete this worker permanently?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${BACKEND_URL}/api/workforce/admin/${workerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Worker deleted successfully');
      fetchData();
    } catch (error) {
      alert('Failed to delete worker');
      console.error(error);
    }
  };

  const handleAIScrape = async (e) => {
    e.preventDefault();
    
    if (!scrapeForm.skill_type || !scrapeForm.location) {
      alert('Please fill all required fields');
      return;
    }

    setScraping(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/workforce/admin/scrape`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: scrapeForm
        }
      );
      
      alert(response.data.message);
      
      // Refresh data after a delay to show newly added workers
      setTimeout(() => {
        fetchData();
      }, 3000);
      
      // Reset form
      setScrapeForm({ skill_type: '', location: '', limit: 10 });
    } catch (error) {
      alert('AI scraping failed: ' + (error.response?.data?.detail || 'Unknown error'));
      console.error(error);
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workforce Management</h1>
          <p className="text-gray-600">Manage construction skilled workforce directory</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Workers</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total_approved_workers}</p>
                </div>
                <Users className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pending_approval}</p>
                </div>
                <RefreshCw className="w-12 h-12 text-orange-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Skill Types</p>
                  <p className="text-3xl font-bold text-green-600">{stats.by_skill.length}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cities Covered</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.by_city.length}</p>
                </div>
                <MapPin className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* AI Scraping Tool */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            AI-Powered Workforce Aggregation
          </h2>
          <p className="mb-4 opacity-90">Use AI to automatically find and add construction workers from public sources</p>
          
          <form onSubmit={handleAIScrape} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-1 opacity-90">Skill Type *</label>
              <select
                value={scrapeForm.skill_type}
                onChange={(e) => setScrapeForm({ ...scrapeForm, skill_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-gray-900"
                required
              >
                <option value="">Select Skill</option>
                {skillTypes.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 opacity-90">Location *</label>
              <input
                type="text"
                value={scrapeForm.location}
                onChange={(e) => setScrapeForm({ ...scrapeForm, location: e.target.value })}
                placeholder="City name"
                className="w-full px-3 py-2 rounded-lg text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1 opacity-90">Limit</label>
              <input
                type="number"
                min="1"
                max="50"
                value={scrapeForm.limit}
                onChange={(e) => setScrapeForm({ ...scrapeForm, limit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-gray-900"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={scraping}
                className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scraping ? 'Scraping...' : 'Start AI Scraping'}
              </button>
            </div>
          </form>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : pendingWorkers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No pending approvals
                    </td>
                  </tr>
                ) : (
                  pendingWorkers.map(worker => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{worker.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(worker.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {worker.skill_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p>{worker.phone}</p>
                        {worker.whatsapp && <p className="text-gray-500">WA: {worker.whatsapp}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p>{worker.location.city}</p>
                        <p className="text-gray-500">{worker.location.state}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {worker.experience_years && <p>Exp: {worker.experience_years} yrs</p>}
                        {worker.daily_rate && <p className="text-green-600">₹{worker.daily_rate}/day</p>}
                        {worker.work_type && <p className="text-gray-500">{worker.work_type}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          worker.source === 'ai_scraped' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {worker.source === 'ai_scraped' ? 'AI Scraped' : 'User Submitted'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(worker.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(worker.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(worker.id)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats by Skill */}
        {stats && stats.by_skill.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Workers by Skill Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.by_skill.map(item => (
                <div key={item.skill} className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">{item.skill}</p>
                  <p className="text-2xl font-bold text-blue-600">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats by City */}
        {stats && stats.by_city.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Cities</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats.by_city.map(item => (
                <div key={item.city} className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">{item.city}</p>
                  <p className="text-2xl font-bold text-green-600">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkforceManagement;
