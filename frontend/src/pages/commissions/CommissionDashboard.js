import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, CheckCircle, XCircle, Clock, 
  Eye, ThumbsUp, ThumbsDown, PauseCircle, Wallet, BarChart3
} from 'lucide-react';
import apiInstance from '../../services/api';
import { toast } from 'sonner';
import PageInfoModal from '../../components/PageInfoModal';

const CommissionDashboard = () => {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [tenantId, setTenantId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Summary stats
  const [summary, setSummary] = useState({
    total_earnings: 0,
    by_status: {},
    by_type: {}
  });

  useEffect(() => {
    initializeComponent();
  }, []);

  useEffect(() => {
    if (tenantId && currentUser) {
      fetchEarnings();
    }
  }, [filterStatus, filterType, tenantId, currentUser]);

  const initializeComponent = async () => {
    try {
      const userResponse = await apiInstance.get('/user/me');
      const user = userResponse.data;
      setCurrentUser(user);
      
      const currentTenantId = user.tenant_id || localStorage.getItem('tenant_id');
      setTenantId(currentTenantId);
      
      const adminRoles = ['tenant_admin', 'super_admin'];
      setIsAdmin(adminRoles.includes(user.role));
      
    } catch (error) {
      console.error('Error initializing:', error);
      toast.error('Failed to initialize commission dashboard');
    }
  };

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const params = { tenant_id: tenantId, limit: 100 };
      
      if (!isAdmin && currentUser) {
        params.staff_id = currentUser.id;
      }
      
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterType !== 'all') params.commission_type = filterType;
      
      const response = await apiInstance.get('/commissions/earnings', { params });
      setEarnings(response.data.earnings || []);
      
      if (currentUser && !isAdmin) {
        fetchSummary();
      }
      
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load commission earnings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      if (currentUser) {
        const response = await apiInstance.get(`/commissions/staff/${currentUser.id}/summary`, {
          params: { tenant_id: tenantId }
        });
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleApprove = async (earningId, action) => {
    if (!isAdmin) {
      toast.error('Only admins can approve commissions');
      return;
    }

    try {
      setLoading(true);
      const response = await apiInstance.post(`/commissions/earnings/${earningId}/approve`, {
        action,
        notes: ''
      });
      
      if (response.data.success) {
        const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'put on hold';
        toast.success(`Commission ${actionText} successfully`);
        fetchEarnings();
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error(error.response?.data?.detail || 'Failed to update commission');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (earningId) => {
    try {
      const response = await apiInstance.get(`/commissions/earnings/${earningId}`);
      setSelectedEarning(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching earning details:', error);
      toast.error('Failed to load commission details');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: <Clock size={14} />, label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800 border-green-300', icon: <CheckCircle size={14} />, label: 'Approved' },
      paid: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <Wallet size={14} />, label: 'Paid' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-300', icon: <XCircle size={14} />, label: 'Cancelled' },
      on_hold: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: <PauseCircle size={14} />, label: 'On Hold' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getCommissionTypeBadge = (type) => {
    const badges = {
      direct: { color: 'bg-purple-100 text-purple-800', icon: <TrendingUp size={14} />, label: 'Direct' },
      gap: { color: 'bg-indigo-100 text-indigo-800', icon: <Users size={14} />, label: 'Gap' }
    };
    const badge = badges[type] || badges.direct;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="text-green-600" size={36} />
                Commission Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                {isAdmin ? 'Manage and approve commission earnings' : 'View your commission earnings'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {!isAdmin && summary.by_status && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100">Total Earnings</p>
                  <p className="text-2xl font-bold mt-1">{summary.total_earnings || 0}</p>
                </div>
                <BarChart3 size={32} className="text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-100">Pending</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{(summary.by_status?.pending?.total_net || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <Clock size={32} className="text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100">Approved</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{(summary.by_status?.approved?.total_net || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <CheckCircle size={32} className="text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Paid</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{(summary.by_status?.paid?.total_net || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <Wallet size={32} className="text-blue-200" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'paid', 'cancelled', 'on_hold'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'direct', 'gap'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterType === type
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">TDS (5%)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : earnings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      No commission earnings found
                    </td>
                  </tr>
                ) : (
                  earnings.map((earning) => (
                    <tr key={earning.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(earning.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{earning.staff_name || 'N/A'}</div>
                        {earning.commission_type === 'gap' && (
                          <div className="text-xs text-gray-500">From: {earning.sales_staff_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCommissionTypeBadge(earning.commission_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ₹{(earning.payment_received || 0).toLocaleString('en-IN')}
                        <div className="text-xs text-gray-400">{earning.commission_percentage}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{(earning.commission_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        ₹{(earning.tds_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        ₹{(earning.net_commission || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(earning.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewDetails(earning.id)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {isAdmin && earning.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(earning.id, 'approve')}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Approve"
                              >
                                <ThumbsUp size={18} />
                              </button>
                              <button
                                onClick={() => handleApprove(earning.id, 'reject')}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Reject"
                              >
                                <ThumbsDown size={18} />
                              </button>
                              <button
                                onClick={() => handleApprove(earning.id, 'hold')}
                                className="text-gray-600 hover:text-gray-800 p-1"
                                title="Hold"
                              >
                                <PauseCircle size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedEarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
              <h2 className="text-2xl font-bold text-white">Commission Details</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Staff Name</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedEarning.earning?.staff_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Commission Type</label>
                  <p className="mt-1">{getCommissionTypeBadge(selectedEarning.earning?.commission_type)}</p>
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Received</label>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{(selectedEarning.earning?.payment_received || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Commission %</label>
                  <p className="text-lg font-bold text-purple-600">
                    {selectedEarning.earning?.commission_percentage}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Commission Amount</label>
                  <p className="text-lg font-bold text-green-600">
                    ₹{(selectedEarning.earning?.commission_amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-red-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-500">TDS (5%)</label>
                  <p className="text-lg font-bold text-red-600">
                    ₹{(selectedEarning.earning?.tds_amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Net Payable</label>
                  <p className="text-lg font-bold text-green-600">
                    ₹{(selectedEarning.earning?.net_commission || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Property & Project Info */}
              {selectedEarning.property && (
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Property Details</h3>
                  <p className="text-sm text-gray-600">Property: {selectedEarning.property.display_name}</p>
                  <p className="text-sm text-gray-600">Project: {selectedEarning.project?.name}</p>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1">{getStatusBadge(selectedEarning.earning?.status)}</p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionDashboard;
