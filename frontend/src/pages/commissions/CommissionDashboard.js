import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, CheckCircle, XCircle, Clock, 
  Eye, ThumbsUp, ThumbsDown, PauseCircle, Wallet, Download,
  Filter, Search, AlertCircle, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import apiInstance from '../../services/api';
import { toast } from 'sonner';

const CommissionDashboard = () => {
  const [earnings, setEarnings] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('earnings'); // 'earnings' or 'payouts'
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [tenantId, setTenantId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Summary stats
  const [summary, setSummary] = useState({
    total_earnings: 0,
    pending_amount: 0,
    approved_amount: 0,
    paid_amount: 0,
    by_type: { direct: {}, gap: {} }
  });

  useEffect(() => {
    initializeComponent();
  }, []);

  useEffect(() => {
    if (tenantId && currentUser) {
      fetchEarnings();
      if (isAdmin) {
        fetchPayouts();
      }
    }
  }, [filterStatus, filterType, tenantId, currentUser]);

  const initializeComponent = async () => {
    try {
      // Get current user info
      const userResponse = await apiInstance.get('/user/me');
      const user = userResponse.data;
      setCurrentUser(user);
      
      const currentTenantId = user.tenant_id || localStorage.getItem('tenant_id');
      setTenantId(currentTenantId);
      
      // Check if user is admin (can approve commissions)
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
      const params = { 
        tenant_id: tenantId, 
        limit: 100 
      };
      
      // For non-admin users, fetch only their commissions
      if (!isAdmin && currentUser) {
        params.staff_id = currentUser.id;
      }
      
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterType !== 'all') params.commission_type = filterType;
      
      const response = await apiInstance.get('/commissions/earnings', { params });
      setEarnings(response.data.earnings || []);
      
      // Fetch summary for current user
      if (currentUser) {
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
      const staffId = isAdmin ? null : currentUser.id;
      if (staffId) {
        const response = await apiInstance.get(`/commissions/staff/${staffId}/summary`, {
          params: { tenant_id: tenantId }
        });
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      const response = await apiInstance.get('/commissions/payouts', {
        params: { tenant_id: tenantId, limit: 100 }
      });
      setPayouts(response.data.payouts || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const handleApprove = async (earningId, action, notes = '') => {
    if (!isAdmin) {
      toast.error('Only admins can approve commissions');
      return;
    }

    try {
      setLoading(true);
      const response = await apiInstance.post(`/commissions/earnings/${earningId}/approve`, {
        action, // 'approve', 'reject', or 'hold'
        notes
      });
      
      if (response.data.success) {
        const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'put on hold';
        toast.success(`Commission ${actionText} successfully`);
        setShowApprovalModal(false);
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

  const filteredEarnings = earnings.filter(earning => {
    const matchesSearch = 
      earning.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.sales_staff_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || earning.status === filterStatus;
    const matchesType = filterType === 'all' || earning.commission_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="text-green-600" size={36} />
            Commission Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage and approve commission earnings</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ₹{(summary.total_gross || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {summary.pending_count || 0}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Clock className="text-yellow-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {summary.approved_count || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Payable</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    ₹{(summary.total_net || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">TDS</th>
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
                ) : filteredEarnings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                      No commission earnings found
                    </td>
                  </tr>
                ) : (
                  filteredEarnings.map((earning) => (
                    <tr key={earning.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(earning.earned_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{earning.staff_name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{earning.staff_role || 'Agent'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCommissionTypeBadge(earning.commission_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        ₹{earning.payment_amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{earning.gross_commission?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        ₹{earning.tds_amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        ₹{earning.net_commission?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(earning.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {earning.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(earning.id, 'approve')}
                              className="text-green-600 hover:text-green-800 font-medium text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(earning.id, 'reject')}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {earning.status === 'approved' && (
                          <span className="text-sm text-gray-500">Ready for payout</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionDashboard;
